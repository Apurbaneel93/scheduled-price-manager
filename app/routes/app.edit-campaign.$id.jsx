import { Form, redirect } from "react-router";
import { useEffect, useState } from "react";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { parseDateTimeLocal } from "../utils/dates.server";

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
  const timezoneOffset = formData.get("timezoneOffset");
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
      startDate: parseDateTimeLocal(
        startDate,
        timezoneOffset
      ),
      endDate: parseDateTimeLocal(
        endDate,
        timezoneOffset
      ),
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

        <Form method="post">

          <input
            type="hidden"
            name="timezoneOffset"
            value={timezoneOffset}
          />

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

              <div className="form-group">
                <label>Start Date</label>

                <input
                  type="datetime-local"
                  name="startDate"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>End Date</label>

                <input
                  type="datetime-local"
                  name="endDate"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  required
                  className="form-control"
                />
              </div>

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

            <div className="campaign-card">

              <div className="card-header">
                <h2>Campaign Summary</h2>
              </div>

              <div className="summary-grid">

                <div className="summary-item">
                  <div className="summary-label">
                    Status
                  </div>

                  <div className="summary-value">
                    {campaign.status}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-label">
                    Discount Type
                  </div>

                  <div className="summary-value">
                    {campaign.discountType === "fixed_price"
                      ? "Fixed Price"
                      : "Percentage"}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-label">
                    Current Value
                  </div>

                  <div className="summary-value">
                    {campaign.saleValue}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-label">
                    Campaign ID
                  </div>

                  <div className="summary-value">
                    {campaign.id.slice(0, 8)}
                  </div>
                </div>

              </div>

            </div>

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
