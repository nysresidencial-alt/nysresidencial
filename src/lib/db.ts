// Prisma singleton to avoid multiple instances during hot reload and in serverless lambdas
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: Pool
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
    max: 2, // Límite estricto de conexiones para serverless lambdas
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

globalForPrisma.pgPool = pool

const adapter = new PrismaPg(pool)

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

globalForPrisma.prisma = prisma

export default prisma
