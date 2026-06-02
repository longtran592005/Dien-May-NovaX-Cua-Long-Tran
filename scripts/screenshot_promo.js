const fs = require('fs');
(async () => {
  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch (e1) {
    try {
      chromium = require('@playwright/test').chromium;
    } catch (e2) {
      console.error('Playwright not installed. Please run `npm i -D playwright` or use your browser.');
      process.exit(2);
    }
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const url = process.argv[2] || 'http://localhost:8080/admin/promotions';
  console.log('Opening', url);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // wait for heading text commonly used in PromotionsPage
    try {
      await page.waitForSelector('text="Quản lý Khuyến mãi"', { timeout: 10000 });
    } catch (e) {
      // fallback: wait for h2 element
      await page.waitForSelector('h2', { timeout: 10000 });
    }
    if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
    const out = 'screenshots/promotion_admin.png';
    await page.screenshot({ path: out, fullPage: true });
    console.log('Screenshot saved to', out);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to load page:', err.message || err);
    await browser.close();
    process.exit(3);
  }
})();