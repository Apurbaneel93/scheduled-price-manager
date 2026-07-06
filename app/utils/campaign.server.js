function formatMoney(value) {
  return String(Number(value).toFixed(2));
}

function getDiscountedPrice(campaign, product) {
  const saleValue =
    campaign.saleValue ?? product.salePrice;

  if (
    campaign.discountType ===
    "percentage_discount"
  ) {
    return (
      product.originalPrice -
      (
        product.originalPrice *
        saleValue
      ) /
        100
    );
  }

  return saleValue;
}

function assertShopifyMutationSucceeded(
  result,
  action,
  product
) {
  const errors = result.errors || [];
  const userErrors =
    result.data?.productVariantsBulkUpdate
      ?.userErrors || [];

  if (errors.length || userErrors.length) {
    console.error(
      `${action} FAILED:`,
      product.productTitle
    );

    console.error(
      JSON.stringify(
        {
          errors,
          userErrors,
        },
        null,
        2
      )
    );

    throw new Error(
      `${action} failed for ${product.productTitle}`
    );
  }
}

export async function runCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    if (
      !product.productId ||
      !product.variantId
    ) {
      throw new Error(
        `Missing Shopify product or variant ID for ${product.productTitle}`
      );
    }

    if (product.originalPrice === null) {
      throw new Error(
        `Missing original price for ${product.productTitle}`
      );
    }

    const newPrice = getDiscountedPrice(
      campaign,
      product
    );

    if (
      !Number.isFinite(newPrice) ||
      newPrice < 0
    ) {
      throw new Error(
        `Invalid sale price for ${product.productTitle}`
      );
    }

    const price = formatMoney(newPrice);
    const compareAtPrice =
      Number(product.originalPrice) > Number(newPrice)
        ? formatMoney(product.originalPrice)
        : product.originalComparePrice !== null &&
            Number(product.originalComparePrice) >
              Number(newPrice)
          ? formatMoney(product.originalComparePrice)
          : null;

    console.log(
      "RUNNING:",
      product.productTitle
    );

    console.log(
      "PRODUCT ID:",
      product.productId
    );

    console.log(
      "VARIANT ID:",
      product.variantId
    );

    console.log(
      "NEW PRICE:",
      price
    );

    console.log(
      "COMPARE AT PRICE:",
      compareAtPrice
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

              price,

              compareAtPrice,
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

    assertShopifyMutationSucceeded(
      result,
      "RUN",
      product
    );
  }

  return true;
}

export async function stopCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    if (
      !product.productId ||
      !product.variantId
    ) {
      throw new Error(
        `Missing Shopify product or variant ID for ${product.productTitle}`
      );
    }

    if (product.originalPrice === null) {
      throw new Error(
        `Missing original price for ${product.productTitle}`
      );
    }

    console.log(
      "RESTORING:",
      product.productTitle
    );

    console.log(
      "PRODUCT ID:",
      product.productId
    );

    console.log(
      "VARIANT ID:",
      product.variantId
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

              price: formatMoney(
                product.originalPrice
              ),

              compareAtPrice:
                product.originalComparePrice !==
                null
                  ? formatMoney(
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

    assertShopifyMutationSucceeded(
      result,
      "STOP",
      product
    );
  }

  return true;
}
