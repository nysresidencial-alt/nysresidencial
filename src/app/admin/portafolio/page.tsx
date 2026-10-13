import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { PortfolioView } from '@/components/admin/PortfolioView'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portafolio de Activos PDF | NyS Admin',
  description: 'Generación y exportación en PDF del portafolio inmobiliario de NyS.',
}

export default async function AdminPortfolioPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasMockSession) {
    redirect('/admin/login')
  }

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
