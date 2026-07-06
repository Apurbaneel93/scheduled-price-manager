import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { Form } from "react-router";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const campaigns = await prisma.campaign.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: campaigns.length,

    scheduled: campaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length,

    active: campaigns.filter(
      (campaign) =>
        campaign.status === "active" ||
        campaign.status === "starting" ||
        campaign.status === "stopping"
    ).length,

    completed: campaigns.filter(
      (campaign) => campaign.status === "completed"
    ).length,
  };

  return {
    campaigns,
    stats,
  };
};

export default function CampaignsPage({ loaderData }) {
  const { campaigns, stats } = loaderData;

  return (
    <s-page heading="Campaigns">

      <s-section heading="Campaign Dashboard">

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <strong>Total Campaigns</strong>
            <div>{stats.total}</div>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <strong>Scheduled</strong>
            <div>{stats.scheduled}</div>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <strong>Active</strong>
            <div>{stats.active}</div>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <strong>Completed</strong>
            <div>{stats.completed}</div>
          </s-box>
        </div>

      </s-section>

      <s-section heading="Scheduled Price Campaigns">

        <s-paragraph>
          Total Campaigns: {campaigns.length}
        </s-paragraph>

        {campaigns.length === 0 ? (
          <s-paragraph>
            No campaigns found.
          </s-paragraph>
        ) : (
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th align="left">Campaign</th>
                  <th align="left">Type</th>
                  <th align="left">Status</th>
                  <th align="left">Start</th>
                  <th align="left">End</th>
                  <th align="left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>
                      {campaign.name}
                    </td>

                    <td>
                      {campaign.discountType ===
                      "fixed_price"
                        ? "Fixed Price"
                        : "Percentage"}
                    </td>

                    <td>
                      {campaign.status ===
                        "scheduled" &&
                        "🟡 Scheduled"}

                      {campaign.status ===
                        "active" &&
                        "🟢 Active"}

                      {campaign.status ===
                        "starting" &&
                        "🔵 Starting"}

                      {campaign.status ===
                        "stopping" &&
                        "🔵 Stopping"}

                      {campaign.status ===
                        "completed" &&
                        "⚫ Completed"}

                      {campaign.status ===
                        "start_failed" &&
                        "🔴 Start Failed"}

                      {campaign.status ===
                        "stop_failed" &&
                        "🔴 Stop Failed"}
                    </td>

                    <td>
                      {new Date(
                        campaign.startDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {new Date(
                        campaign.endDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <Form
                          method="get"
                          action={`/app/campaign-details/${campaign.id}`}
                        >
                          <button type="submit">
                            View
                          </button>
                        </Form>

                        {campaign.status ===
                          "scheduled" && (
                          <>
                            <Form
                              method="get"
                              action={`/app/edit-campaign/${campaign.id}`}
                            >
                              <button type="submit">
                                Edit
                              </button>
                            </Form>

                            <Form
                              method="post"
                              action={`/app/run-campaign/${campaign.id}`}
                            >
                              <button type="submit">
                                Run Now
                              </button>
                            </Form>
                          </>
                        )}

                        {(campaign.status ===
                          "active" ||
                          campaign.status ===
                            "start_failed") && (
                          <Form
                            method="post"
                            action={`/app/stop-campaign/${campaign.id}`}
                          >
                            <button type="submit">
                              Stop Campaign
                            </button>
                          </Form>
                        )}

                        {campaign.status ===
                          "completed" && (
                          <Form
                            method="post"
                            action={`/app/delete-campaign/${campaign.id}`}
                          >
                            <button type="submit">
                              Delete
                            </button>
                          </Form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </s-box>
        )}
      </s-section>

    </s-page>
  );
}
