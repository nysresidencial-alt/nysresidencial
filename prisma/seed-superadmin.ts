import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hashPassword } from '../src/lib/password'
import { DEFAULT_ROLES } from '../src/lib/permissions-config'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Inicializando roles y usuario Superadmin...')

  // 1. Crear o actualizar los roles por defecto
  const roleMap: Record<string, string> = {}

  for (const roleDef of DEFAULT_ROLES) {
    const role = await prisma.adminRole.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        permissions: roleDef.permissions as any,
      },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
        permissions: roleDef.permissions as any,
      },
    })
    roleMap[roleDef.name] = role.id
    console.log(`✅ Rol asegurado: ${role.name} (${role.id})`)
  }

  // 2. Crear o actualizar Superadmin (informatica@nys.cl)
  const superadminEmail = 'informatica@nys.cl'
  const superadminPassword = 'Daewoodamas7110#'
  const superadminPasswordHash = hashPassword(superadminPassword)

  const superadminUser = await prisma.adminUser.upsert({
    where: { email: superadminEmail },
    update: {
      name: 'Superadministrador NYS',
      passwordHash: superadminPasswordHash,
      roleId: roleMap['Superadmin'],
      isActive: true,
    },
    create: {
      email: superadminEmail,
      name: 'Superadministrador NYS',
      passwordHash: superadminPasswordHash,
      roleId: roleMap['Superadmin'],
      isActive: true,
    },
  })

  console.log(`👑 Superadmin configurado con éxito: ${superadminUser.email}`)
}

main()
  .catch((e) => {
    console.error('Error seeding roles & superadmin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
