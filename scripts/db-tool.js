const { Client } = require('pg');
const connectionString = "postgresql://postgres:password@localhost:5432/ecommerce";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  const cmd = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    if (cmd === 'cleanup') {
      await client.query('DELETE FROM "User" WHERE email = $1', [arg1]);
      console.log(`Cleaned up user ${arg1}`);
    } else if (cmd === 'get-otp') {
      const res = await client.query(
        'SELECT code FROM "OtpToken" ot JOIN "User" u ON ot."userId" = u.id WHERE u.email = $1 ORDER BY ot."createdAt" DESC LIMIT 1',
        [arg1]
      );
      if (res.rows[0]) console.log(res.rows[0].code);
    } else if (cmd === 'create-delivered-order') {
      // Find user and product
      const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [arg1]);
      const prodRes = await client.query('SELECT id, "basePrice" FROM "Product" WHERE slug = $2', [null, arg2]);
      
      if (!userRes.rows[0] || !prodRes.rows[0]) {
        console.error('User or Product not found');
        return;
      }
      
      const userId = userRes.rows[0].id;
      const productId = prodRes.rows[0].id;
      const price = prodRes.rows[0].basePrice;
      
      // Create order
      const orderRes = await client.query(
        'INSERT INTO "Order" (id, "orderNumber", "userId", status, subtotal, total, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
        [Math.random().toString(36).substring(7), 'ORD-' + Date.now(), userId, 'DELIVERED', price, price]
      );
      const orderId = orderRes.rows[0].id;
      
      // Create order item
      await client.query(
        'INSERT INTO "OrderItem" (id, "orderId", "productId", quantity, price) VALUES ($1, $2, $3, 1, $4)',
        [Math.random().toString(36).substring(7), orderId, productId, price]
      );
      
      console.log(`Created DELIVERED order for ${arg1} and product ${arg2}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
