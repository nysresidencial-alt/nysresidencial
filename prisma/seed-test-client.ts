import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if test client already exists
  const existing = await prisma.clientUser.findFirst({
    where: { OR: [{ username: 'test' }, { email: 'test@nys.cl' }, { rut: '12345678-9' }] },
  });
  if (existing) {
    console.log('Test client already exists, skipping creation.');
    return;
  }

  const client = await prisma.clientUser.create({
    data: {
      name: 'Cliente Demo',
      rut: '12345678-9',
      email: 'test@nys.cl',
      username: 'test',
      password: 'test', // plaintext for demo purposes
      phone: '+56 9 9999 9999',
      notes: 'Usuario de prueba para la oficina virtual',
      isActive: true,
    },
    include: { documents: true },
  });

  console.log('Created test client with id:', client.id);

  // Optional: add a couple of demo documents (external links)
  await prisma.clientDocument.createMany({
    data: [
      {
        clientId: client.id,
        title: 'Contrato de Arriendo Demo',
        category: 'Contrato',
        fileUrl: 'https://example.com/contrato-demo.pdf',
        fileSize: '200 KB',
        fileType: 'PDF',
        isExternal: true,
        notes: 'Enlace de ejemplo',
      },
      {
        clientId: client.id,
        title: 'Certificado de Dominio',
        category: 'Certificado',
        fileUrl: 'https://example.com/certificado-demo.pdf',
        fileSize: '150 KB',
        fileType: 'PDF',
        isExternal: true,
        notes: 'Otro enlace de ejemplo',
      },
    ],
  });

  console.log('Added demo documents for test client.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
