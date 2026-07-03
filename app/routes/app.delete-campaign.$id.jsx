import { redirect } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request, params }) => {
  await authenticate.admin(request);

  await prisma.campaignProduct.deleteMany({
    where: {
      campaignId: params.id,
    },
  });

  await prisma.campaign.delete({
    where: {
      id: params.id,
    },
  });

  return redirect("/app/campaigns");
};