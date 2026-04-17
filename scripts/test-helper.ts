import { db } from '../src/lib/db/client';

async function main() {
  const products = await db.product.findMany({
    take: 5,
    select: { id: true, name: true, slug: true }
  });
  console.log('PRODUCTS:', JSON.stringify(products));
}

main().catch(console.error).finally(() => db.$disconnect());
