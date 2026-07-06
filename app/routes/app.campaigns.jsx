import "../styles/app-style.css";
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
      (campaign) => campaign.status === "active"
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
    <s-page>
      <div className="spm-dashboard">

        <div className="spm-header">
          <div>
            <h1>Campaigns</h1>

            <p>
              Manage and monitor all scheduled pricing campaigns.
            </p>
          </div>

          <s-link href="/app/create-campaign">
            <s-button variant="primary">
              Create Campaign
            </s-button>
          </s-link>
        </div>

        <div className="stats-grid">

          <div className="stat-card">
            <h3>Total Campaigns</h3>
            <div className="stat-value">
              {stats.total}
            </div>
          </div>

          <div className="stat-card">
            <h3>Scheduled</h3>
            <div className="stat-value">
              {stats.scheduled}
            </div>
          </div>

          <div className="stat-card">
            <h3>Active</h3>
            <div className="stat-value">
              {stats.active}
            </div>
          </div>

          <div className="stat-card">
            <h3>Completed</h3>
            <div className="stat-value">
              {stats.completed}
            </div>
          </div>

        </div>

        <div className="spm-card">

          <div className="card-header">
            <h2>Scheduled Price Campaigns</h2>

            <span>
              Total: {campaigns.length}
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="empty-state">
              <h3>No Campaigns Found</h3>

              <p>
                Create your first scheduled pricing campaign.
              </p>

              <s-link href="/app/create-campaign">
                <s-button variant="primary">
                  Create Campaign
                </s-button>
              </s-link>
            </div>
          ) : (
            <div className="campaign-table-wrapper">

              <table className="campaign-table">

                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {campaigns.map((campaign) => (

                    <tr key={campaign.id}>

                      <td>
                        <strong>
                          {campaign.name}
                        </strong>
                      </td>

                      <td>
                        {campaign.discountType === "fixed_price"
                          ? "Fixed Price"
                          : "Percentage"}
                      </td>

                      <td>
                        {campaign.status === "scheduled" && (
                          <span className="badge scheduled">
                            Scheduled
                          </span>
                        )}

                        {campaign.status === "active" && (
                          <span className="badge active">
                            Active
                          </span>
                        )}

                        {campaign.status === "completed" && (
                          <span className="badge completed">
                            Completed
                          </span>
                        )}
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

                        <div className="action-buttons">

                          <Form
                            method="get"
                            action={`/app/campaign-details/${campaign.id}`}
                          >
                            <button
                              type="submit"
                              className="btn btn-view"
                            >
                              View
                            </button>
                          </Form>

                          {campaign.status === "scheduled" && (
                            <>
                              <Form
                                method="get"
                                action={`/app/edit-campaign/${campaign.id}`}
                              >
                                <button
                                  type="submit"
                                  className="btn btn-edit"
                                >
                                  Edit
                                </button>
                              </Form>

                              <Form
                                method="post"
                                action={`/app/run-campaign/${campaign.id}`}
                              >
                                <button
                                  type="submit"
                                  className="btn btn-run"
                                >
                                  Run Now
                                </button>
                              </Form>
                            </>
                          )}

                          {campaign.status === "active" && (
                            <Form
                              method="post"
                              action={`/app/stop-campaign/${campaign.id}`}
                            >
                              <button
                                type="submit"
                                className="btn btn-stop"
                              >
                                Stop
                              </button>
                            </Form>
                          )}

                          {campaign.status === "completed" && (
                            <Form
                              method="post"
                              action={`/app/delete-campaign/${campaign.id}`}
                            >
                              <button
                                type="submit"
                                className="btn btn-delete"
                              >
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

            </div>
          )}

        </div>

      </div>
    </s-page>
  );
}