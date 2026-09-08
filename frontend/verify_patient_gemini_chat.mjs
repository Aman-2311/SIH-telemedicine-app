import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  
  // Set patient in localStorage before navigating
  await context.addInitScript(() => {
    localStorage.setItem(
      "sahara_user",
      JSON.stringify({
        abha_id: "PATIENT-MH-6562",
        role: "patient",
        full_name: "Savita Patil",
      })
    );
    localStorage.setItem("sahara_access_token", "mock_patient_jwt_token_6562");
  });

  const page = await context.newPage();
  console.log("Navigating to Patient Portal...");
  await page.goto("http://localhost:3000");

  // Wait for splash screen / main page
  await page.waitForTimeout(3000);

  // Navigate to "Ask SAHARA" tab
  console.log("Navigating to Ask SAHARA tab...");
  const askSaharaBtn = page.locator('.tabbar__item:has-text("Ask SAHARA"), button:has-text("Ask SAHARA")').first();
  if (await askSaharaBtn.isVisible()) {
    await askSaharaBtn.click();
    await page.waitForTimeout(600);
  }

  // Find chat input
  const chatInput = page.locator(".patient-chat-input");
  await chatInput.waitFor({ state: "visible", timeout: 8000 });

  const testQuestion = "Why do I get headaches after working in the sun all day?";
  console.log("Typing test question:", testQuestion);
  await chatInput.fill(testQuestion);
  await page.waitForTimeout(400);

  // Click send button
  const sendBtn = page.locator(".patient-chat-send-btn");
  await sendBtn.click();
  console.log("Message sent! Waiting for Gemini response...");

  // Wait for Gemini reply to finish
  console.log("Waiting for Gemini reply to complete...");
  try {
    await page.locator(".patient-typing-bubble").waitFor({ state: "detached", timeout: 15000 });
  } catch (e) {
    console.log("Timed out waiting for detached typing bubble, proceeding...");
  }
  await page.waitForTimeout(1000);

  // Extract all chat messages
  const messages = await page.locator(".patient-chat-thread").innerText();
  console.log("Chat thread text:\n", messages);

  const hasFallback = messages.includes('I found information related to');
  console.log("Contains old hardcoded fallback?", hasFallback);

  const screenshotPath = path.join(ARTIFACT_DIR, "patient_gemini_live_chat.png");
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
