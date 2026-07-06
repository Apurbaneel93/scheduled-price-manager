import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);

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

  return { campaign };
};

export default function CampaignDetailsPage({ loaderData }) {
  const { campaign } = loaderData;

  return (
    <s-page>

      <div className="spm-dashboard">

        <div className="spm-header">

          <div>
            <h1>{campaign.name}</h1>

            <p>
              Campaign details and product pricing information.
            </p>
          </div>

          <s-link href="/app/campaigns">
            <s-button>
              Back to Campaigns
            </s-button>
          </s-link>

        </div>

        <div className="stats-grid">

          <div className="stat-card">
            <h3>Status</h3>

            <div
              className={`badge ${campaign.status}`}
            >
              {campaign.status}
            </div>
          </div>

          <div className="stat-card">
            <h3>Products</h3>

            <div className="stat-value">
              {campaign.products.length}
            </div>
          </div>

          <div className="stat-card">
            <h3>Discount Value</h3>

            <div className="stat-value">
              {campaign.saleValue}
            </div>
          </div>

          <div className="stat-card">
            <h3>Type</h3>

            <div className="summary-value">
              {campaign.discountType === "fixed_price"
                ? "Fixed Price"
                : "Percentage"}
            </div>
          </div>

        </div>

        <div className="spm-card">

          <div className="card-header">
            <h2>Campaign Information</h2>
          </div>

          <div className="details-grid">

            <div className="detail-item">
              <span className="detail-label">
                Campaign Name
              </span>

              <span className="detail-value">
                {campaign.name}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                Start Date
              </span>

              <span className="detail-value">
                {new Date(
                  campaign.startDate
                ).toLocaleString()}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                End Date
              </span>

              <span className="detail-value">
                {new Date(
                  campaign.endDate
                ).toLocaleString()}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                Discount Type
              </span>

              <span className="detail-value">
                {campaign.discountType === "fixed_price"
                  ? "Fixed Price"
                  : "Percentage Discount"}
              </span>
            </div>

          </div>

        </div>

        <div className="spm-card">

          <div className="card-header">
            <h2>Campaign Products</h2>

            <span>
              {campaign.products.length} Products
            </span>
          </div>

          {campaign.products.length === 0 ? (
            <div className="empty-state">
              No products found.
            </div>
          ) : (
            <div className="campaign-table-wrapper">

              <table className="campaign-table">

                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Original Price</th>
                    <th>Sale Price</th>
                    <th>Compare Price</th>
                    <th>Variant</th>
                  </tr>
                </thead>

                <tbody>

                  {campaign.products.map(
                    (product) => (
                      <tr key={product.id}>

                        <td>
                          {product.productTitle}
                        </td>

                        <td>
                          {product.originalPrice
                            ? Number(
                                product.originalPrice
                              ).toFixed(2)
                            : "-"}
                        </td>

                        <td>
                          {product.salePrice
                            ? Number(
                                product.salePrice
                              ).toFixed(2)
                            : "-"}
                        </td>

                        <td>
                          {product.originalComparePrice
                            ? Number(
                                product.originalComparePrice
                              ).toFixed(2)
                            : "-"}
                        </td>

                        <td>
                          {product.variantId
                            ? product.variantId.slice(-12)
                            : "-"}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

    </s-page>
  );
}