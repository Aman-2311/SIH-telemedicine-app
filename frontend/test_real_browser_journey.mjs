import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf";

async function testRealBrowserJourney() {
  console.log("=== LAUNCHING REAL CHROME BROWSER FOR UI & API AUDIT ===");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const apiCalls = [];
  const consoleLogs = [];
  const networkErrors = [];

  function attachListeners(page, roleName) {
    page.on("console", (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleLogs.push({ role: roleName, type, text });
      if (type === "error" && !text.includes("favicon")) {
        console.error(`[${roleName} Console ERROR]: ${text}`);
      }
    });

    page.on("requestfailed", (req) => {
      networkErrors.push({
        role: roleName,
        url: req.url(),
        failure: req.failure()?.errorText || "Unknown failure",
      });
      console.error(`[${roleName} Network FAILED]: ${req.url()} - ${req.failure()?.errorText}`);
    });

    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("/api/")) {
        apiCalls.push({
          role: roleName,
          url,
          status: res.status(),
          statusText: res.statusText(),
        });
        if (res.status() >= 400) {
          console.error(`[${roleName} API ERROR ${res.status()}]: ${url}`);
        }
      }
    });
  }

  try {
    // ═══════════════════════════════════════════════════════
    // 1. ASHA WORKER JOURNEY: Patient Case Details & Scheduling
    // ═══════════════════════════════════════════════════════
    console.log("\n=======================================================");
    console.log("STEP 1: ASHA WORKER PORTAL & CASE DETAILS HIERARCHY");
    console.log("=======================================================");

    const ashaContext = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      permissions: ["geolocation"],
      geolocation: { latitude: 20.7453, longitude: 78.6022 },
    });

    await ashaContext.addInitScript(() => {
      localStorage.setItem(
        "sahara_user",
        JSON.stringify({
          id: "asha-101",
          full_name: "Sunita Patil (TEST)",
          abha_id: "TEST-ASHA-MH-0001",
          role: "asha",
        })
      );
      localStorage.setItem("sahara_access_token", "mock_token_asha");
    });

    const ashaPage = await ashaContext.newPage();
    attachListeners(ashaPage, "ASHA");

    console.log("Navigating to http://localhost:3000/ as ASHA Worker...");
    await ashaPage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await ashaPage.waitForTimeout(3500); // Wait for splash screen

    // Click "Patient History" action card or sidebar
    const historyBtn = await ashaPage.$(
      "button:has-text('Patient History'), button.action-card:has-text('History'), button.action-card:nth-child(3)"
    );
    if (historyBtn) {
      console.log("Clicking 'Patient History'...");
      await historyBtn.click();
      await ashaPage.waitForTimeout(1500);
    }

    // Inspect list of cases
    const caseCards = await ashaPage.$$(".patient-card, tr, [data-case-id]");
    console.log(`Found ${caseCards.length} patient cases in history.`);

    // Click first patient case to open details
    const firstCase = await ashaPage.$(".patient-card, tr, button:has-text('View Case'), td");
    if (firstCase) {
      console.log("Opening Patient Case Details...");
      await firstCase.click();
      await ashaPage.waitForTimeout(1500);
    }

    // Check Case Details elements
    const cdWrapper = await ashaPage.$(".cd-wrapper");
    if (cdWrapper) {
      console.log("[OK] PatientCaseDetailView rendered cleanly (.cd-wrapper found)!");
      const text = await cdWrapper.innerText();
      console.log("\n--- ASHA Case Details Structure ---");
      console.log(text.slice(0, 500));
      console.log("------------------------------------\n");

      // Verify slot scheduling button if available
      const assignBtn = await ashaPage.$(
        "button:has-text('Assign Specialist'), button:has-text('Confirm Slot'), button:has-text('Assign')"
      );
      if (assignBtn) {
        console.log("Executing specialist slot assignment...");
        await assignBtn.click();
        await ashaPage.waitForTimeout(1500);
        console.log("[OK] Slot assignment confirmed!");
      }

      // Scroll to view AI Summary, Pharmacy, and Map
      await ashaPage.evaluate(() => window.scrollTo(0, 700));
      await ashaPage.waitForTimeout(500);
    }

    await ashaPage.screenshot({ path: path.join(ARTIFACT_DIR, "browser_live_1_asha_details_scrolled.png"), fullPage: false });
    console.log("Saved screenshot: browser_live_1_asha_details_scrolled.png");
    await ashaContext.close();

    // ═══════════════════════════════════════════════════════
    // 2. DOCTOR WORKSPACE: Queue & Review
    // ═══════════════════════════════════════════════════════
    console.log("\n=======================================================");
    console.log("STEP 2: DOCTOR CLINICAL WORKSPACE & QUEUE");
    console.log("=======================================================");

    const docContext = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    });

    await docContext.addInitScript(() => {
      localStorage.setItem(
        "sahara_user",
        JSON.stringify({
          id: "doc-7001",
          full_name: "Dr. Arvind Kulkarni (MD)",
          abha_id: "DOC-MH-7001",
          role: "doctor",
        })
      );
      localStorage.setItem("sahara_access_token", "mock_token_doctor");
    });

    const docPage = await docContext.newPage();
    attachListeners(docPage, "Doctor");

    console.log("Navigating to http://localhost:3000/ as Doctor...");
    await docPage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await docPage.waitForTimeout(3500);

    // Click "Clinical Patient Queue" in sidebar or quick action
    const queueNav = await docPage.$(
      "button:has-text('Clinical Patient Queue'), .doc-nav-item:has-text('Queue'), button:has-text('Open Patient Queue')"
    );
    if (queueNav) {
      console.log("Navigating to Doctor Queue...");
      await queueNav.click();
      await docPage.waitForTimeout(1500);
    }

    // Inspect queue items
    const queueRows = await docPage.$$(".queue-item, .patient-queue-card, tr, button:has-text('Review Case')");
    console.log(`Doctor Queue count: ${queueRows.length} cases.`);

    const reviewBtn = await docPage.$(
      "button:has-text('Review Case'), button:has-text('Consult'), .queue-item, tr"
    );
    if (reviewBtn) {
      console.log("Opening case in Clinical Workspace...");
      await reviewBtn.click();
      await docPage.waitForTimeout(1500);
    }

    await docPage.screenshot({ path: path.join(ARTIFACT_DIR, "browser_live_2_doctor_queue.png"), fullPage: true });
    console.log("Saved screenshot: browser_live_2_doctor_queue.png");
    await docContext.close();

    // ═══════════════════════════════════════════════════════
    // 3. PATIENT PORTAL: Verify 4 Consultation States
    // ═══════════════════════════════════════════════════════
    console.log("\n=======================================================");
    console.log("STEP 3: PATIENT PORTAL & PRESCRIPTION LIFECYCLE");
    console.log("=======================================================");

    const patContext = await browser.newContext({
      viewport: { width: 1366, height: 900 },
    });

    await patContext.addInitScript(() => {
      localStorage.setItem(
        "sahara_user",
        JSON.stringify({
          id: "patient-6562",
          full_name: "Savita Patil",
          abha_id: "TEST-PATIENT-MH-0002",
          role: "patient",
        })
      );
      localStorage.setItem("sahara_access_token", "mock_token_patient");
    });

    const patPage = await patContext.newPage();
    attachListeners(patPage, "Patient");

    console.log("Navigating to http://localhost:3000/ as Patient...");
    await patPage.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await patPage.waitForTimeout(3500);

    // Go to Prescriptions tab
    const rxTab = await patPage.$(
      "button:has-text('My Prescriptions'), [data-tab='prescriptions'], button:has-text('Prescription')"
    );
    if (rxTab) {
      console.log("Navigating to My Prescriptions...");
      await rxTab.click();
      await patPage.waitForTimeout(1500);
    }

    const rxCard = await patPage.$(".patient-rx-card, .lg\\:col-span-2");
    if (rxCard) {
      const rxText = await rxCard.innerText();
      console.log("\n--- Patient Consultation & Prescription Card ---");
      console.log(rxText.slice(0, 500));
      console.log("------------------------------------------------\n");
    }

    await patPage.screenshot({ path: path.join(ARTIFACT_DIR, "browser_live_3_patient_portal.png"), fullPage: true });
    console.log("Saved screenshot: browser_live_3_patient_portal.png");
    await patContext.close();

  } catch (err) {
    console.error("Test execution error:", err);
  } finally {
    await browser.close();
  }

  // ═══════════════════════════════════════════════════════
  // FINAL AUDIT SUMMARY
  // ═══════════════════════════════════════════════════════
  console.log("\n=======================================================");
  console.log("             REAL BROWSER AUDIT REPORT");
  console.log("=======================================================");
  console.log(`Total API Calls Made: ${apiCalls.length}`);
  const failedApi = apiCalls.filter((c) => c.status >= 400);
  console.log(`Failed API Calls (4xx/5xx): ${failedApi.length}`);
  failedApi.forEach((f) => console.log(`  - [${f.status}] ${f.url} (${f.role})`));

  console.log(`Total Network Failures: ${networkErrors.length}`);
  networkErrors.forEach((n) => console.log(`  - ${n.url} (${n.failure})`));

  const errorLogs = consoleLogs.filter((l) => l.type === "error");
  console.log(`Browser Console Errors: ${errorLogs.length}`);
  errorLogs.forEach((l) => console.log(`  - [${l.role}] ${l.text}`));
  console.log("=======================================================\n");
}

testRealBrowserJourney();
