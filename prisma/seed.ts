import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.property.deleteMany({}) // Limpiar tabla antes de seedear

  const mockProperties = [
    {
      title: "Departamento en Las Condes",
      propertyType: "Departamento",
      operation: "Venta",
      status: "Usada",
      city: "Santiago",
      sector: "El Golf",
      currency: "UF",
      price: 15000,
      beds: 4,
      baths: 4,
      builtArea: 214,
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60"],
      featured: true,
      description: "Espectacular departamento en excelente estado."
    },
    {
      title: "Departamento Parque Bicentenario",
      propertyType: "Departamento",
      operation: "Venta",
      status: "Usada",
      city: "Santiago",
      sector: "Vitacura",
      currency: "UF",
      price: 15500,
      beds: 4,
      baths: 4,
      builtArea: 178,
      images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60"],
    },
    {
      title: "Departamento Santa Lucía",
      propertyType: "Departamento",
      operation: "Venta",
      status: "Usada",
      city: "Santiago",
      sector: "Santa Lucía",
      currency: "UF",
      price: 2390,
      beds: 2,
      baths: 1,
      builtArea: 40,
      images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=60"],
    },
    {
      title: "Casa Sector Oriente",
      propertyType: "Casas",
      operation: "Venta",
      status: "Usada",
      city: "Santiago",
      sector: "La Reina",
      currency: "UF",
      price: 9600,
      beds: 3,
      baths: 2,
      builtArea: 113,
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60"],
    },
    {
      title: "Casa Centro de Talca",
      propertyType: "Casas",
      operation: "Venta",
      status: "Usada",
      city: "Talca",
      sector: "Centro",
      currency: "UF",
      price: 11600,
      beds: 4,
      baths: 4,
      builtArea: 269,
      images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60"],
    },
    {
      title: "Terreno Alto del Llano",
      propertyType: "Terrenos",
      operation: "Venta",
      status: "Nueva",
      city: "Talca",
      sector: "Alto del Llano",
      currency: "UF",
      price: 1510,
      beds: 0,
      baths: 0,
      landArea: 5000,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60"],
    },
  ]

  console.log('Seeding properties...')
  for (const prop of mockProperties) {
    const created = await prisma.property.create({
      data: prop
    })
    console.log(`Created property with id: ${created.id}`)
  }
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
