import { redirect } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import {
  enqueueCampaignPriceJobs,
  processPriceJobs,
} from "../utils/price-jobs.server";

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);

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

  if (
    campaign.status === "completed" ||
    campaign.status === "stopping"
  ) {
    return redirect("/app/campaigns");
  }

  await enqueueCampaignPriceJobs(
    campaign,
    "stop"
  );

  await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: "stopping",
    },
  });

  await processPriceJobs(admin);

  return redirect("/app/campaigns");
};
