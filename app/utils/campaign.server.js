function formatMoney(value) {
  return String(Number(value).toFixed(2));
}

export function getDiscountedPrice(campaign, product) {
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

export function getStartPriceUpdate(
  campaign,
  product
) {
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

  return {
    productId: product.productId,
    productTitle: product.productTitle,
    variantId: product.variantId,
    price,
    compareAtPrice,
  };
}

export function getStopPriceUpdate(product) {
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

  return {
    productId: product.productId,
    productTitle: product.productTitle,
    variantId: product.variantId,
    price: formatMoney(product.originalPrice),
    compareAtPrice:
      product.originalComparePrice !== null
        ? formatMoney(product.originalComparePrice)
        : null,
  };
}

export function assertShopifyMutationSucceeded(
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

export async function updateVariantPrice(
  admin,
  update,
  action
) {
  console.log(
    `${action}:`,
    update.productTitle
  );

  console.log(
    "PRODUCT ID:",
    update.productId
  );

  console.log(
    "VARIANT ID:",
    update.variantId
  );

  console.log(
    "PRICE:",
    update.price
  );

  console.log(
    "COMPARE AT PRICE:",
    update.compareAtPrice
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
        productId: update.productId,

        variants: [
          {
            id: update.variantId,

            price: update.price,

            compareAtPrice: update.compareAtPrice,
          },
        ],
      },
    }
  );

  const result =
    await response.json();

  console.log(`${action} RESULT`);

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  assertShopifyMutationSucceeded(
    result,
    action,
    update
  );

  return result;
}

export async function runCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    const update = getStartPriceUpdate(
      campaign,
      product
    );

    await updateVariantPrice(
      admin,
      update,
      "RUN"
    );
  }

  return true;
}

export async function stopCampaign(
  admin,
  campaign
) {
  for (const product of campaign.products) {
    const update = getStopPriceUpdate(product);

    await updateVariantPrice(
      admin,
      update,
      "STOP"
    );
  }

  return true;
}
