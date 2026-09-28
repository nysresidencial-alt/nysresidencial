import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Buscando propiedad unificada "Oficinas Galería Manquehue"...')
  
  const toDelete = await prisma.property.deleteMany({
    where: {
      title: { contains: 'Galería Manquehue' }
    }
  })
  
  console.log(`Se eliminaron ${toDelete.count} propiedades antiguas relacionadas con Galería Manquehue.`)

  const properties = [
    { title: 'Oficina 2 Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 750000, builtArea: 95, city: 'Talca', sector: 'Centro', description: 'Oficina 2 en Galería Manquehue, 95 m².', publishedState: 'Publicado' },
    { title: 'Oficina 3 Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 450000, builtArea: 52, city: 'Talca', sector: 'Centro', description: 'Oficina 3 en Galería Manquehue, 52 m².', publishedState: 'Publicado' },
    { title: 'Oficina 5 Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 360000, builtArea: 38, city: 'Talca', sector: 'Centro', description: 'Oficina 5 en Galería Manquehue, 38 m².', publishedState: 'Publicado' },
    { title: 'Oficina 6 Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 380000, builtArea: 41, city: 'Talca', sector: 'Centro', description: 'Oficina 6 en Galería Manquehue, 41 m².', publishedState: 'Publicado' },
    { title: 'Oficina 8 Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 370000, builtArea: 41, city: 'Talca', sector: 'Centro', description: 'Oficina 8 en Galería Manquehue, 41 m².', publishedState: 'Publicado' },
    { title: 'Bodega 1 Galería Manquehue', propertyType: 'Comercial', operation: 'Arriendo', currency: 'CLP', price: 420000, builtArea: 105, city: 'Talca', sector: 'Centro', description: 'Bodega 1 en Galería Manquehue, 105 m².', publishedState: 'Publicado' },
    { title: 'Bodega 2 Galería Manquehue', propertyType: 'Comercial', operation: 'Arriendo', currency: 'CLP', price: 420000, builtArea: 103, city: 'Talca', sector: 'Centro', description: 'Bodega 2 en Galería Manquehue, 103 m².', publishedState: 'Publicado' },
  ]

  let successCount = 0;
  for (const p of properties) {
    try {
      await prisma.property.create({ data: p })
      successCount++;
    } catch (e) {
      console.error(`Error al insertar propiedad: ${p.title}`, e)
    }
  }

  console.log(`✅ ¡Se han insertado exitosamente ${successCount} oficinas y bodegas de Galería Manquehue!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
