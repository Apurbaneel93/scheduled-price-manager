import { Form, redirect } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);

  const campaign = await prisma.campaign.findUnique({
    where: {
      id: params.id,
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

  return { campaign };
};

export const action = async ({ request, params }) => {
  await authenticate.admin(request);

  const formData = await request.formData();

  const name = formData.get("name");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");
  const discountType = formData.get("discountType");
  const saleValue = parseFloat(formData.get("saleValue"));

  console.log("==========");
  console.log("EDIT CAMPAIGN");
  console.log("Campaign ID:", params.id);
  console.log("Sale Value:", saleValue);
  console.log("==========");

  await prisma.campaign.update({
    where: {
      id: params.id,
    },
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      discountType,
      saleValue,
    },
  });

  const updateResult = await prisma.campaignProduct.updateMany({
    where: {
      campaignId: params.id,
    },
    data: {
      salePrice: saleValue,
    },
  });

  console.log("Campaign Products Updated:", updateResult.count);

  const products = await prisma.campaignProduct.findMany({
    where: {
      campaignId: params.id,
    },
  });

  console.log("UPDATED PRODUCTS");
  console.log(JSON.stringify(products, null, 2));

  return redirect("/app/campaigns");
};

export default function EditCampaignPage({ loaderData }) {
  const { campaign } = loaderData;

  return (
    <s-page heading="Edit Campaign">
      <s-section heading="Campaign Information">
        <Form method="post">

          <div style={{ marginBottom: "16px" }}>
            <label>Campaign Name</label>
            <br />
            <input
              type="text"
              name="name"
              defaultValue={campaign.name}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Start Date</label>
            <br />
            <input
              type="datetime-local"
              name="startDate"
              defaultValue={
                new Date(campaign.startDate)
                  .toISOString()
                  .slice(0, 16)
              }
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>End Date</label>
            <br />
            <input
              type="datetime-local"
              name="endDate"
              defaultValue={
                new Date(campaign.endDate)
                  .toISOString()
                  .slice(0, 16)
              }
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Discount Type</label>
            <br />
            <select
              name="discountType"
              defaultValue={campaign.discountType}
            >
              <option value="fixed_price">
                Fixed Price
              </option>

              <option value="percentage_discount">
                Percentage Discount
              </option>
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Sale Value</label>
            <br />
            <input
              type="number"
              step="0.01"
              name="saleValue"
              defaultValue={campaign.saleValue}
              required
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button type="submit">
              Update Campaign
            </button>

            <a href="/app/campaigns">
              Cancel
            </a>
          </div>

        </Form>
      </s-section>
    </s-page>
  );
}