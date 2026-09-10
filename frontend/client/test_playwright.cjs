const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
    console.log(error.stack);
  });

  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  try {
    console.log("Navigating...");
    await page.goto('http://127.0.0.1:3000/');
    console.log("Waiting...");
    await page.waitForTimeout(3000);
    console.log("Done");
  } catch (e) {
    console.log("Goto error:", e.message);
  }

  await browser.close();
})();
