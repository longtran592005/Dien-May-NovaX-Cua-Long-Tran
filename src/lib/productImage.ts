import type { SyntheticEvent } from "react";
import type { Product } from "@/types/product";

const localImageBySlug: Record<string, string> = {
  "iphone-15-pro-max-256gb": "/images/products/dien-thoai/iphone-15-pro-max-256gb.png",
  "samsung-galaxy-s24-ultra": "/images/products/dien-thoai/samsung-galaxy-s24-ultra.png",
  "macbook-air-15-m2": "/images/products/laptop/macbook-air-15-m2.png",
  "tivi-samsung-qled-4k-65-inch-qa65q60c": "/images/products/tivi/tivi-samsung-qled-4k-65-inch-qa65q60c.png",
  "tivi-lg-4k-55-inch-55ur8050psb": "/images/products/tivi/tivi-lg-4k-55-inch-55ur8050psb.png",
  "tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv": "/images/products/tu-lanh/tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv.png",
  "tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb": "/images/products/tu-lanh/tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb.png",
  "may-lanh-daikin-inverter-1-hp-atkf25xvmv": "/images/products/dieu-hoa/may-lanh-daikin-inverter-1-hp-atkf25xvmv.png",
  "may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m": "/images/products/dieu-hoa/may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m.png",
  "may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p": "/images/products/may-giat/may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p.png",
  "may-giat-electrolux-inverter-9-kg-ewf9024p5wb": "/images/products/may-giat/may-giat-electrolux-inverter-9-kg-ewf9024p5wb.png",
  "noi-com-dien-tu-sharp-18-lit-ks-com18v": "/images/products/gia-dung/noi-com-dien-tu-sharp-18-lit-ks-com18v.png",
  "lo-vi-song-sharp-20-lit": "/images/products/gia-dung/lo-vi-song-sharp-20-lit.png",
  "oppo-reno11-f-5g": "/images/products/dien-thoai/oppo-reno11-f-5g.png",
  "xiaomi-14-5g": "/images/products/dien-thoai/xiaomi-14-5g.png",
};

function getCategoryDefaultImage(product: Product): string | undefined {
  const slug = (product.slug || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();

  if (slug.includes("iphone") || brand.includes("apple")) return "/images/products/dien-thoai/iphone-15-pro-max-256gb.png";
  if (slug.includes("samsung") && category.includes("dien-thoai")) return "/images/products/dien-thoai/samsung-galaxy-s24-ultra.png";
  if (brand.includes("oppo")) return "/images/products/dien-thoai/oppo-reno11-f-5g.png";
  if (brand.includes("xiaomi")) return "/images/products/dien-thoai/xiaomi-14-5g.png";

  if (category.includes("laptop")) return "/images/products/laptop/macbook-air-15-m2.png";

  if (category.includes("tivi")) {
    if (brand.includes("samsung")) return "/images/products/tivi/tivi-samsung-qled-4k-65-inch-qa65q60c.png";
    return "/images/products/tivi/tivi-lg-4k-55-inch-55ur8050psb.png";
  }

  if (category.includes("tu-lanh")) {
    if (brand.includes("samsung")) return "/images/products/tu-lanh/tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv.png";
    return "/images/products/tu-lanh/tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb.png";
  }

  if (category.includes("may-giat")) {
    if (brand.includes("electrolux")) return "/images/products/may-giat/may-giat-electrolux-inverter-9-kg-ewf9024p5wb.png";
    return "/images/products/may-giat/may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p.png";
  }

  if (category.includes("dieu-hoa")) {
    if (brand.includes("panasonic")) return "/images/products/dieu-hoa/may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m.png";
    return "/images/products/dieu-hoa/may-lanh-daikin-inverter-1-hp-atkf25xvmv.png";
  }

  if (category.includes("gia-dung")) {
    if (slug.includes("lo-vi-song")) return "/images/products/gia-dung/lo-vi-song-sharp-20-lit.png";
    return "/images/products/gia-dung/noi-com-dien-tu-sharp-18-lit-ks-com18v.png";
  }

  return undefined;
}

const categoryLabels: Record<string, string> = {
  tivi: "Tivi",
  "tu-lanh": "Tu lanh",
  "may-giat": "May giat",
  "dieu-hoa": "Dieu hoa",
  "gia-dung": "Gia dung",
  "dien-thoai": "Dien thoai",
  laptop: "Laptop",
  "may-tinh-bang": "May tinh bang",
};

function buildInlinePlaceholder(product: Product): string {
  const category = categoryLabels[product.category] ?? "San pham";
  const brand = product.brand || "NovaX";
  const title = (product.name || "San pham").slice(0, 42);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect x="60" y="60" width="680" height="680" rx="28" fill="#ffffff" opacity="0.88"/>
  <text x="400" y="325" text-anchor="middle" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${category}</text>
  <text x="400" y="390" text-anchor="middle" fill="#334155" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="600">${brand}</text>
  <text x="400" y="455" text-anchor="middle" fill="#475569" font-family="Segoe UI, Arial, sans-serif" font-size="24">${title}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getSafeProductImage(product: Product, index = 0): string {
  const normalizedSlug = (product.slug || "").toLowerCase();
  const localExact = localImageBySlug[normalizedSlug];
  if (localExact) {
    return localExact;
  }

  const localByCategory = getCategoryDefaultImage(product);
  if (localByCategory) {
    return localByCategory;
  }

  const image = product.images?.[index] || product.images?.[0];
  return image || buildInlinePlaceholder(product);
}

export function handleProductImageError(
  event: SyntheticEvent<HTMLImageElement>,
  product: Product,
  index = 0
): void {
  const target = event.currentTarget;
  const fallback = buildInlinePlaceholder(product);

  if (target.src !== fallback) {
    target.src = fallback;
  }
}
