import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  const products = await prisma.campaignProduct.findMany();

  console.log(JSON.stringify(products, null, 2));
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
