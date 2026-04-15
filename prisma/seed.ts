import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

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

  console.log('Seed complete — admin@store.com created, 4 categories seeded')
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
