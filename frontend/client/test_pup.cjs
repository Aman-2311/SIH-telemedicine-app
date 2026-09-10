const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
    console.error(error.stack);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3000/');

  // Wait for React to finish initial splash and render main components
  await new Promise(r => setTimeout(r, 4000));

  await browser.close();
})();
