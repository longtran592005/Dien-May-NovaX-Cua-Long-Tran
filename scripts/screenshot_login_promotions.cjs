const fs = require('fs');
(async () => {
  const { chromium, request } = require('playwright');
  const outDir = 'screenshots';
  try {
    // Get auth tokens from gateway
    const req = await request.newContext({ baseURL: 'http://localhost:3000' });
    const loginRes = await req.post('/api/v1/auth/login', {
      data: { email: 'admin@novax.vn', password: '123456' }
    });
    if (!loginRes.ok()) throw new Error(`Login failed: ${loginRes.status()}`);
    const loginBody = await loginRes.json();
    console.log('login response:', JSON.stringify(loginBody).slice(0, 400));
    const accessToken = loginBody.accessToken;
    const refreshToken = loginBody.refreshToken;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

    // addInitScript to set sessionStorage before any page script runs
    const initScript = `(() => {
      try {
        sessionStorage.setItem('novax-access-token', '${accessToken}');
        sessionStorage.setItem('novax-refresh-token', '${refreshToken}');
      } catch (e) { /* ignore */ }
    })();`;
    await context.addInitScript({ content: initScript });
    const page = await context.newPage();

    console.log('Opening admin promotions page');
    await page.goto('http://localhost:8080/admin/promotions', { waitUntil: 'networkidle', timeout: 30000 });

    // wait for promotions heading or table
    try {
      await page.waitForSelector('text=Khuyến mãi', { timeout: 20000 });
    } catch (waitErr) {
      // If initial check failed, try form-based login as a fallback
      console.log('Initial check failed, trying form login fallback');
      try {
        // perform login via UI form
        const loginPage = await context.newPage();
        await loginPage.goto('http://localhost:8080/login', { waitUntil: 'networkidle', timeout: 20000 });
        await loginPage.fill('input[type="email"]', 'admin@novax.vn');
        await loginPage.fill('input[type="password"]', '123456');
        await Promise.all([
          loginPage.click('button[type="submit"]'),
          loginPage.waitForResponse((r) => r.url().endsWith('/api/v1/auth/login') && r.status() === 200, { timeout: 10000 }).catch(() => null)
        ]).catch(() => {});
        // wait for tokens to appear in sessionStorage
        await loginPage.waitForFunction(() => !!sessionStorage.getItem('novax-access-token'), { timeout: 10000 });
        await loginPage.close();

        // reload target page
        await page.reload({ waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForSelector('text=Khuyến mãi', { timeout: 15000 });
      } catch (formErr) {
        throw new Error(`Both API-inject and form-login failed: ${formErr.message || formErr}`);
      }
    }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    const out = `${outDir}/promotion_admin_loggedin.png`;
    await page.screenshot({ path: out, fullPage: true });
    console.log('Screenshot saved to', out);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during scripted login/screenshot:', err.message || err);
    try {
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
      // try to capture any page
      // open a browser to screenshot current state
      const { chromium } = require('playwright');
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto('http://localhost:8080/admin/promotions').catch(() => {});
      await page.screenshot({ path: `${outDir}/promo_error.png`, fullPage: true }).catch(() => {});
      await browser.close();
    } catch (_) {}
    process.exit(1);
  }
})();