import { Form, redirect } from "react-router";
import { useEffect, useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { parseDateTimeLocal } from "../utils/dates.server";

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);
//   return null;
// };


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 250) {
        nodes {
          id
          title

          collections(first: 20) {
            nodes {
              id
              title
            }
          }

          variants(first: 1) {
            nodes {
              id
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `);

  const responseJson = await response.json();

  return {
    products: responseJson.data.products.nodes,
  };
};


export const action = async ({ request }) => {
  await authenticate.admin(request);

  const formData = await request.formData();

  const name = formData.get("name");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const timezoneOffset = formData.get("timezoneOffset");
  const discountType = formData.get("discountType");
  const saleValue = formData.get("saleValue");

  const products = formData.getAll("products");

  console.log("==========");
  console.log("PRODUCTS SUBMITTED");
  console.log(products);
  console.log("Products Submitted:", products.length);
  console.log("==========");

  const campaign = await prisma.campaign.create({
    data: {
      name,
      startDate: parseDateTimeLocal(
        startDate,
        timezoneOffset
      ),
      endDate: parseDateTimeLocal(
        endDate,
        timezoneOffset
      ),
      discountType,
      saleValue: Number(saleValue),
      status: "scheduled",
    },
  });

  for (const item of products) {
    const product = JSON.parse(item);

    await prisma.campaignProduct.create({
      data: {
        campaignId: campaign.id,

        productId: product.id,
        productTitle: product.title,

        variantId: product.variantId,

        originalPrice: product.originalPrice
          ? Number(product.originalPrice)
          : null,

        originalComparePrice:
          product.originalComparePrice
            ? Number(product.originalComparePrice)
            : null,

        salePrice: Number(saleValue),
      },
    });
  }

  return redirect("/app/campaigns");

};

export default function CreateCampaignPage({ loaderData }) {
  const { products } = loaderData;

  const [search, setSearch] = useState("");
  const [
    selectedCollection,
    setSelectedCollection,
  ] = useState("");
  const [
    selectedProductIds,
    setSelectedProductIds,
  ] = useState([]);
  const [
    timezoneOffset,
    setTimezoneOffset,
  ] = useState("0");

  useEffect(() => {
    setTimezoneOffset(
      String(new Date().getTimezoneOffset())
    );
  }, []);

  const collections = Array.from(
    new Map(
      products
        .flatMap(
          (product) =>
            product.collections?.nodes || []
        )
        .map((collection) => [
          collection.id,
          collection,
        ])
    ).values()
  ).sort((first, second) =>
    first.title.localeCompare(second.title)
  );

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCollection =
        !selectedCollection ||
        product.collections?.nodes?.some(
          (collection) =>
            collection.id === selectedCollection
        );

      return matchesSearch && matchesCollection;
    }
  );

  const selectedProducts = products.filter(
    (product) =>
      selectedProductIds.includes(product.id)
  );

  const filteredProductIds = filteredProducts.map(
    (product) => product.id
  );

  const allVisibleSelected =
    filteredProductIds.length > 0 &&
    filteredProductIds.every((productId) =>
      selectedProductIds.includes(productId)
    );

  const toggleProduct = (productId) => {
    setSelectedProductIds((currentIds) =>
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId]
    );
  };

  const selectVisibleProducts = () => {
    setSelectedProductIds((currentIds) =>
      Array.from(
        new Set([
          ...currentIds,
          ...filteredProductIds,
        ])
      )
    );
  };

  const clearVisibleProducts = () => {
    setSelectedProductIds((currentIds) =>
      currentIds.filter(
        (productId) =>
          !filteredProductIds.includes(productId)
      )
    );
  };

  const selectCollectionProducts = () => {
    if (!selectedCollection) {
      return;
    }

    const collectionProductIds = products
      .filter((product) =>
        product.collections?.nodes?.some(
          (collection) =>
            collection.id === selectedCollection
        )
      )
      .map((product) => product.id);

    setSelectedProductIds((currentIds) =>
      Array.from(
        new Set([
          ...currentIds,
          ...collectionProductIds,
        ])
      )
    );
  };

  const clearSelection = () => {
    setSelectedProductIds([]);
  };

  const getProductFormValue = (product) =>
    JSON.stringify({
      id: product.id,
      title: product.title,

      variantId:
        product.variants.nodes[0]?.id,

      originalPrice:
        product.variants.nodes[0]?.price,

      originalComparePrice:
        product.variants.nodes[0]
          ?.compareAtPrice,
    });

  return (
    <s-page heading="Create Campaign">
      <Form method="post">
        <input
          type="hidden"
          name="timezoneOffset"
          value={timezoneOffset}
        />

        <div className="campaign-card">

          <h3>Campaign Information</h3>

          <div className="form-group">
            <label>Campaign Name</label>

            <input
              type="text"
              name="name"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Start Date</label>

            <input
              type="datetime-local"
              name="startDate"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>End Date</label>

            <input
              type="datetime-local"
              name="endDate"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Discount Type</label>

            <select
              name="discountType"
              className="form-control"
            >
              <option value="fixed_price">
                Fixed Price
              </option>

              <option value="percentage_discount">
                Percentage Discount
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Sale Value</label>

            <input
              type="number"
              step="0.01"
              name="saleValue"
              required
              className="form-control"
            />
          </div>

        </div>

        <div className="campaign-card">

          <h3>Select Products</h3>

          {selectedProducts.map((product) => (
            <input
              key={product.id}
              type="hidden"
              name="products"
              value={getProductFormValue(product)}
            />
          ))}

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <input
              type="text"
              placeholder="Search products..."
              className="product-search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <select
                className="form-control"
                value={selectedCollection}
                onChange={(event) =>
                  setSelectedCollection(
                    event.target.value
                  )
                }
                style={{
                  maxWidth: "280px",
                }}
              >
                <option value="">
                  All collections
                </option>

                {collections.map((collection) => (
                  <option
                    key={collection.id}
                    value={collection.id}
                  >
                    {collection.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={selectCollectionProducts}
                disabled={!selectedCollection}
              >
                Select Collection
              </button>

              <button
                type="button"
                onClick={
                  allVisibleSelected
                    ? clearVisibleProducts
                    : selectVisibleProducts
                }
                disabled={filteredProducts.length === 0}
              >
                {allVisibleSelected
                  ? "Clear Visible"
                  : "Select All Visible"}
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={
                  selectedProductIds.length === 0
                }
              >
                Clear All
              </button>
            </div>

            <div>
              Selected {selectedProductIds.length} of{" "}
              {products.length} products
            </div>
          </div>

          <div className="product-list">

            {filteredProducts.map((product) => (
              <label
                key={product.id}
                className="product-item"
              >
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(
                    product.id
                  )}
                  onChange={() =>
                    toggleProduct(product.id)
                  }
                />

                <div className="product-info">

                  <div className="product-title">
                    {product.title}
                  </div>

                  <div className="product-price">
                    Price: $
                    {product.variants.nodes[0]
                      ?.price || "0"}
                  </div>

                </div>
              </label>
            ))}

            {filteredProducts.length === 0 && (
              <div className="product-item">
                No products found.
              </div>
            )}

          </div>

        </div>

        <button
          type="submit"
          className="save-button"
        >
          Save Campaign
        </button>

      </Form>
    </s-page>
  );
}
