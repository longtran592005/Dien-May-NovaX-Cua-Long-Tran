-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "minStockThreshold" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "reorderTarget" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "orderId" TEXT,
    "movementType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesSnapshotDaily" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "metricMode" TEXT NOT NULL,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesSnapshotDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySnapshotDaily" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "stockOnHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "minStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySnapshotDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_warehouseId_createdAt_idx" ON "InventoryMovement"("warehouseId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesSnapshotDaily_snapshotDate_key" ON "SalesSnapshotDaily"("snapshotDate");

-- CreateIndex
CREATE INDEX "SalesSnapshotDaily_metricMode_snapshotDate_idx" ON "SalesSnapshotDaily"("metricMode", "snapshotDate");

-- CreateIndex
CREATE INDEX "InventorySnapshotDaily_snapshotDate_idx" ON "InventorySnapshotDaily"("snapshotDate");

-- CreateIndex
CREATE INDEX "InventorySnapshotDaily_productId_snapshotDate_idx" ON "InventorySnapshotDaily"("productId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshotDaily_snapshotDate_productId_warehouseId_key" ON "InventorySnapshotDaily"("snapshotDate", "productId", "warehouseId");

-- CreateIndex
CREATE INDEX "Product_stock_idx" ON "Product"("stock");

-- CreateIndex
CREATE INDEX "Product_minStockThreshold_idx" ON "Product"("minStockThreshold");
