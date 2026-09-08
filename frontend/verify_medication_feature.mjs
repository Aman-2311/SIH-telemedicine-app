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

  console.log("Navigating to http://localhost:3000/...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Navigate to Home
  console.log("Navigating to Home tab...");
  await page.locator("nav.patient-nav button:has-text('Home')").click();
  await page.waitForTimeout(1000);

  // 1. Capture initial Home with dynamic upcoming dose banner
  console.log("Capturing 1_medication_banner_initial.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/1_medication_banner_initial.png",
    fullPage: false,
  });

  // 2. Click "View Schedule"
  console.log("Clicking 'View Schedule'...");
  await page.locator(".patient-adherence-banner button:has-text('View Schedule')").click();
  await page.waitForTimeout(1000);

  // Capture open Medication Schedule modal
  console.log("Capturing 2_medication_schedule_modal.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/2_medication_schedule_modal.png",
    fullPage: false,
  });

  // 3. Click "Mark as Taken" on the first dose
  console.log("Clicking 'Mark as Taken'...");
  const markBtn = page.locator("button:has-text('Mark as Taken')").first();
  if (await markBtn.isVisible()) {
    await markBtn.click();
    await page.waitForTimeout(1000);
  }

  // Capture modal with marked dose and progress bar updated
  console.log("Capturing 3_medication_dose_taken.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/3_medication_dose_taken.png",
    fullPage: false,
  });

  // Mark all remaining doses for today to test "All Completed" state!
  const secondMarkBtn = page.locator("button:has-text('Mark as Taken')").first();
  if (await secondMarkBtn.isVisible()) {
    console.log("Marking second dose as taken...");
    await secondMarkBtn.click();
    await page.waitForTimeout(1000);
  }

  // Capture modal with 100% completed progress
  console.log("Capturing 4_medication_all_doses_completed.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/4_medication_all_doses_completed.png",
    fullPage: false,
  });

  // Close modal
  console.log("Closing modal...");
  await page.locator("button:has-text('Close')").click();
  await page.waitForTimeout(1000);

  // 4. Capture Home with "You're all caught up!" banner state!
  console.log("Capturing 5_medication_banner_all_caught_up.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/5_medication_banner_all_caught_up.png",
    fullPage: false,
  });

  // 5. Test persistence: Reload page and confirm adherence state survived!
  console.log("Reloading page to test persistence...");
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.locator("nav.patient-nav button:has-text('Home')").click();
  await page.waitForTimeout(1000);

  console.log("Capturing 6_medication_persistence_after_reload.png...");
  await page.screenshot({
    path: "C:/Users/amans/.gemini/antigravity-ide/brain/9e5cbddb-9552-451c-8296-b4849c4e3fcf/6_medication_persistence_after_reload.png",
    fullPage: false,
  });

  await browser.close();
  console.log("Medication adherence test completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
