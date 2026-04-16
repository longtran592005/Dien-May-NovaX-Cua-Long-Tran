import type { SyntheticEvent } from "react";
import type { Product } from "@/types/product";

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
