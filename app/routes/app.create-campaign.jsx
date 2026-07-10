import { Form, redirect } from "react-router";
import { useEffect, useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { parseDateTimeLocal } from "../utils/dates.server";
import "../styles/app-style.css";
import ProductSelector from "../components/ProductSelector.jsx";
import CampaignDateTimePicker from "../components/CampaignDateTimePicker.jsx";


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

  if (responseJson.errors) {
    throw new Response(
      "Failed to load products",
      { status: 500 }
    );
  }

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
  //const saleValue = formData.get("saleValue");
  const saleValue = parseFloat(formData.get("saleValue"));
  const products = formData.getAll("products");

  if (!name?.trim()) {
  throw new Response("Campaign name is required", {
    status: 400,
  });
}

if (!products.length) {
  throw new Response("Please select at least one product", {
    status: 400,
  });
}

if (!startDate || !endDate) {
  throw new Response("Start and end date/time are required", {
    status: 400,
  });
}

if (saleValue <= 0) {
  throw new Response("Sale value must be greater than zero", {
    status: 400,
  });
}

if (
  discountType === "percentage_discount" &&
  Number(saleValue) > 100
) {
  throw new Response(
    "Percentage discount cannot exceed 100%",
    { status: 400 }
  );
}

const parsedStartDate = parseDateTimeLocal(startDate, timezoneOffset);
const parsedEndDate = parseDateTimeLocal(endDate, timezoneOffset);

if (!parsedStartDate || !parsedEndDate || parsedStartDate >= parsedEndDate) {
  throw new Response(
    "End date must be after start date",
    { status: 400 }
  );
}

try {
  await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        name,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        discountType,
        saleValue: Number(saleValue),
        status: "scheduled",
      },
    });
    const campaignProducts = products.map((item) => {
      
      let product;
      try {
        product = JSON.parse(item);
      } catch {
        throw new Response("Invalid product payload", {
          status: 400,
        });
      }
      if (!product.id || !product.variantId) {
        throw new Response("Invalid product data", {
          status: 400,
        });
      }

      return {
        campaignId: campaign.id,
        productId: product.id,
        productTitle: product.title,
        variantId: product.variantId,
        originalPrice: product.originalPrice
          ? Number(product.originalPrice)
          : null,
        originalComparePrice: product.originalComparePrice
          ? Number(product.originalComparePrice)
          : null,
        salePrice: Number(saleValue),
      };
    });
    await tx.campaignProduct.createMany({
      data: campaignProducts,
    });
  });
} catch (error) {
  console.error(error);

  if (error instanceof Response) {
    throw error;
  }

  throw new Response(
    "Unable to create campaign.",
    {
      status: 500,
    }
  );
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setTimezoneOffset(
      String(new Date().getTimezoneOffset())
    );
  }, []);

  const selectedProducts = products.filter(
    (product) =>
      selectedProductIds.includes(product.id)
  );

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

  

  const handleSubmit = (e) => {
    if (!selectedProductIds.length) {
      e.preventDefault();
      alert("Please select at least one product.");
      return;
    }

    const form = e.currentTarget;
    const start = startDate;
    const end = endDate;
    const saleValue = Number(form.saleValue.value);

    if (!start || !end || start >= end) {
      e.preventDefault();
      alert("Select a start and end date/time, with the end after the start.");
      return;
    }

    if (saleValue <= 0) {
      e.preventDefault();
      alert("Sale value must be greater than zero.");
      return;
    }

    if (
      form.discountType.value ===
        "percentage_discount" &&
      saleValue > 100
    ) {
      e.preventDefault();
      alert("Percentage cannot exceed 100%");
      return;
    }
  };


  return (
    <s-page>

      <div className="spm-dashboard">

        <div className="spm-header">
          <div>
            <h1>Create Campaign</h1>
            <p>Schedule product discounts and automate price updates.</p>
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

            {/* Campaign Information */}
            <div className="campaign-card">

              <div className="card-header">
                <h2>Campaign Information</h2>
              </div>

              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  name="name"
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
                  name="saleValue"
                  step="0.01"
                  min="0"
                  required
                  className="form-control"
                />
              </div>

              {/* <div className="summary-box">
                <h3>Summary</h3>
                <div className="summary-grid">

                  <div className="summary-item">
                    <div className="summary-label">
                      Selected Products
                    </div>
                    <div className="summary-value">
                      {selectedProductIds.length}
                    </div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-label">
                      Total Products
                    </div>
                    <div className="summary-value">
                      {products.length}
                    </div>
                  </div>

                </div>
              </div> */}

            </div>

            {/* Product Selection */}
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

          <div className="page-actions">
            <button type="submit" className="save-button" disabled={!selectedProductIds.length}>
              Create Campaign
            </button>
          </div>
        </Form>
      </div>
    </s-page>
  );
}
