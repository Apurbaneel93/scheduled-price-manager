import prisma from "../db.server";
import { GraphqlClient, Session } from "@shopify/shopify-api";

export async function getAdminClient() {
  const offlineSession =
    await prisma.session.findFirst({
      where: {
        isOnline: false,
      },
    });

  if (!offlineSession) {
    throw new Error(
      "Offline session not found"
    );
  }

  const session = new Session({
    id: offlineSession.id,
    shop: offlineSession.shop,
    state: offlineSession.state || "offline",
    isOnline: false,
    accessToken:
      offlineSession.accessToken,
  });

  return new GraphqlClient({
    session,
  });
}