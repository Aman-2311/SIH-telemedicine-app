import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(() => {
    localStorage.setItem(
      "sahara_user",
      JSON.stringify({ id: "asha-101", full_name: "Sunita Devi", abha_id: "ASHA-MH-7712", role: "asha" })
    );
    localStorage.setItem("sahara_access_token", "mock_token_asha");
  });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);

  const input = page.locator('.hidden.md\\:flex input[placeholder*="Search patients"]');
  console.log("Input count:", await input.count());

  // Set value using native value setter for React
  await input.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, "Rameshwar");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.waitForTimeout(500);
  const html = await page.locator(".appbar__right").innerHTML();
  console.log("Dropdown has Rameshwar:", html.includes("Rameshwar"));
  await page.screenshot({ path: "search_debug_result.png" });

  await browser.close();
}
main();
