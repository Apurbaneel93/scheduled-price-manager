import prisma from "../db.server";
import {
  authorizeCronRequest,
  getOfflineAdminClient,
} from "../utils/shopify-admin.server";
import {
  enqueueCampaignPriceJobs,
  processPriceJobs,
} from "../utils/price-jobs.server";

export const loader = async ({ request }) => {
  authorizeCronRequest(request);

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

  let started = 0;
  let stopped = 0;
  let jobsQueued = 0;

  for (const campaign of campaignsToStart) {
    try {
      console.log(
        "AUTO START:",
        campaign.name
      );

      jobsQueued += await enqueueCampaignPriceJobs(
        campaign,
        "start"
      );

      await prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: "starting",
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

      jobsQueued += await enqueueCampaignPriceJobs(
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

      stopped++;
    } catch (error) {
      console.error(
        "STOP ERROR",
        error
      );
    }
  }

  const pendingJobs =
    await prisma.campaignPriceJob.count({
      where: {
        status: {
          in: ["pending", "processing"],
        },
      },
    });

  const admin =
    jobsQueued > 0 || pendingJobs > 0
      ? await getOfflineAdminClient()
      : null;

  const jobResult = admin
    ? await processPriceJobs(
        admin,
        new URL(request.url).searchParams.get(
          "batchSize"
        )
      )
    : {
        picked: 0,
        completed: 0,
        failed: 0,
        remaining: pendingJobs,
        batchSize: 0,
      };

  return Response.json({
    success: true,
    started,
    stopped,
    jobsQueued,
    jobsProcessed: jobResult.picked,
    jobsCompleted: jobResult.completed,
    jobsFailed: jobResult.failed,
    jobsRemaining: jobResult.remaining,
    batchSize: jobResult.batchSize,
    dueToStart: campaignsToStart.length,
    dueToStop: campaignsToStop.length,
    checkedAt: now,
  });
};
