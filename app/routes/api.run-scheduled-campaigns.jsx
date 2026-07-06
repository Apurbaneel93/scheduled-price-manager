import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const now = new Date();

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "scheduled",
      startDate: {
        lte: now,
      },
    },
    include: {
      products: true,
    },
  });

  console.log("Campaigns to run:", campaigns.length);

  for (const campaign of campaigns) {
    for (const product of campaign.products) {
      if (!product.variantId) continue;

      const response = await admin.graphql(`
        mutation productVariantsBulkUpdate(
          $productId: ID!,
          $variants: [ProductVariantsBulkInput!]!
        ) {
          productVariantsBulkUpdate(
            productId: $productId,
            variants: $variants
          ) {
            userErrors {
              field
              message
            }
          }
        }
      `, {
        variables: {
          productId: product.productId,
          variants: [
            {
              id: product.variantId,
              price: String(product.salePrice),
            },
          ],
        },
      });

      const result = await response.json();

      console.log("================================");
      console.log("PRODUCT:", product.productTitle);
      console.log("PRODUCT ID:", product.productId);
      console.log("VARIANT ID:", product.variantId);
      console.log("SALE PRICE:", product.salePrice);
      console.log(
        JSON.stringify(result, null, 2)
      );
      console.log("================================");



    }

    await prisma.campaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: "active",
      },
    });
  }

  return Response.json({
    success: true,
    campaignsProcessed: campaigns.length,
  });
};