import {
  authorizeCronRequest,
  getOfflineAdminClient,
} from "../utils/shopify-admin.server";
import { processPriceJobs } from "../utils/price-jobs.server";

export const loader = async ({ request }) => {
  authorizeCronRequest(request);

  const url = new URL(request.url);
  const admin = await getOfflineAdminClient();

  const result = await processPriceJobs(
    admin,
    url.searchParams.get("batchSize")
  );

  return Response.json({
    success: true,
    ...result,
    checkedAt: new Date(),
  });
};
