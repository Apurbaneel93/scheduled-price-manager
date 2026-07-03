// import prisma from "../db.server";

// export const loader = async () => {
//   const now = new Date();

//   const campaignsToStart =
//     await prisma.campaign.findMany({
//       where: {
//         status: "scheduled",
//         startDate: {
//           lte: now,
//         },
//       },
//       include: {
//         products: true,
//       },
//     });

//   const campaignsToStop =
//     await prisma.campaign.findMany({
//       where: {
//         status: "active",
//         endDate: {
//           lte: now,
//         },
//       },
//       include: {
//         products: true,
//       },
//     });

//   let started = 0;
//   let stopped = 0;

//   // TEMPORARY
//   // Status update only
//   for (const campaign of campaignsToStart) {
//     console.log(
//       "START CAMPAIGN:",
//       campaign.name
//     );

//     await prisma.campaign.update({
//       where: {
//         id: campaign.id,
//       },
//       data: {
//         status: "active",
//       },
//     });

//     started++;
//   }

//   for (const campaign of campaignsToStop) {
//     console.log(
//       "STOP CAMPAIGN:",
//       campaign.name
//     );

//     await prisma.campaign.update({
//       where: {
//         id: campaign.id,
//       },
//       data: {
//         status: "completed",
//       },
//     });

//     stopped++;
//   }

//   return Response.json({
//     success: true,
//     started,
//     stopped,
//     checkedAt: now,
//   });
// };

import prisma from "../db.server";

import {
  runCampaign,
  stopCampaign,
} from "../utils/campaign.server";

import {
  getAdminClient,
} from "../utils/shopify-admin.server";

export const loader = async () => {
  const now = new Date();

  const admin =
    await getAdminClient();

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
    checkedAt: now,
  });
};