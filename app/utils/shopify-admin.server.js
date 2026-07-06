import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";

export async function getOfflineAdminClient() {
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

export function authorizeCronRequest(request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return;
  }

  const url = new URL(request.url);
  const providedSecret =
    request.headers.get("x-cron-secret") ||
    url.searchParams.get("secret");

  if (providedSecret !== cronSecret) {
    throw new Response("Unauthorized", {
      status: 401,
    });
  }
}
