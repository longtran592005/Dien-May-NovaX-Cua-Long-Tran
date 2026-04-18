import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8080/product/may-tinh-bang-huawei-kids-edition-10", { waitUntil: "networkidle" });
console.log("url=" + page.url());
console.log("h1-count=" + await page.locator("h1").count());
console.log("notfound=" + await page.locator("text=Sản phẩm không tồn tại").count());
console.log("body-has-gio-hang=" + ((await page.locator("body").innerText()).includes("Giỏ hàng")));
if (errors.length) {
  console.log("ERRS");
  for (const e of errors) console.log(e);
}
await browser.close();
