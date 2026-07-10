import { Form, redirect } from "react-router";
import { useEffect, useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { parseDateTimeLocal } from "../utils/dates.server";
import CampaignDateTimePicker from "../components/CampaignDateTimePicker.jsx";
import ProductSelector from "../components/ProductSelector.jsx";

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: params.id,
    },
    include: {
      products: true,
    },
  });

  if (!campaign) {
    throw new Response("Campaign not found", {
      status: 404,
    });
  }

  // Only allow editing scheduled campaigns
  if (campaign.status !== "scheduled") {
    return redirect("/app/campaigns");
  }

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

  if (responseJson.errors) {
    throw new Response("Failed to load products", { status: 500 });
  }

  return {
    campaign,
    products: responseJson.data.products.nodes,
  };
};

export const action = async ({ request, params }) => {
  await authenticate.admin(request);

  const formData = await request.formData();

  const name = formData.get("name");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const timezoneOffset = formData.get("timezoneOffset");
  const discountType = formData.get("discountType");
  const saleValue = parseFloat(formData.get("saleValue"));
  const products = formData.getAll("products");

  if (!name?.trim() || !startDate || !endDate || !Number.isFinite(saleValue) || saleValue <= 0) {
    throw new Response("Provide a name, valid dates, and a sale value greater than zero", { status: 400 });
  }

  if (!products.length) {
    throw new Response("Please select at least one product", { status: 400 });
  }

  if (discountType === "percentage_discount" && saleValue > 100) {
    throw new Response("Percentage discount cannot exceed 100%", { status: 400 });
  }

  const parsedStartDate = parseDateTimeLocal(startDate, timezoneOffset);
  const parsedEndDate = parseDateTimeLocal(endDate, timezoneOffset);

  if (!parsedStartDate || !parsedEndDate || parsedStartDate >= parsedEndDate) {
    throw new Response("End date must be after start date", { status: 400 });
  }

  const campaignProducts = products.map((item) => {
    let product;
    try {
      product = JSON.parse(item);
    } catch {
      throw new Response("Invalid product payload", { status: 400 });
    }

    if (!product.id || !product.variantId) {
      throw new Response("Invalid product data", { status: 400 });
    }

    return {
      campaignId: params.id,
      productId: product.id,
      productTitle: product.title,
      variantId: product.variantId,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      originalComparePrice: product.originalComparePrice ? Number(product.originalComparePrice) : null,
      salePrice: saleValue,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: params.id },
      data: {
        name,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        discountType,
        saleValue,
      },
    });

    await tx.campaignProduct.deleteMany({
      where: { campaignId: params.id },
    });
    await tx.campaignProduct.createMany({ data: campaignProducts });
  });

  return redirect("/app/campaigns");
};

export default function EditCampaignPage({ loaderData }) {
  const { campaign, products } = loaderData;
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState(() =>
    campaign.products.map((product) => product.productId)
  );
  const [
    timezoneOffset,
    setTimezoneOffset,
  ] = useState("0");
  const [startDate, setStartDate] = useState(
    ""
  );
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const formatDateTimeLocal = (value) => {
      const date = new Date(value);
      const localDate = new Date(
        date.getTime() -
          date.getTimezoneOffset() * 60 * 1000
      );

      return localDate
        .toISOString()
        .slice(0, 16);
    };

    setTimezoneOffset(
      String(new Date().getTimezoneOffset())
    );
    setStartDate(
      formatDateTimeLocal(campaign.startDate)
    );
    setEndDate(formatDateTimeLocal(campaign.endDate));
  }, [campaign.endDate, campaign.startDate]);

  const handleSubmit = (event) => {
    if (!selectedProductIds.length) {
      event.preventDefault();
      alert("Please select at least one product.");
      return;
    }

    if (!startDate || !endDate || startDate >= endDate) {
      event.preventDefault();
      alert("End date and time must be after the start date and time.");
    }
  };

  const selectedProducts = products.filter((product) =>
    selectedProductIds.includes(product.id)
  );

  const getProductFormValue = (product) =>
    JSON.stringify({
      id: product.id,
      title: product.title,
      variantId: product.variants.nodes[0]?.id,
      originalPrice: product.variants.nodes[0]?.price,
      originalComparePrice: product.variants.nodes[0]?.compareAtPrice,
    });

  return (
    <s-page>

      <div className="spm-dashboard">

        <div className="spm-header">

          <div>
            <h1>Edit Campaign</h1>

            <p>
              Update campaign schedule and pricing configuration.
            </p>
          </div>

        </div>

        <Form method="post" onSubmit={handleSubmit}>

          <input
            type="hidden"
            name="timezoneOffset"
            value={timezoneOffset}
          />

          {selectedProducts.map((product) => (
            <input
              key={product.id}
              type="hidden"
              name="products"
              value={getProductFormValue(product)}
            />
          ))}

          <div className="create-campaign-layout">

            <div className="campaign-card">

              <div className="card-header">
                <h2>Campaign Information</h2>
              </div>

              <div className="form-group">
                <label>Campaign Name</label>

                <input
                  type="text"
                  name="name"
                  defaultValue={campaign.name}
                  required
                  className="form-control"
                />
              </div>

              <CampaignDateTimePicker
                label="Start Date & Time"
                name="startDate"
                value={startDate}
                onChange={setStartDate}
              />

              <CampaignDateTimePicker
                label="End Date & Time"
                name="endDate"
                value={endDate}
                onChange={setEndDate}
              />

              <div className="form-group">
                <label>Discount Type</label>

                <select
                  name="discountType"
                  defaultValue={campaign.discountType}
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
                  defaultValue={campaign.saleValue}
                  required
                  className="form-control"
                />
              </div>

            </div>

            <ProductSelector
              products={products}
              search={search}
              setSearch={setSearch}
              selectedCollection={selectedCollection}
              setSelectedCollection={setSelectedCollection}
              selectedProductIds={selectedProductIds}
              setSelectedProductIds={setSelectedProductIds}
            />

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "24px",
              gap: "12px",
            }}
          >

            <s-link href="/app/campaigns">
              <s-button>
                Cancel
              </s-button>
            </s-link>

            <button
              type="submit"
              className="save-button"
              style={{
                width: "auto",
                minWidth: "220px",
              }}
            >
              Update Campaign
            </button>

          </div>

        </Form>

      </div>

    </s-page>
  );
}
