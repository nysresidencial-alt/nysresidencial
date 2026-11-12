import prisma from '@/lib/db'
import { PortfolioView } from '@/components/admin/PortfolioView'
import { requireAdminAuth } from '@/lib/admin-auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portafolio de Activos PDF | NyS Admin',
  description: 'Generación y exportación en PDF del portafolio inmobiliario de NyS.',
}

export default async function AdminPortfolioPage() {
  await requireAdminAuth('portafolio', 'view')

  // Fetch all properties ordered by city, property type, price
  const properties = await prisma.property.findMany({
    orderBy: [
      { city: 'asc' },
      { propertyType: 'asc' },
      { price: 'desc' },
    ],
  })

  return <PortfolioView properties={properties} />
}
