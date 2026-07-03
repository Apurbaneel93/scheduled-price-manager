import { Form, redirect } from "react-router";
import { useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);
//   return null;
// };


export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 50) {
        nodes {
          id
          title

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
      startDate: new Date(startDate),
      endDate: new Date(endDate),
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

  const filteredProducts = products.filter(
    (product) =>
      product.title
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <s-page heading="Create Campaign">
      <Form method="post">

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

          <input
            type="text"
            placeholder="🔍 Search products..."
            className="product-search"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <div className="product-list">

            {filteredProducts.map((product) => (
              <label
                key={product.id}
                className="product-item"
              >
                <input
                  type="checkbox"
                  name="products"
                  value={JSON.stringify({
                    id: product.id,
                    title: product.title,

                    variantId:
                      product.variants.nodes[0]?.id,

                    originalPrice:
                      product.variants.nodes[0]?.price,

                    originalComparePrice:
                      product.variants.nodes[0]
                        ?.compareAtPrice,
                  })}
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