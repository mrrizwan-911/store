import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import path from 'path'
import { loadEnvConfig } from '@next/env'
import bcrypt from 'bcryptjs'

loadEnvConfig(path.resolve(__dirname))
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const user = await db.user.findUnique({ where: { email: 'testuser@example.com' } })
  console.log("User:", user)
  if (user) {
    const match = await bcrypt.compare('Test@123456', user.passwordHash!)
    console.log("Password matches:", match)
  }
}
main().finally(() => db.$disconnect())
