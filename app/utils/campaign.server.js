export async function runCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    if (!product.variantId) continue;

    let newPrice = product.salePrice;

    if (
      campaign.discountType ===
      "percentage_discount"
    ) {
      newPrice =
        product.originalPrice -
        (
          product.originalPrice *
          product.salePrice
        ) /
          100;
    }

    console.log(
      "RUNNING:",
      product.productTitle
    );

    console.log(
      "NEW PRICE:",
      newPrice
    );

    const response = await admin.graphql(
      `
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
      `,
      {
        variables: {
          productId: product.productId,

          variants: [
            {
              id: product.variantId,

              price: String(
                Number(newPrice).toFixed(2)
              ),
            },
          ],
        },
      }
    );

    const result =
      await response.json();

    console.log(
      "RUN RESULT"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }

  return true;
}

export async function stopCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    if (!product.variantId) continue;

    console.log(
      "RESTORING:",
      product.productTitle
    );

    const response = await admin.graphql(
      `
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
      `,
      {
        variables: {
          productId: product.productId,

          variants: [
            {
              id: product.variantId,

              price: String(
                product.originalPrice
              ),

              compareAtPrice:
                product.originalComparePrice !==
                null
                  ? String(
                      product.originalComparePrice
                    )
                  : null,
            },
          ],
        },
      }
    );

    const result =
      await response.json();

    console.log(
      "STOP RESULT"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }

  return true;
}