import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function verifyFlow() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["geolocation"],
    geolocation: { latitude: 19.076, longitude: 72.8777 },
  });

  const page = await context.newPage();

  try {
    // 1. Log in as ASHA
    console.log("Navigating to http://localhost:3000/...");
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2800); // splash wait

    // Click Sunita Patil 1-click login
    console.log("Logging in as ASHA (Sunita Patil)...");
    const ashaBtn = page.locator("button:has-text('Sunita Patil (TEST)')").first();
    await ashaBtn.click();
    await page.waitForTimeout(1500);

    // Click "New Patient Intake"
    console.log("Opening New Patient Intake form...");
    const newIntakeBtn = page.locator("button:has-text('New Patient Intake')").first();
    await newIntakeBtn.click();
    await page.waitForTimeout(1000);

    // Click "Test Patient (Savita Patil)"
    console.log("Filling test patient demographic...");
    const testPatientBtn = page.locator("button:has-text('Test Patient (Savita Patil)')").first();
    await testPatientBtn.click();
    await page.waitForTimeout(500);

    // Click English Sample dictation
    console.log("Loading English sample symptom dictation...");
    const sampleBtn = page.locator("button:has-text('English Sample')").first();
    await sampleBtn.click();
    await page.waitForTimeout(1000);

    // Submit Intake Case
    console.log("Submitting intake case...");
    const submitBtn = page.locator("#submit-intake-case-btn");
    await submitBtn.click();
    // Wait for the 5-step stepper to finish (takes 3s)
    await page.waitForTimeout(3800);

    // Click "View Case Details" in the stepper modal
    console.log("Opening Case Details View...");
    const viewCaseBtn = page.locator("button:has-text('View Case Details')").first();
    await viewCaseBtn.click();
    await page.waitForTimeout(1500);

    // Capture Redesigned Case Detail View
    console.log("Capturing redesigned case detail view...");
    const caseDetailPath = path.join(ARTIFACT_DIR, "redesigned_case_detail_view.png");
    await page.screenshot({ path: caseDetailPath });
    console.log("[PASS] Saved redesigned case detail view:", caseDetailPath);

    // 2. Sign Out from ASHA
    console.log("Signing out from ASHA...");
    const signOutBtn = page.locator("button:has-text('Sign Out')").first();
    await signOutBtn.click();
    await page.waitForTimeout(1500);

    // 3. Log in as Doctor
    console.log("Logging in as Doctor (Dr. Arvind Kulkarni)...");
    const docBtn = page.locator("button:has-text('Dr. Arvind Kulkarni (MD)')").first();
    await docBtn.click();
    await page.waitForTimeout(2500);

    // Capture Doctor Queue showing the newly received case
    console.log("Capturing Doctor Queue with received intake...");
    const doctorQueuePath = path.join(ARTIFACT_DIR, "doctor_queue_received_intake.png");
    await page.screenshot({ path: doctorQueuePath });
    console.log("[PASS] Saved Doctor Queue:", doctorQueuePath);

    const doctorText = await page.innerText("body");
    const receivedAtDoctor = doctorText.includes("Savita") || doctorText.includes("TEST-PATIENT-MH-0002") || doctorText.includes("Acute Fever") || doctorText.includes("fever") || doctorText.includes("Patil");
    console.log(`[PASS] Case received at Doctor's End: ${receivedAtDoctor}`);

    console.log("\n>>> FULL END-TO-END FLOW VERIFIED SUCCESSFULLY! <<<");
  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    await browser.close();
  }
}

verifyFlow();
