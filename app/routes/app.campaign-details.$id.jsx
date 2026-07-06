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
      priceJobs: true,
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

  const jobStats = campaign.priceJobs.reduce(
    (stats, job) => ({
      ...stats,
      [job.status]:
        (stats[job.status] || 0) + 1,
    }),
    {}
  );

  return (
    <s-page heading="Campaign Details">

      <s-section heading="Campaign Information">

        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
        >

          <p>
            <strong>Name:</strong>{" "}
            {campaign.name}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {campaign.status}
          </p>

          <p>
            <strong>Discount Type:</strong>{" "}
            {campaign.discountType ===
            "fixed_price"
              ? "Fixed Price"
              : "Percentage Discount"}
          </p>

          <p>
            <strong>Sale Value:</strong>{" "}
            {campaign.saleValue}
          </p>

          <p>
            <strong>Products:</strong>{" "}
            {campaign.products.length}
          </p>

          <p>
            <strong>Price Jobs:</strong>{" "}
            {campaign.priceJobs.length} total,{" "}
            {jobStats.pending || 0} pending,{" "}
            {jobStats.processing || 0} processing,{" "}
            {jobStats.completed || 0} completed,{" "}
            {jobStats.failed || 0} failed
          </p>

          <p>
            <strong>Start Date:</strong>{" "}
            {new Date(
              campaign.startDate
            ).toLocaleString()}
          </p>

          <p>
            <strong>End Date:</strong>{" "}
            {new Date(
              campaign.endDate
            ).toLocaleString()}
          </p>

        </s-box>

      </s-section>

      <s-section heading="Campaign Products">

        {campaign.products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th align="left">
                  Product
                </th>

                <th align="left">
                  Original Price
                </th>

                <th align="left">
                  Sale Price
                </th>

                <th align="left">
                  Compare Price
                </th>

                <th align="left">
                  Variant
                </th>
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
                        ? product.variantId.slice(
                            -12
                          )
                        : "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}

      </s-section>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        <a href="/app/campaigns">
          ← Back to Campaigns
        </a>
      </div>

    </s-page>
  );
}
