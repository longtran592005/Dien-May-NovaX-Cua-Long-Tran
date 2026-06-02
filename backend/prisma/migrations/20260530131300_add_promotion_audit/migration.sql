-- CreateTable
CREATE TABLE "PromotionAudit" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionAudit_promotionId_idx" ON "PromotionAudit"("promotionId");

-- CreateIndex
CREATE INDEX "PromotionAudit_orderId_idx" ON "PromotionAudit"("orderId");

-- AddForeignKey
ALTER TABLE "PromotionAudit" ADD CONSTRAINT "PromotionAudit_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
