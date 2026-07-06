import prisma from "../db.server";

export const loader = async () => {
  const session = await prisma.session.findFirst({
    where: {
      id: {
        startsWith: "offline_",
      },
    },
  });

  return Response.json({
    found: !!session,
    shop: session?.shop,
    id: session?.id,
  });
};