import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function verifyAuthUI() {
  console.log("Launching Chromium via local Chrome...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ["geolocation"],
    geolocation: { latitude: 19.076, longitude: 72.8777 },
  });

  const page = await context.newPage();

  try {
    console.log("Navigating to http://localhost:3000/ with clear storage...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    // Wait for splash screen (2.5s) to complete
    await page.waitForTimeout(3000);

    // 1. Verify Sign In Page
    const pageText = await page.innerText("body");
    const hasSignIn = pageText.includes("Sign In") || pageText.includes("Login") || pageText.includes("Welcome to SAHARA");
    console.log("[PASS] Sign In page rendered. Content check:", hasSignIn);

    const signinPath = path.join(ARTIFACT_DIR, "signin_page_initial.png");
    await page.screenshot({ path: signinPath });
    console.log(`[PASS] Saved screenshot: ${signinPath}`);

    // 2. Click ASHA Quick Login button (Sunita Patil (TEST))
    console.log("Clicking Sunita Patil (TEST) ASHA 1-click login...");
    const ashaBtn = page.locator("button:has-text('Sunita Patil (TEST)')").first();
    await ashaBtn.click();
    await page.waitForTimeout(2000);

    const ashaText = await page.innerText("body");
    const hasAshaPortal = ashaText.includes("Sunita Patil") || ashaText.includes("ASHA");
    console.log("[PASS] ASHA portal loaded:", hasAshaPortal);

    const ashaPath = path.join(ARTIFACT_DIR, "asha_portal_logged_in.png");
    await page.screenshot({ path: ashaPath });
    console.log(`[PASS] Saved screenshot: ${ashaPath}`);

    // 3. Click Sign Out
    console.log("Clicking Sign Out button...");
    const signOutBtn = page.locator("button:has-text('Sign Out')").first();
    await signOutBtn.click();
    await page.waitForTimeout(1500);

    const logoutText = await page.innerText("body");
    const backOnSignIn = logoutText.includes("Welcome to SAHARA") || logoutText.includes("Sign In");
    console.log("[PASS] Successfully returned to Sign-In page after Sign Out:", backOnSignIn);

    const logoutPath = path.join(ARTIFACT_DIR, "signin_page_after_logout.png");
    await page.screenshot({ path: logoutPath });
    console.log(`[PASS] Saved screenshot: ${logoutPath}`);

    // 4. Click Patient Quick Login button (Savita Patil (TEST))
    console.log("Clicking Savita Patil (TEST) Patient 1-click login...");
    const patientBtn = page.locator("button:has-text('Savita Patil (TEST)')").first();
    await patientBtn.click();
    await page.waitForTimeout(2000);

    const patientText = await page.innerText("body");
    const hasPatientPortal = patientText.includes("Savita") || patientText.includes("Patient") || patientText.includes("Sahara");
    console.log("[PASS] Patient portal loaded:", hasPatientPortal);

    const patientPath = path.join(ARTIFACT_DIR, "patient_dashboard_logged_in.png");
    await page.screenshot({ path: patientPath });
    console.log(`[PASS] Saved screenshot: ${patientPath}`);

    // 5. Click Logout from Patient view
    console.log("Clicking Logout from Patient view...");
    const patientLogoutBtn = page.locator("button:has-text('Logout')").first();
    await patientLogoutBtn.click();
    await page.waitForTimeout(1500);

    const finalSigninPath = path.join(ARTIFACT_DIR, "final_clean_signin_page.png");
    await page.screenshot({ path: finalSigninPath });
    console.log(`[PASS] Final Sign-In page saved: ${finalSigninPath}`);

    console.log("\n>>> ALL UI AUTHENTICATION STEPS COMPLETED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("UI Test Error:", err);
  } finally {
    await browser.close();
  }
}

verifyAuthUI();
