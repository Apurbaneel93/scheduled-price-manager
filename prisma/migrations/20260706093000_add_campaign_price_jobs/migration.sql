CREATE TABLE "CampaignPriceJob" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "campaignProductId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "productId" TEXT NOT NULL,
  "productTitle" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "price" TEXT NOT NULL,
  "compareAtPrice" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "lockedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CampaignPriceJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CampaignPriceJob_campaignProductId_action_key"
  ON "CampaignPriceJob"("campaignProductId", "action");

CREATE INDEX "CampaignPriceJob_status_action_createdAt_idx"
  ON "CampaignPriceJob"("status", "action", "createdAt");

CREATE INDEX "CampaignPriceJob_campaignId_action_status_idx"
  ON "CampaignPriceJob"("campaignId", "action", "status");

ALTER TABLE "CampaignPriceJob"
  ADD CONSTRAINT "CampaignPriceJob_campaignId_fkey"
  FOREIGN KEY ("campaignId")
  REFERENCES "Campaign"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "CampaignPriceJob"
  ADD CONSTRAINT "CampaignPriceJob_campaignProductId_fkey"
  FOREIGN KEY ("campaignProductId")
  REFERENCES "CampaignProduct"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
