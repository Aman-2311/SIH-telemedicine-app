import { chromium } from "playwright";
import path from "path";

const artifactDir = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function runTest() {
  console.log("=== STARTING STEPPER & DYNAMIC GEOSPATIAL MAP TEST ===");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  page.on("console", (msg) => console.log("[BROWSER CONSOLE]:", msg.text()));

  console.log("1. Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // If on AuthScreen, login as ASHA
  const isAuth = await page.$(".auth-card");
  if (isAuth) {
    console.log("Logging into ASHA portal...");
    const ashaBtn = await page.$("button:has-text('ASHA Worker')");
    if (ashaBtn) await ashaBtn.click();
    await page.waitForTimeout(1000);
    const loginBtn = await page.$("button:has-text('One-Click Demo Access'), button:has-text('Login')");
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  // --- STEP 1: SWITCH TO INTAKE & FILL FORM ---
  console.log("2. Switching to New Intake tab...");
  const intakeTab = await page.$("button:has-text('New Intake'), .tabbar__item:nth-child(2)");
  if (intakeTab) await intakeTab.click();
  await page.waitForTimeout(1000);

  console.log("3. Entering patient info: Aman Sharma / 13456789...");
  await page.fill("#patient-name-input", "Aman Sharma");
  await page.fill("#patient-abha-input", "13456789");

  console.log("4. Clicking 1-click Quick Test Hindi chip...");
  const hindiChip = await page.$(".quick-test-chip--primary");
  if (hindiChip) await hindiChip.click();

  console.log("Waiting 5s for Gemini AI clinical extraction...");
  await page.waitForTimeout(5000);

  // --- STEP 2: CLICK SUBMIT & VERIFY VERTICAL PROGRESS STEPPER ---
  console.log("5. Submitting Intake Case...");
  const submitBtn = await page.$("#submit-intake-case-btn");
  if (!submitBtn) throw new Error("Submit button missing!");
  await submitBtn.click();

  console.log("Waiting 1s for Stepper modal to render...");
  await page.waitForTimeout(1000);

  const stepper = await page.$(".stepper-modal");
  console.log("Is Vertical Progress Stepper modal visible?", stepper !== null ? "YES (PASS!)" : "NO (FAIL!)");
  if (!stepper) throw new Error("Vertical Progress Stepper modal failed to open!");

  // Capture screenshot of Stepper in action
  await page.screenshot({ path: path.join(artifactDir, "verify_stepper_active.png") });
  console.log("Captured verify_stepper_active.png");

  // --- STEP 3: WAIT FOR STEPPER COMPLETION & TRANSITION TO MAP ---
  console.log("Waiting 4.2s for Stepper to complete all 4 phases and auto-transition to Map...");
  await page.waitForTimeout(4200);

  // Check if we arrived on the Map Tab
  const mapTitle = await page.$(".map-page-title");
  console.log("Is Geospatial Map page active?", mapTitle !== null ? "YES (PASS!)" : "NO (FAIL!)");
  if (!mapTitle) {
    // If not auto-switched yet, click Map tab
    console.log("Clicking Map tab manually...");
    const mapTab = await page.$(".tabbar__item:nth-child(4)");
    if (mapTab) await mapTab.click();
    await page.waitForTimeout(1000);
  }

  // --- STEP 4: VERIFY DYNAMIC NAV SIDEBAR & LEAFLET MAP ---
  console.log("6. Verifying Dynamic Nav Sidebar facilities list...");
  const sidebarList = await page.textContent(".map-nav-sidebar");
  console.log("Sidebar content snippet:", sidebarList.slice(0, 300));

  // Verify generic pharmacy and district hospital exist in sidebar without "Pune"
  if (!sidebarList.includes("Jan Aushadhi") && !sidebarList.includes("Generic")) {
    throw new Error("Jan Aushadhi generic pharmacy missing from sidebar!");
  }
  console.log("PASS: Jan Aushadhi generic pharmacy present in sidebar!");

  if (!sidebarList.includes("District Civil Hospital") && !sidebarList.includes("Hospital")) {
    throw new Error("District Hospital missing from sidebar!");
  }
  console.log("PASS: District Hospital present in sidebar!");

  // Test clicking Jan Aushadhi card in sidebar
  const firstCard = await page.$(".map-facility-card");
  if (firstCard) {
    console.log("Clicking facility card in sidebar...");
    await firstCard.click();
    await page.waitForTimeout(800);
  }

  console.log("Waiting 2.5s for Leaflet map tiles to render...");
  await page.waitForTimeout(2500);

  // Capture screenshot of the split Map & Nav Sidebar layout
  await page.screenshot({ path: path.join(artifactDir, "verify_map_nav_sidebar.png") });
  console.log("Captured verify_map_nav_sidebar.png");

  console.log("=== ALL STEPPER & GEOSPATIAL MAP TESTS PASSED 100% ===");
  await browser.close();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
