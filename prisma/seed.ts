import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import path from 'path'
import { loadEnvConfig } from '@next/env'

// Load .env.local
loadEnvConfig(path.resolve(__dirname, '..'))

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  // Create admin user — password must be changed on first login
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  await db.user.upsert({
    where: { email: 'admin@store.com' },
    update: {},
    create: {
      email: 'admin@store.com',
      name: 'Store Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  })

  // Create test user for automated testing
  const testPassword = await bcrypt.hash('Test@123456', 12)
  await db.user.upsert({
    where: { email: 'testuser@example.com' },
    update: { isVerified: true, passwordHash: testPassword },
    create: {
      email: 'testuser@example.com',
      name: 'Test User',
      passwordHash: testPassword,
      role: 'CUSTOMER',
      isVerified: true,
    },
  })

  // Root categories — customers browse by these
  const rootCategories = [
    { name: 'Clothes', slug: 'clothes' },
    { name: 'Shoes', slug: 'shoes' },
    { name: 'Apparel', slug: 'apparel' },
    { name: 'Accessories', slug: 'accessories' },
  ]

  for (const category of rootCategories) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  // Seed at least one product for tests
  await db.product.upsert({
    where: { slug: 'test-product-1' },
    update: {},
    create: {
      name: 'Test Product 1',
      slug: 'test-product-1',
      description: 'A product for automated testing.',
      basePrice: 100,
      sku: 'TEST-PROD-001',
      categoryId: (await db.category.findFirst())?.id || '',
      isActive: true,
      variants: {
        create: [
          { size: 'M', color: 'Black', stock: 50, sku: 'TEST-PROD-001-M-BLK' },
        ]
      }
    }
  })

  console.log('Seed complete — admin@store.com & testuser@example.com created, 4 categories & 1 product seeded')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
