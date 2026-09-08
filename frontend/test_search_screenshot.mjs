import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ["geolocation"],
    geolocation: { latitude: 19.076, longitude: 72.8777 },
  });

  await context.addInitScript(() => {
    localStorage.setItem(
      "sahara_user",
      JSON.stringify({ id: "asha-101", full_name: "Sunita Devi", abha_id: "ASHA-MH-7712", role: "asha" })
    );
    localStorage.setItem("sahara_access_token", "mock_token_asha");
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  console.log("Waiting for #main-sidebar-toggle-btn...");
  await page.waitForSelector("#main-sidebar-toggle-btn", { timeout: 15000 });

  const input = page.locator("#global-patient-search-input");
  await input.click();
  await input.fill("Rameshwar");
  await page.waitForTimeout(1000);

  const val = await input.inputValue();
  console.log("Actual input value:", val);

  await browser.close();
}
main();
