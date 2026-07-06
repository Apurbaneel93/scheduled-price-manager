import "../styles/app-style.css";
import { authenticate } from "../shopify.server";
import logo from "../../assets/images/scheduled-price-manager-icon.png";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page>

      <div className="spm-dashboard">

        {/* Header */}
        <div className="spm-header">
          <div className="spm-brand">

            <img
              src={logo}
              alt="Scheduled Price Manager"
              className="spm-logo"
            />

            <div>
              <h1>Scheduled Price Manager</h1>
              <p>
                Automate product sales, discounts, and price restoration with
                scheduled campaigns.
              </p>
            </div>

          </div>

          <s-link href="/app/create-campaign">
            <s-button variant="primary">
              Create Campaign
            </s-button>
          </s-link>
        </div>

        {/* Welcome Card */}
        <div className="spm-card">
          <div className="card-header">
            <h2>Welcome</h2>
          </div>

          <p>
            Schedule automatic product price changes for sales events,
            promotions, flash sales, and seasonal campaigns.
          </p>
        </div>

        {/* Setup Guide */}
        <div className="spm-card">
          <div className="card-header">
            <h2>Getting Started</h2>
            <span>4 Easy Steps</span>
          </div>

          <div className="task-list">

            <div className="task-item">
              <span>1️⃣ Create a Campaign</span>
            </div>

            <div className="task-item">
              <span>2️⃣ Select Products</span>
            </div>

            <div className="task-item">
              <span>3️⃣ Configure Schedule</span>
            </div>

            <div className="task-item">
              <span>4️⃣ Activate Campaign</span>
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">

          <div className="stat-card">
            <h3>Active Campaigns</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Scheduled Products</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Completed Campaigns</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Status</h3>
            <div className="status-badge">
              Ready
            </div>
          </div>

        </div>

        {/* Features */}
        <div className="feature-grid">

          <div className="feature-card">
            <h3>📅 Schedule Campaigns</h3>
            <p>
              Launch discounts automatically at a specific date and time.
            </p>
          </div>

          <div className="feature-card">
            <h3>🏷 Bulk Discounts</h3>
            <p>
              Update prices across multiple products simultaneously.
            </p>
          </div>

          <div className="feature-card">
            <h3>⚡ Auto Revert</h3>
            <p>
              Automatically restore original prices after campaign completion.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 Campaign Monitoring</h3>
            <p>
              Track active and upcoming scheduled pricing campaigns.
            </p>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="spm-card">
          <h2>Quick Actions</h2>

          <div className="quick-actions">

            <s-link href="/app/create-campaign">
              <s-button variant="primary">
                Create Campaign
              </s-button>
            </s-link>

            <s-link href="/app/campaigns">
              <s-button>
                View Campaigns
              </s-button>
            </s-link>

          </div>
        </div>

      </div>

    </s-page>
  );
}