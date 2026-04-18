import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console-error: ${msg.text()}`);
});

await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });

// Try click first product card link
const firstProduct = page.locator('a[href^="/product/"]').first();
if (await firstProduct.count()) {
  await firstProduct.click();
  await page.waitForLoadState("networkidle");
  console.log("after-product-click-url=" + page.url());
  const productTitleVisible = await page.locator("h1").first().isVisible().catch(() => false);
  console.log("product-title-visible=" + productTitleVisible);
  const hasNotFoundText = await page.locator("text=Sản phẩm không tồn tại").first().isVisible().catch(() => false);
  console.log("product-not-found-visible=" + hasNotFoundText);
  const h1Count = await page.locator("h1").count();
  console.log("product-h1-count=" + h1Count);
  if (h1Count > 0) {
    const firstH1 = (await page.locator("h1").first().textContent()) || "";
    console.log("product-h1-text=" + firstH1.trim());
  }
  const pageText = await page.locator("body").innerText();
  console.log("product-page-text-sample=" + pageText.slice(0, 320).replace(/\s+/g, " "));
} else {
  console.log("no-product-link-found");
}

// Go cart and check page renders visible heading
await page.goto("http://localhost:8080/cart", { waitUntil: "networkidle" });
const hasCartText = await page.locator('text=Giỏ hàng').first().isVisible().catch(() => false);
console.log("cart-visible=" + hasCartText);

if (errors.length) {
  console.log("UI_ERRORS_START");
  for (const e of errors) console.log(e);
  console.log("UI_ERRORS_END");
}

await browser.close();
