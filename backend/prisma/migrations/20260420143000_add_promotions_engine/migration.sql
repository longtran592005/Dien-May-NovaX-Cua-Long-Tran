-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minOrderAmount" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "targetTier" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionProductScope" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "bonusProduct" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionProductScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCategoryScope" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionCategoryScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Promotion_status_startsAt_endsAt_idx" ON "Promotion"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Promotion_type_status_idx" ON "Promotion"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionProductScope_promotionId_productId_key" ON "PromotionProductScope"("promotionId", "productId");

-- CreateIndex
CREATE INDEX "PromotionProductScope_productId_idx" ON "PromotionProductScope"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCategoryScope_promotionId_categorySlug_key" ON "PromotionCategoryScope"("promotionId", "categorySlug");

-- CreateIndex
CREATE INDEX "PromotionCategoryScope_categorySlug_idx" ON "PromotionCategoryScope"("categorySlug");

-- AddForeignKey
ALTER TABLE "PromotionProductScope" ADD CONSTRAINT "PromotionProductScope_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCategoryScope" ADD CONSTRAINT "PromotionCategoryScope_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
