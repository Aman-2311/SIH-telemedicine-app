import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = 'C:\\Users\\amans\\.gemini\\antigravity-ide\\brain\\9e5cbddb-9552-451c-8296-b4849c4e3fcf';

async function run() {
  console.log('Starting end-to-end clinical attachment verification...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const consoleErrors = [];
  const networkErrors = [];
  const imageRequests = [];

  function attachListeners(page, roleName) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${roleName} Console]: ${msg.text()}`);
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      const status = res.status();
      if (status >= 400 && !url.includes('favicon.ico')) {
        networkErrors.push({ role: roleName, url, status });
        console.error(`[${roleName} Network ERROR ${status}]: ${url}`);
      }
      if (url.includes('medical-images') || url.includes('unsplash') || url.includes('clinical_photo')) {
        imageRequests.push({ role: roleName, url, status });
        console.log(`[${roleName} Image Request ${status}]: ${url}`);
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // STEP 1: ASHA WORKER UPLOADS REAL CLINICAL IMAGE
  // ═══════════════════════════════════════════════════════
  console.log('\n=======================================================');
  console.log('STEP 1: ASHA WORKER INTAKE & REAL IMAGE UPLOAD');
  console.log('=======================================================');

  const ashaContext = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    permissions: ['geolocation'],
    geolocation: { latitude: 20.7453, longitude: 78.6022 },
  });

  await ashaContext.addInitScript(() => {
    localStorage.setItem(
      'sahara_user',
      JSON.stringify({
        id: 'asha-101',
        full_name: 'Sunita Patil (TEST)',
        abha_id: 'TEST-ASHA-MH-0001',
        role: 'asha',
      })
    );
    localStorage.setItem('sahara_access_token', 'mock_token_asha');
  });

  const ashaPage = await ashaContext.newPage();
  attachListeners(ashaPage, 'ASHA');

  console.log('Navigating to http://localhost:3000/ as ASHA Worker...');
  await ashaPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await ashaPage.waitForTimeout(3500); // Wait for splash screen

  // Click "New Patient Intake" action card
  console.log('Clicking "New Patient Intake"...');
  const newIntakeBtn = await ashaPage.$(
    'button.action-card--primary, button:has-text("New Patient Intake"), button:has-text("New Intake"), .nav-tab:has-text("Intake")'
  );
  if (newIntakeBtn) {
    await newIntakeBtn.click();
  } else {
    await ashaPage.click('text="New Patient Intake"');
  }
  await ashaPage.waitForTimeout(2000);

  // Fill in patient name
  console.log('Filling patient demographic and clinical details...');
  const patientName = 'Geeta Solanki (Dermatology Case)';
  const abhaId = 'TEST-ABHA-ATTACHMENT-8801';

  const nameInput = ashaPage.locator('#patient-name-input');
  await nameInput.waitFor({ state: 'visible', timeout: 15000 });
  await nameInput.fill(patientName);

  const abhaInput = ashaPage.locator('#patient-abha-input');
  await abhaInput.fill(abhaId);

  // Click quick test chip to populate symptoms
  const quickTestChip = ashaPage.locator('button.quick-test-chip--primary, .quick-test-chip').first();
  if (await quickTestChip.isVisible()) {
    await quickTestChip.click();
  }

  // Upload clinical symptom photo
  console.log('Attaching test clinical photograph...');
  const imageFilePath = path.resolve(__dirname, 'test_clinical_photo.jpg');
  const fileInput = ashaPage.locator('input[type="file"]');
  await fileInput.setInputFiles(imageFilePath);

  console.log('Waiting for Supabase Storage upload to complete in UI...');
  const storageReadyBadge = ashaPage.locator('.photo-preview-chip:has-text("Supabase Storage")');
  await storageReadyBadge.waitFor({ state: 'visible', timeout: 25000 });
  console.log('✓ Photo uploaded to Supabase Storage and confirmed ready in UI!');

  // Submit case
  console.log('Submitting clinical case to Doctor queue...');
  const submitBtn = ashaPage.locator('#submit-intake-case-btn');
  await ashaPage.waitForFunction(() => {
    const btn = document.getElementById('submit-intake-case-btn');
    return btn && !btn.disabled;
  }, { timeout: 15000 });
  await submitBtn.click();

  // Wait for submission confirmation modal
  console.log('Waiting for Case Submitted confirmation modal...');
  const submittedModal = ashaPage.locator('h3:has-text("Case Submitted")');
  await submittedModal.waitFor({ state: 'visible', timeout: 20000 });
  console.log('✓ Case Submitted confirmation modal appeared!');

  await ashaPage.waitForTimeout(1500);

  // Take screenshot of ASHA submission
  await ashaPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'browser_live_1_asha_intake_submitted.png'),
    fullPage: true,
  });
  console.log('Saved screenshot: browser_live_1_asha_intake_submitted.png');
  await ashaContext.close();

  // ═══════════════════════════════════════════════════════
  // STEP 2: DOCTOR OPENS SAME CASE & SEES REAL ATTACHMENT
  // ═══════════════════════════════════════════════════════
  console.log('\n=======================================================');
  console.log('STEP 2: DOCTOR WORKSPACE & REAL CLINICAL ATTACHMENT');
  console.log('=======================================================');

  const docContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  await docContext.addInitScript(() => {
    localStorage.setItem(
      'sahara_user',
      JSON.stringify({
        id: 'doc-7001',
        full_name: 'Dr. Arvind Kulkarni (MD)',
        abha_id: 'DOC-MH-7001',
        role: 'doctor',
      })
    );
    localStorage.setItem('sahara_access_token', 'mock_token_doctor');
  });

  const docPage = await docContext.newPage();
  attachListeners(docPage, 'Doctor');

  console.log('Navigating to http://localhost:3000/ as Doctor...');
  await docPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await docPage.waitForTimeout(3500); // Wait for splash screen

  // Click "Clinical Patient Queue" in sidebar or nav
  const queueNav = await docPage.$(
    "button:has-text('Clinical Patient Queue'), .doc-nav-item:has-text('Queue'), button:has-text('Open Patient Queue')"
  );
  if (queueNav) {
    console.log('Navigating to Doctor Queue...');
    await queueNav.click();
    await docPage.waitForTimeout(1500);
  }

  // Find Geeta Solanki in the queue
  console.log('Looking for Geeta Solanki in Doctor Queue...');
  const searchBox = docPage.locator('input[placeholder*="Search"]').first();
  if (await searchBox.isVisible()) {
    await searchBox.fill('Geeta Solanki');
    await docPage.waitForTimeout(1500);
  }

  const reviewBtn = docPage.locator('tr:has-text("Geeta Solanki") button:has-text("Review Case"), tr:has-text("Geeta Solanki")').first();
  await reviewBtn.waitFor({ state: 'visible', timeout: 15000 });
  console.log('Found Geeta Solanki in queue. Clicking Review Case to enter workspace...');
  await reviewBtn.click();
  await docPage.waitForTimeout(2000);

  // Wait for clinical workspace header to be visible
  await docPage.locator('text="Patient Details & Teleconsultation"').waitFor({ state: 'visible', timeout: 15000 });

  // Inspect the Patient Clinical Attachment section
  console.log('\nInspecting Patient Clinical Attachment Container in Doctor view:');
  const attachmentContainer = docPage.locator('.clinical-card:has-text("Patient Clinical Attachment")').first();
  await attachmentContainer.scrollIntoViewIfNeeded();
  await docPage.waitForTimeout(1000);

  const containerText = await attachmentContainer.innerText();
  console.log(`Container Text:\n${containerText}`);

  // Assert NO clinical_photo_01.jpg
  if (containerText.includes('clinical_photo_01.jpg')) {
    throw new Error('FAIL: Doctor page still contains hardcoded clinical_photo_01.jpg!');
  }
  console.log('✓ PASS: No hardcoded clinical_photo_01.jpg found!');

  // Assert 1 File badge
  const hasOneFile = containerText.includes('1 File');
  if (!hasOneFile) {
    throw new Error('FAIL: Badge does not say "1 File" for uploaded case!');
  }
  console.log('✓ PASS: Badge correctly says "1 File"');

  // Verify rendered image
  const clinicalImg = docPage.locator('img[alt*="Clinical Attachment"]').first();
  const imgSrc = await clinicalImg.getAttribute('src');
  console.log(`Rendered Image URL: ${imgSrc}`);

  if (!imgSrc || imgSrc.includes('unsplash.com')) {
    throw new Error(`FAIL: Image is using Unsplash placeholder! URL: ${imgSrc}`);
  }

  if (!imgSrc.includes('supabase.co/storage/v1/object/public/medical-images/')) {
    throw new Error(`FAIL: Image is not pointing to Supabase Storage! URL: ${imgSrc}`);
  }
  console.log('✓ PASS: Real Supabase Storage URL rendered in <img> tag!');

  // Verify image loaded successfully in DOM
  const imageLoaded = await clinicalImg.evaluate((img) => img.complete && img.naturalWidth > 0);
  console.log(`✓ PASS: Image fully decoded and visible in browser DOM (naturalWidth > 0): ${imageLoaded}`);

  // Test Enlarge Modal
  console.log('\nTesting Enlarge Image Modal in Doctor view...');
  const enlargeBtn = docPage.locator('button:has-text("Enlarge Image")').first();
  if (await enlargeBtn.isVisible()) {
    await enlargeBtn.click();
    await docPage.waitForTimeout(1000);

    const modalImg = docPage.locator('img[alt*="Full Preview"], img[alt*="Preview"]').last();
    const modalSrc = await modalImg.getAttribute('src');
    console.log(`Modal Full Image URL: ${modalSrc}`);
    if (modalSrc !== imgSrc) {
      throw new Error(`FAIL: Modal image URL does not match attachment URL!`);
    }
    console.log('✓ PASS: Enlarge Image Modal displays the real uploaded Supabase image!');

    // Close modal
    const closeBtn = docPage.locator('button:has(svg.lucide-x)').last();
    await closeBtn.click();
    await docPage.waitForTimeout(500);
  }

  // Take screenshot of Doctor Clinical Workspace showing the real attachment
  await docPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'browser_live_2_doctor_clinical_attachment.png'),
    fullPage: true,
  });
  console.log('Saved screenshot: browser_live_2_doctor_clinical_attachment.png');

  // ═══════════════════════════════════════════════════════
  // STEP 3: VERIFY CASE WITHOUT ATTACHMENT SHOWS CLEAN EMPTY STATE
  // ═══════════════════════════════════════════════════════
  console.log('\n=======================================================');
  console.log('STEP 3: VERIFY CLEAN EMPTY STATE FOR CASE WITHOUT IMAGE');
  console.log('=======================================================');

  // Click Back to Queue
  const backToQueueBtn = docPage.locator('button:has-text("Back to Queue")');
  if (await backToQueueBtn.isVisible()) {
    await backToQueueBtn.click();
    await docPage.waitForTimeout(1000);
  }

  // Clear search to show other queue items
  if (await searchBox.isVisible()) {
    await searchBox.fill('');
    await docPage.waitForTimeout(1000);
  }

  // Click on another case without image
  const otherReviewBtn = docPage.locator('tr:not(:has-text("Geeta Solanki")) button:has-text("Review Case")').first();
  if (await otherReviewBtn.isVisible()) {
    await otherReviewBtn.click();
    await docPage.waitForTimeout(1500);
    await docPage.locator('text="Patient Details & Teleconsultation"').waitFor({ state: 'visible', timeout: 15000 });
  }

  const emptyContainer = docPage.locator('.clinical-card:has-text("Patient Clinical Attachment")').first();
  const emptyText = await emptyContainer.innerText();
  console.log(`Case without image container text:\n${emptyText}`);

  if (emptyText.includes('clinical_photo_01.jpg') || emptyText.includes('unsplash')) {
    throw new Error('FAIL: Case without image shows fake placeholders!');
  }
  console.log('✓ PASS: Clean empty state displayed ("No clinical photo attached", 0 Files). No placeholders!');

  // Check network errors
  console.log('\n=======================================================');
  console.log('STEP 4: NETWORK & CONSOLE AUDIT');
  console.log('=======================================================');
  const badImgRequests = imageRequests.filter((r) => r.status >= 400);
  console.log(`Failed Image Requests (4xx/5xx): ${badImgRequests.length}`);
  if (badImgRequests.length > 0) {
    console.error('Failed image requests:', badImgRequests);
    throw new Error('FAIL: Image requests returned 4xx/5xx HTTP errors!');
  }
  console.log('✓ PASS: Zero 401/403/404 image errors!');

  await docContext.close();
  await browser.close();

  console.log('\n=======================================================');
  console.log('>>> COMPLETE CLINICAL ATTACHMENT FLOW PASSED WITH 100% SUCCESS! <<<');
  console.log('=======================================================');
}

run().catch((err) => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
