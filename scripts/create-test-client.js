require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.clientUser.findFirst({
    where: { OR: [{ username: 'test' }, { email: 'test@nys.cl' }, { rut: '12345678-9' }] },
  });
  if (existing) {
    console.log('Cliente de prueba ya existe, saltando creación.');
    return;
  }

  const client = await prisma.clientUser.create({
    data: {
      name: 'Cliente Demo',
      rut: '12345678-9',
      email: 'test@nys.cl',
      username: 'test',
      password: 'test', // plaintext solo para demo
      phone: '+56 9 9999 9999',
      notes: 'Usuario de prueba para la oficina virtual',
      isActive: true,
    },
  });

  console.log('Cliente de prueba creado con id:', client.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error al crear cliente de prueba:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
