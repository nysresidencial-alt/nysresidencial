// Prisma singleton to avoid multiple instances during hot reload
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

let prisma: PrismaClient
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter })
} else {
  // @ts-ignore - globalThis may not have prisma property
  if (!(globalThis as any).prisma) {
    ;(globalThis as any).prisma = new PrismaClient({ adapter })
  }
  prisma = (globalThis as any).prisma
}

console.log('✅ Prisma client initialized')

export default prisma
