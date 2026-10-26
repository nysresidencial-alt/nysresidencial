import prisma from '@/lib/db'
import { getClientSession } from '@/lib/client-auth'
import { redirect } from 'next/navigation'
import { ClientPortalDashboard } from '@/components/client-portal/ClientPortalDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Oficina Virtual de Clientes | NyS Residencial',
  description: 'Portal privado para clientes de NyS Inmobiliaria. Consulta contratos, escrituras y documentos de tus propiedades.',
}

export default async function ClientPortalPage() {
  const session = await getClientSession()

  if (!session) {
    redirect('/oficina-virtual/login')
  }

  const client = await prisma.clientUser.findUnique({
    where: { id: session.id },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!client || !client.isActive) {
    redirect('/oficina-virtual/login')
  }

  return <ClientPortalDashboard client={client} />
}
