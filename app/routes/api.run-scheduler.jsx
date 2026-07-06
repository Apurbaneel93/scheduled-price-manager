import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import {
  runCampaign,
  stopCampaign,
} from "../utils/campaign.server";

async function getAdminClient() {
  const session = await prisma.session.findFirst({
    where: {
      id: {
        startsWith: "offline_",
      },
    },
    orderBy: {
      expires: "desc",
    },
  });

  if (!session?.shop) {
    throw new Response("Offline Shopify session not found", {
      status: 500,
    });
  }

  const { admin } = await unauthenticated.admin(
    session.shop
  );

  return admin;
}

export const loader = async () => {
  const now = new Date();

  const campaignsToStart =
    await prisma.campaign.findMany({
      where: {
        status: "scheduled",
        startDate: {
          lte: now,
        },
      },
      include: {
        products: true,
      },
    });

  const campaignsToStop =
    await prisma.campaign.findMany({
      where: {
        status: "active",
        endDate: {
          lte: now,
        },
      },
      include: {
        products: true,
      },
    });

  const admin =
    campaignsToStart.length ||
    campaignsToStop.length
      ? await getAdminClient()
      : null;

  let started = 0;
  let stopped = 0;

  for (const campaign of campaignsToStart) {
    try {
      console.log(
        "AUTO START:",
        campaign.name
      );

      await runCampaign(
        admin,
        campaign
      );

      await prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: "active",
        },
      });

      started++;
    } catch (error) {
      console.error(
        "START ERROR",
        error
      );
    }
  }

  for (const campaign of campaignsToStop) {
    try {
      console.log(
        "AUTO STOP:",
        campaign.name
      );

      await stopCampaign(
        admin,
        campaign
      );

      await prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: "completed",
        },
      });

      stopped++;
    } catch (error) {
      console.error(
        "STOP ERROR",
        error
      );
    }
  }

  return Response.json({
    success: true,
    started,
    stopped,
    dueToStart: campaignsToStart.length,
    dueToStop: campaignsToStop.length,
    checkedAt: now,
  });
};
