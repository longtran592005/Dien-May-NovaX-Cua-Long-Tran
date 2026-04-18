import type { SyntheticEvent } from "react";
import type { Product } from "@/types/product";

const localImageBySlug: Record<string, string> = {
  "iphone-15-pro-max-256gb": "/images/products/dien-thoai/dien-thoai-samsung-8gb-128gb-1.png",
  "samsung-galaxy-s24-ultra": "/images/products/dien-thoai/dien-thoai-samsung-5g-12gb-256gb-6.png",
  "macbook-air-15-m2": "/images/products/laptop/laptop-asus-creator-16-inch-9.png",
  "tivi-samsung-qled-4k-65-inch-qa65q60c": "/images/products/tivi/tivi-samsung-qled-4k-43-inch-1.png",
  "tivi-lg-4k-55-inch-55ur8050psb": "/images/products/tivi/tivi-lg-qled-4k-50-inch-2.png",
  "tu-lanh-samsung-inverter-382-lit-rt38cg6584b1sv": "/images/products/tu-lanh/tu-lanh-samsung-inverter-260l-1.png",
  "tu-lanh-aqua-inverter-189-lit-aqr-t219fa-pb": "/images/products/tu-lanh/tu-lanh-aqua-inverter-380l-4.png",
  "may-lanh-daikin-inverter-1-hp-atkf25xvmv": "/images/products/dieu-hoa/dieu-hoa-daikin-inverter-1hp-1.png",
  "may-lanh-panasonic-inverter-1-hp-cu-cs-pu9xkh-8m": "/images/products/dieu-hoa/dieu-hoa-panasonic-inverter-1-5hp-2.png",
  "may-giat-lg-ai-dd-inverter-10-kg-fv1410s4p": "/images/products/may-giat/may-giat-lg-cua-tren-9kg-1.png",
  "may-giat-electrolux-inverter-9-kg-ewf9024p5wb": "/images/products/may-giat/may-giat-electrolux-cua-tren-12kg-3.png",
  "noi-com-dien-tu-sharp-18-lit-ks-com18v": "/images/products/gia-dung/gia-dung-sharp-noi-com-1-8l-1.png",
  "lo-vi-song-sharp-20-lit": "/images/products/gia-dung/gia-dung-kangaroo-lo-vi-song-25l-10.png",
  "oppo-reno11-f-5g": "/images/products/dien-thoai/dien-thoai-oppo-12gb-256gb-3.png",
  "xiaomi-14-5g": "/images/products/dien-thoai/dien-thoai-xiaomi-8gb-256gb-2.png",
};

function getLocalFallbackImage(product: Product): string | undefined {
  const normalizedSlug = (product.slug || "").toLowerCase();
  return localImageBySlug[normalizedSlug] ?? getCategoryDefaultImage(product);
}

function getCategoryDefaultImage(product: Product): string | undefined {
  const slug = (product.slug || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || "").toLowerCase();

  if (slug.includes("iphone") || brand.includes("apple")) return "/images/products/dien-thoai/dien-thoai-samsung-8gb-128gb-1.png";
  if (slug.includes("samsung") && category.includes("dien-thoai")) return "/images/products/dien-thoai/dien-thoai-samsung-5g-12gb-256gb-6.png";
  if (brand.includes("oppo")) return "/images/products/dien-thoai/dien-thoai-oppo-12gb-256gb-3.png";
  if (brand.includes("xiaomi")) return "/images/products/dien-thoai/dien-thoai-xiaomi-8gb-256gb-2.png";

  if (category.includes("laptop")) return "/images/products/laptop/laptop-asus-creator-16-inch-9.png";

  if (category.includes("tivi")) {
    if (brand.includes("samsung")) return "/images/products/tivi/tivi-samsung-qled-4k-43-inch-1.png";
    return "/images/products/tivi/tivi-lg-qled-4k-50-inch-2.png";
  }

  if (category.includes("tu-lanh")) {
    if (brand.includes("samsung")) return "/images/products/tu-lanh/tu-lanh-samsung-inverter-260l-1.png";
    return "/images/products/tu-lanh/tu-lanh-aqua-inverter-380l-4.png";
  }

  if (category.includes("may-giat")) {
    if (brand.includes("electrolux")) return "/images/products/may-giat/may-giat-electrolux-cua-tren-12kg-3.png";
    return "/images/products/may-giat/may-giat-lg-cua-tren-9kg-1.png";
  }

  if (category.includes("dieu-hoa")) {
    if (brand.includes("panasonic")) return "/images/products/dieu-hoa/dieu-hoa-panasonic-inverter-1-5hp-2.png";
    return "/images/products/dieu-hoa/dieu-hoa-daikin-inverter-1hp-1.png";
  }

  if (category.includes("gia-dung")) {
    if (slug.includes("lo-vi-song")) return "/images/products/gia-dung/gia-dung-kangaroo-lo-vi-song-25l-10.png";
    return "/images/products/gia-dung/gia-dung-sharp-noi-com-1-8l-1.png";
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
  const image = product.images?.[index] || product.images?.[0];
  if (image) {
    return image;
  }

  const localFallback = getLocalFallbackImage(product);
  if (localFallback) {
    return localFallback;
  }

  return image || buildInlinePlaceholder(product);
}

export function handleProductImageError(
  event: SyntheticEvent<HTMLImageElement>,
  product: Product,
  index = 0
): void {
  const target = event.currentTarget;
  const localFallback = getLocalFallbackImage(product);
  const fallback = buildInlinePlaceholder(product);
  const currentSrc = target.getAttribute("src") || "";

  if (localFallback && !currentSrc.includes(localFallback)) {
    target.src = localFallback;
    return;
  }

  if (target.src !== fallback) {
    target.src = fallback;
  }
}
