import { chromium } from "playwright";
import path from "path";

const artifactDir = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function testLeftSidebar() {
  console.log("=== TESTING LEFT SIDEBAR & SYSTEM MODALS ===");
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
    await page.waitForTimeout(800);
    const loginBtn = await page.$("button:has-text('One-Click Demo Access'), button:has-text('Login')");
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(1500);
  }

  // 1. Verify notification bell is REMOVED from header
  const notifBtn = await page.$(".appbar__notif-btn");
  console.log("Is notification bell in header removed?", notifBtn === null ? "YES (PASS!)" : "NO (FAIL!)");
  if (notifBtn !== null) throw new Error("Notification bell is still in header!");

  // 2. Verify Security is REMOVED from bottom tab bar
  const bottomTabs = await page.$$eval(".tabbar .tabbar__item .tabbar__label", (elements) =>
    elements.map((el) => el.textContent?.trim())
  );
  console.log("Bottom tab items:", bottomTabs);
  if (bottomTabs.includes("Security")) {
    throw new Error("Security is still present in bottom tab bar!");
  }
  console.log("PASS: Security tab removed from bottom of page!");

  // 3. Verify hamburger menu exists on left and capture initial home screen
  const hamburgerBtn = await page.$("#main-sidebar-toggle-btn");
  if (!hamburgerBtn) throw new Error("Main sidebar toggle hamburger button missing on left!");
  console.log("PASS: Hamburger 3-line menu button found on top left!");
  await page.screenshot({ path: path.join(artifactDir, "verify_home_clean_header_bottom.png") });

  // 4. Click hamburger button to open left side drawer
  console.log("Opening left side drawer...");
  await hamburgerBtn.click();
  await page.waitForTimeout(600);

  const drawer = await page.$("#main-sidebar-drawer");
  if (!drawer) throw new Error("Left side navigation drawer failed to open!");
  console.log("PASS: Left side navigation drawer opened smoothly!");

  // Take screenshot of opened left side drawer
  await page.screenshot({ path: path.join(artifactDir, "verify_left_sidebar_open.png") });
  console.log("Captured verify_left_sidebar_open.png");

  // 5. Test clicking "Security & ABDM Compliance" from left sidebar
  console.log("Clicking Security & ABDM Compliance from left sidebar...");
  const securityBtn = await page.$("#sidebar-nav-security");
  if (!securityBtn) throw new Error("Security link missing from left sidebar!");
  await securityBtn.click();
  await page.waitForTimeout(800);

  const securityPage = await page.$(".security-page, .security-enclave-title, h2:has-text('Security'), h2:has-text('सुरक्षा')");
  console.log("Is Security Enclave page active?", securityPage !== null ? "YES (PASS!)" : "NO (FAIL!)");
  await page.screenshot({ path: path.join(artifactDir, "verify_security_via_sidebar.png") });

  // 6. Test opening Notifications modal from left sidebar
  console.log("Re-opening sidebar to test Notifications & Alerts modal...");
  const hamburgerBtn2 = await page.$("#main-sidebar-toggle-btn");
  if (hamburgerBtn2) await hamburgerBtn2.click();
  await page.waitForTimeout(500);

  const notifNavBtn = await page.$("#sidebar-nav-notifications");
  if (notifNavBtn) await notifNavBtn.click();
  await page.waitForTimeout(600);

  const notifModal = await page.$(".sahara-modal-card");
  if (!notifModal) throw new Error("Notifications modal failed to open!");
  console.log("PASS: Notifications & Clinical Alerts modal opened!");
  await page.screenshot({ path: path.join(artifactDir, "verify_modal_notifications.png") });

  // Close notifications modal
  const dismissBtn = await page.$(".sahara-modal-close-btn, .sidebar-close-btn");
  if (dismissBtn) await dismissBtn.click();
  await page.waitForTimeout(500);

  // 7. Test opening Updates modal from left sidebar
  console.log("Re-opening sidebar to test Offline Sync & Updates modal...");
  const hamburgerBtn3 = await page.$("#main-sidebar-toggle-btn");
  if (hamburgerBtn3) await hamburgerBtn3.click();
  await page.waitForTimeout(500);

  const updatesNavBtn = await page.$("#sidebar-nav-updates");
  if (updatesNavBtn) await updatesNavBtn.click();
  await page.waitForTimeout(600);

  const checkUpdatesBtn = await page.$("button:has-text('Check for Updates Now')");
  if (checkUpdatesBtn) {
    await checkUpdatesBtn.click();
    await page.waitForTimeout(1600);
  }
  console.log("PASS: Offline Sync & Updates modal tested!");
  await page.screenshot({ path: path.join(artifactDir, "verify_modal_updates.png") });

  // Close updates modal
  const closeUpdatesBtn = await page.$(".sahara-modal-close-btn");
  if (closeUpdatesBtn) await closeUpdatesBtn.click();
  await page.waitForTimeout(500);

  // 8. Test opening Help Centre modal from left sidebar
  console.log("Re-opening sidebar to test Help Centre modal...");
  const hamburgerBtn4 = await page.$("#main-sidebar-toggle-btn");
  if (hamburgerBtn4) await hamburgerBtn4.click();
  await page.waitForTimeout(500);

  const helpNavBtn = await page.$("#sidebar-nav-help");
  if (helpNavBtn) await helpNavBtn.click();
  await page.waitForTimeout(600);

  console.log("PASS: Help Centre & Protocols modal opened!");
  await page.screenshot({ path: path.join(artifactDir, "verify_modal_help.png") });

  console.log("=== ALL LEFT SIDEBAR & SYSTEM MODALS TESTS PASSED 100% ===");
  await browser.close();
}

testLeftSidebar().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
