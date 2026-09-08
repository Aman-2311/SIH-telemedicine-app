import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Set mock patient user in localStorage
  await page.addInitScript(() => {
    localStorage.setItem("sahara_access_token", "mock_jwt_token_patient_999");
    localStorage.setItem(
      "sahara_user",
      JSON.stringify({
        abha_id: "PATIENT-MH-6562",
        role: "patient",
        full_name: "Savita Patil",
        phone_number: "98200 12345",
      })
    );
  });

  console.log("Navigating to patient portal on http://localhost:3000/...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // Allow splash screen to dismiss

  // 1. Verify Ask SAHARA (Default active tab)
  console.log("Capturing 1_patient_ask_sahara.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/1_patient_ask_sahara.png",
    fullPage: false,
  });

  // 2. Click Home nav item
  console.log("Clicking Home...");
  await page.locator("nav.patient-nav button:has-text('Home')").click();
  await page.waitForTimeout(1000);
  console.log("Capturing 2_patient_home.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/2_patient_home.png",
    fullPage: false,
  });

  // 3. Click My Prescriptions nav item
  console.log("Clicking My Prescriptions...");
  await page.locator("nav.patient-nav button:has-text('My Prescriptions')").click();
  await page.waitForTimeout(1000);
  console.log("Capturing 3_patient_prescriptions.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/3_patient_prescriptions.png",
    fullPage: false,
  });

  // 4. Click Find Care Near You nav item
  console.log("Clicking Find Care Near You...");
  await page.locator("nav.patient-nav button:has-text('Find Care Near You')").click();
  await page.waitForTimeout(1500);
  console.log("Capturing 4_patient_map.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/4_patient_map.png",
    fullPage: false,
  });

  // 5. Click Health ID Card nav item
  console.log("Clicking Health ID Card...");
  await page.locator("nav.patient-nav button:has-text('Health ID Card')").click();
  await page.waitForTimeout(1000);
  console.log("Capturing 5_patient_health_id.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/5_patient_health_id.png",
    fullPage: false,
  });

  // 6. Click Urgent Help card to verify Emergency Care
  console.log("Clicking Urgent Help...");
  await page.locator(".patient-urgent-card").click();
  await page.waitForTimeout(1000);
  console.log("Capturing 6_patient_emergency.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/6_patient_emergency.png",
    fullPage: false,
  });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error during verification:", err);
  process.exit(1);
});
