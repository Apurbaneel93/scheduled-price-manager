import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const campaigns = await prisma.campaign.findMany();

  console.log(campaigns);
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
