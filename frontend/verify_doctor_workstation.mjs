import { chromium } from "playwright";
import path from "path";

const artifactDir = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  // Target desktop resolution for clinical workstation
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  
  // Set Doctor session directly in localStorage
  console.log("Setting Doctor session in localStorage...");
  await page.evaluate(() => {
    localStorage.setItem("sahara_user", JSON.stringify({
      abha_id: "DOCTOR-MH-7313",
      role: "doctor",
      full_name: "Dr. Arvind Kulkarni (MD)"
    }));
    localStorage.setItem("sahara_access_token", "mock_doctor_jwt_token_7313");
  });
  
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  // 1. Capture Doctor Dashboard Home (Panel 1)
  console.log("Capturing Doctor Dashboard Home (Panel 1)...");
  await page.screenshot({ path: path.join(artifactDir, "doctor_1_dashboard_home.png"), fullPage: true });

  // 2. Click "Clinical Patient Queue" in sidebar (Panel 2)
  console.log("Navigating to Clinical Patient Queue (Panel 2)...");
  const queueNavBtn = await page.$("button:has-text('Clinical Patient Queue')");
  if (queueNavBtn) {
    await queueNavBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "doctor_2_clinical_queue.png"), fullPage: true });
  }

  // 3. Click "Review Case" on the first patient (Panel 3)
  console.log("Opening Patient Clinical Workspace (Panel 3)...");
  const reviewBtn = await page.$("button:has-text('Review Case')");
  if (reviewBtn) {
    await reviewBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, "doctor_3_patient_workspace.png"), fullPage: true });
  }

  // 4. Fill in diagnosis and submit prescription (Panel 4)
  console.log("Submitting prescription to test closed-loop state (Panel 4)...");
  const diagnosisInput = await page.$("input[placeholder*='Viral fever with dehydration']");
  if (diagnosisInput) {
    await diagnosisInput.fill("Acute Viral Pyrexia with Mild Dehydration");
    await page.waitForTimeout(400);

    const submitBtn = await page.$("button:has-text('Submit Prescription')");
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(artifactDir, "doctor_4_prescription_submitted.png"), fullPage: true });
    }
  }

  console.log("All 4 Doctor Workstation panels captured successfully!");
  await browser.close();
}

run().catch(console.error);
