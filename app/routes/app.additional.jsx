import "app/styles/app-style.css";

export default function AdditionalPage() {
  return (
    <s-page>
      <div className="spm-dashboard">

        {/* Header */}
        <div className="spm-header">
          <div className="spm-brand">
            <img
              src="/scheduled-price-manager-icon.png"
              alt="Scheduled Price Manager"
              className="spm-logo"
            />

            <div>
              <h1>Scheduled Price Manager</h1>
              <p>
                Automate product pricing with powerful scheduling controls.
              </p>
            </div>
          </div>

          <s-button variant="primary">
            Create Schedule
          </s-button>
        </div>

        {/* Setup Guide */}
        <div className="spm-card">
          <div className="card-header">
            <h2>Getting Started</h2>
            <span>0 of 4 tasks complete</span>
          </div>

          <div className="task-list">
            <div className="task-item">
              <span>⚪ Create your first pricing campaign</span>
            </div>

            <div className="task-item">
              <span>⚪ Select products or collections</span>
            </div>

            <div className="task-item">
              <span>⚪ Set start & end dates</span>
            </div>

            <div className="task-item">
              <span>⚪ Activate the schedule</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">

          <div className="stat-card">
            <h3>Active Schedules</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Products Scheduled</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Price Updates</h3>
            <div className="stat-value">0</div>
          </div>

          <div className="stat-card">
            <h3>Status</h3>
            <div className="status-badge">
              Ready
            </div>
          </div>

        </div>

        {/* Feature Cards */}
        <div className="feature-grid">

          <div className="feature-card">
            <h3>📅 Campaign Scheduling</h3>
            <p>
              Schedule sales and automatically restore original prices.
            </p>
          </div>

          <div className="feature-card">
            <h3>🏷 Bulk Price Updates</h3>
            <p>
              Apply discounts across multiple products at once.
            </p>
          </div>

          <div className="feature-card">
            <h3>⚡ Automatic Revert</h3>
            <p>
              Original prices are restored when campaigns end.
            </p>
          </div>

          <div className="feature-card">
            <h3>📊 Campaign Tracking</h3>
            <p>
              Monitor all scheduled pricing activities.
            </p>
          </div>

        </div>

        {/* Recent Activity */}
        <div className="spm-card">
          <h2>Recent Schedules</h2>

          <div className="empty-state">
            <p>No schedules created yet.</p>

            <s-button variant="primary">
              Create First Schedule
            </s-button>
          </div>
        </div>

      </div>
    </s-page>
  );
}