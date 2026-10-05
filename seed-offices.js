const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.office.createMany({
    data: [
      {
        name: "Santiago",
        address: "El Golf 40, piso 12 Las Condes",
        email: "contacto@nys.cl",
        mapLink: "https://maps.google.com/?q=El+Golf+40,+Las+Condes,+Santiago,+Chile",
        order: 1,
        isActive: true
      },
      {
        name: "Talca",
        address: "6 Oriente 960, Edificio Manuel Solar, 4 piso",
        phone: "+56 9 9289 3145 | +56 9 7387 7812",
        mapLink: "https://maps.app.goo.gl/DKR9iCk6UeHwWcxx6",
        order: 2,
        isActive: true
      }
    ]
  });
  console.log("Offices seeded");
}

main().catch(console.error).finally(() => prisma.$disconnect());
