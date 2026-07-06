import prisma from "../db.server";
import {
  getStartPriceUpdate,
  getStopPriceUpdate,
  updateVariantPrice,
} from "./campaign.server";

const DEFAULT_BATCH_SIZE = 40;
const MAX_ATTEMPTS = 3;

function getBatchSize(value) {
  const batchSize = Number(value);

  if (!Number.isFinite(batchSize)) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(
    Math.max(Math.floor(batchSize), 1),
    100
  );
}

function buildJobData(campaign, product, action) {
  const update =
    action === "start"
      ? getStartPriceUpdate(campaign, product)
      : getStopPriceUpdate(product);

  return {
    campaignId: campaign.id,
    campaignProductId: product.id,
    action,
    productId: update.productId,
    productTitle: update.productTitle,
    variantId: update.variantId,
    price: update.price,
    compareAtPrice: update.compareAtPrice,
    status: "pending",
  };
}

export async function enqueueCampaignPriceJobs(
  campaign,
  action
) {
  const jobs = campaign.products.map((product) =>
    buildJobData(campaign, product, action)
  );

  if (!jobs.length) {
    return 0;
  }

  const result =
    await prisma.campaignPriceJob.createMany({
      data: jobs,
      skipDuplicates: true,
    });

  return result.count;
}

async function updateCampaignStatus(campaignId, action) {
  const pending = await prisma.campaignPriceJob.count({
    where: {
      campaignId,
      action,
      status: {
        in: ["pending", "processing"],
      },
    },
  });

  if (pending > 0) {
    return;
  }

  const failed = await prisma.campaignPriceJob.count({
    where: {
      campaignId,
      action,
      status: "failed",
    },
  });

  await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      status:
        failed > 0
          ? action === "start"
            ? "start_failed"
            : "stop_failed"
          : action === "start"
            ? "active"
            : "completed",
    },
  });
}

export async function processPriceJobs(
  admin,
  batchSizeValue
) {
  const batchSize = getBatchSize(batchSizeValue);

  const jobs = await prisma.campaignPriceJob.findMany({
    where: {
      status: {
        in: ["pending", "failed"],
      },
      attempts: {
        lt: MAX_ATTEMPTS,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: batchSize,
  });

  let completed = 0;
  let failed = 0;

  for (const job of jobs) {
    await prisma.campaignPriceJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: "processing",
        lockedAt: new Date(),
        attempts: {
          increment: 1,
        },
        error: null,
      },
    });

    try {
      await updateVariantPrice(
        admin,
        {
          productId: job.productId,
          productTitle: job.productTitle,
          variantId: job.variantId,
          price: job.price,
          compareAtPrice: job.compareAtPrice,
        },
        job.action === "start" ? "RUN" : "STOP"
      );

      await prisma.campaignPriceJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "completed",
          completedAt: new Date(),
          error: null,
        },
      });

      completed++;
    } catch (error) {
      const nextAttempts = job.attempts + 1;
      const isFinalFailure =
        nextAttempts >= MAX_ATTEMPTS;

      await prisma.campaignPriceJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: isFinalFailure
            ? "failed"
            : "pending",
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      });

      failed++;
    }
  }

  const affectedCampaigns = Array.from(
    new Set(
      jobs.map(
        (job) => `${job.campaignId}:${job.action}`
      )
    )
  );

  for (const campaignAction of affectedCampaigns) {
    const [campaignId, action] =
      campaignAction.split(":");

    await updateCampaignStatus(campaignId, action);
  }

  const remaining = await prisma.campaignPriceJob.count({
    where: {
      status: {
        in: ["pending", "processing"],
      },
    },
  });

  return {
    picked: jobs.length,
    completed,
    failed,
    remaining,
    batchSize,
  };
}
