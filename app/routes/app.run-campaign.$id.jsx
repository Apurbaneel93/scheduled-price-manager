import { redirect } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { runCampaign } from "../utils/campaign.server";

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

  if (campaign.status === "active") {
    return redirect("/app/campaigns");
  }

  await runCampaign(admin, campaign);

  await prisma.campaign.update({
    where: {
      id: campaign.id,
    },
    data: {
      status: "active",
    },
  });

  return redirect("/app/campaigns");
};