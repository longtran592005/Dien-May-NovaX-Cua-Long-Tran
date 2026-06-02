-- Add pricing snapshot JSON audit field to orders
ALTER TABLE "Order"
ADD COLUMN "pricingSnapshot" JSONB;
