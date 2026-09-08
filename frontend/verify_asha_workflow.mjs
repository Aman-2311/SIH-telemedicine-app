import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function run() {
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
      JSON.stringify({
        id: "asha-101",
        full_name: "Sunita Devi",
        abha_id: "ASHA-MH-7712",
        role: "asha",
      })
    );
    localStorage.setItem("sahara_access_token", "mock_token_asha");
  });

  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000/...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  console.log("Waiting for #main-sidebar-toggle-btn to appear...");
  await page.waitForSelector("#main-sidebar-toggle-btn", { timeout: 15000 });
  await page.waitForTimeout(500);

  // 1. Test Global Header Search
  console.log("Testing Global Header Search...");
  const searchInput = page.locator("#global-patient-search-input");
  await searchInput.waitFor({ state: "visible", timeout: 8000 });
  await searchInput.click();
  await searchInput.fill("Rameshwar");
  await page.waitForTimeout(800);

  const val = await searchInput.inputValue();
  console.log("Input value is:", val);
  const appbarHtml = await page.locator(".appbar__right").innerHTML();
  console.log("Appbar right HTML snippet:", appbarHtml.slice(0, 300));

  // Check search dropdown
  const resultItem = page.locator('text=Rameshwar Rao').first();
  await resultItem.waitFor({ state: "visible", timeout: 5000 });
  await resultItem.click();
  await page.waitForTimeout(800);

  console.log("Capturing 1_asha_search_and_case_details.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "1_asha_search_and_case_details.png"),
  });

  // 2. Test Hamburger Menu & Patient History
  console.log("Testing Hamburger Menu...");
  const menuBtn = page.locator("#main-sidebar-toggle-btn");
  await menuBtn.click();
  await page.waitForTimeout(500);

  console.log("Capturing 2_asha_sidebar_clinical_workflow.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "2_asha_sidebar_clinical_workflow.png"),
  });

  // Click Patient History in Sidebar
  console.log("Navigating to Patient History...");
  const historyNavBtn = page.locator("#sidebar-nav-history");
  await historyNavBtn.click();
  await page.waitForTimeout(800);

  console.log("Capturing 3_asha_patient_history_page.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "3_asha_patient_history_page.png"),
  });

  // 3. Test New Patient Intake & Compact 5-Step Stepper
  console.log("Navigating to New Intake...");
  const intakeTabBtn = page.locator('button:has-text("New Patient Intake"), .tabbar__item:has-text("New Intake")').first();
  await intakeTabBtn.click();
  await page.waitForTimeout(800);

  // Fill in intake details or use quick fill
  const nameInput = page.locator('#patient-name-input');
  await nameInput.fill("Santosh Jadhav");

  const abhaInput = page.locator('#patient-abha-input');
  await abhaInput.fill("91-4499-1029-3388");

  // Click quick test button to fill symptoms
  const quickTestBtn = page.locator('button:has-text("English Sample")').first();
  if (await quickTestBtn.isVisible()) {
    await quickTestBtn.click();
  }

  await page.waitForTimeout(500);

  // Click Submit
  const submitBtn = page.locator('#submit-intake-case-btn');
  await submitBtn.click();
  await page.waitForTimeout(400);

  console.log("Capturing 4_asha_compact_5step_stepper.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "4_asha_compact_5step_stepper.png"),
  });

  // Wait for submission completion to reach Confirmation card
  console.log("Waiting for confirmation state...");
  await page.waitForTimeout(3200);

  console.log("Capturing 5_asha_submission_confirmation.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "5_asha_submission_confirmation.png"),
  });

  // Click [Back to Home]
  const backHomeBtn = page.locator('button:has-text("Back to Home")');
  if (await backHomeBtn.isVisible()) {
    await backHomeBtn.click();
  }
  await page.waitForTimeout(600);

  // 4. Test Geospatial Care Map Tab
  console.log("Navigating to Map Tab...");
  const mapTabBtn = page.locator('.tabbar__item:has-text("Map")').first();
  await mapTabBtn.click();
  await page.waitForTimeout(1200);

  console.log("Capturing 6_asha_map_geospatial_care.png...");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "6_asha_map_geospatial_care.png"),
  });

  console.log("All ASHA workflow verification steps passed!");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
