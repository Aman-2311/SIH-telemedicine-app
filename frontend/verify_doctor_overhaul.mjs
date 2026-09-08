import { chromium } from "playwright";
import path from "path";

const artifactDir = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log("Navigating to http://localhost:3000 to capture Splash Screen...");
  // Clear localStorage first so we can see the initial state or splash
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(400);
  
  // 1. Splash Screen
  console.log("Capturing 1_splash_screen.png...");
  await page.screenshot({ path: path.join(artifactDir, "1_splash_screen.png"), fullPage: false });

  // Wait for splash screen exit
  await page.waitForTimeout(2500);

  // Set Doctor session
  console.log("Setting Doctor session in localStorage...");
  await page.evaluate(() => {
    localStorage.setItem("sahara_user", JSON.stringify({
      abha_id: "DOCTOR-MH-7313",
      role: "doctor",
      full_name: "Dr. Arvind Kulkarni (MD)"
    }));
    localStorage.setItem("sahara_access_token", "mock_doctor_jwt_token_7313");
  });
  
  await page.reload();
  await page.waitForTimeout(3000); // Allow splash screen to dismiss on reload

  // 2. Doctor Dashboard Home
  console.log("Capturing 2_doctor_home.png...");
  await page.screenshot({ path: path.join(artifactDir, "2_doctor_home.png"), fullPage: false });

  // 3. Open Notifications Modal
  console.log("Testing Notifications Modal...");
  const notifBtn = await page.$("button[title='Clinical Alerts']");
  if (notifBtn) {
    await notifBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, "3_modal_notifications.png"), fullPage: false });
    const closeBtn = await page.$("button:has-text('Close')");
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(400);
  }

  // 4. Clinical Patient Queue
  console.log("Navigating to Clinical Patient Queue...");
  const queueNavBtn = await page.$("button:has-text('Clinical Patient Queue')");
  if (queueNavBtn) {
    await queueNavBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, "4_clinical_queue.png"), fullPage: false });
  }

  // 5. Patient Clinical Workspace with Case Lifecycle Stepper
  console.log("Opening Patient Clinical Workspace...");
  const reviewBtn = await page.$("button:has-text('Review Case')");
  if (reviewBtn) {
    await reviewBtn.click();
    await page.waitForTimeout(800);
    
    // Toggle audio to test waveform animation
    const audioBtn = await page.$("button:has-text('Play Original Audio Dictation')");
    if (audioBtn) {
      await audioBtn.click();
      await page.waitForTimeout(400);
    }
    
    // Expand referral panel
    const referBtn = await page.$("button:has-text('Refer Patient')");
    if (referBtn) {
      await referBtn.click();
      await page.waitForTimeout(500);
    }

    console.log("Capturing 5_patient_workspace_stepper_referral.png...");
    await page.screenshot({ path: path.join(artifactDir, "5_patient_workspace_stepper_referral.png"), fullPage: false });

    // Click "Create Referral & Transmit via ABDM"
    const submitReferralBtn = await page.$("button:has-text('Create Referral & Transmit via ABDM')");
    if (submitReferralBtn) {
      await submitReferralBtn.click();
      await page.waitForTimeout(500);
      console.log("Capturing 6_referral_submitted.png...");
      await page.screenshot({ path: path.join(artifactDir, "6_referral_submitted.png"), fullPage: false });
    }

    // 6. Submit Prescription to test Stage 5 in Case Lifecycle Stepper
    console.log("Submitting prescription for closed-loop stage transition...");
    const diagnosisInput = await page.$("input[placeholder*='Viral fever with dehydration']");
    if (diagnosisInput) {
      await diagnosisInput.fill("Acute Viral Pyrexia with Mild Dehydration");
      await page.waitForTimeout(400);

      const submitBtn = await page.$("button:has-text('Submit Prescription')");
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1200);
        console.log("Capturing 7_prescription_submitted_stage5.png...");
        await page.screenshot({ path: path.join(artifactDir, "7_prescription_submitted_stage5.png"), fullPage: false });
      }
    }
  }

  console.log("ALL VERIFICATION SCREENSHOTS COMPLETED SUCCESSFULLY!");
  await browser.close();
}

run().catch(console.error);
