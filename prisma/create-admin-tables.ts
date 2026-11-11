import { Pool } from 'pg'
import 'dotenv/config'

async function createTables() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  console.log('Connecting to database to ensure AdminRole and AdminUser tables...')

  const sql = `
    -- Crear tabla AdminRole si no existe
    CREATE TABLE IF NOT EXISTS "AdminRole" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "isSystem" BOOLEAN NOT NULL DEFAULT false,
      "permissions" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Crear tabla AdminUser si no existe
    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "roleId" TEXT NOT NULL REFERENCES "AdminRole"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "customPermissions" JSONB,
      "lastLoginAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS "AdminUser_email_idx" ON "AdminUser"("email");
    CREATE INDEX IF NOT EXISTS "AdminUser_roleId_idx" ON "AdminUser"("roleId");
  `

  try {
    await pool.query(sql)
    console.log('✅ Tablas AdminRole y AdminUser creadas con éxito.')
  } catch (error) {
    console.error('Error creating tables:', error)
  } finally {
    await pool.end()
  }
}

createTables()
