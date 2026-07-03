/*
  Warnings:

  - Added the required column `productTitle` to the `CampaignProduct` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CampaignProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantId" TEXT,
    "originalPrice" REAL,
    "originalComparePrice" REAL,
    "salePrice" REAL,
    "comparePrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CampaignProduct" ("campaignId", "comparePrice", "createdAt", "id", "originalComparePrice", "originalPrice", "productId", "salePrice", "variantId") SELECT "campaignId", "comparePrice", "createdAt", "id", "originalComparePrice", "originalPrice", "productId", "salePrice", "variantId" FROM "CampaignProduct";
DROP TABLE "CampaignProduct";
ALTER TABLE "new_CampaignProduct" RENAME TO "CampaignProduct";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
