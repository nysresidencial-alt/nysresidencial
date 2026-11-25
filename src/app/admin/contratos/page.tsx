import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { ContratosRenovacionesManager } from '@/components/admin/ContratosRenovacionesManager'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Control de Contratos y Renovaciones | NyS Admin',
  description: 'Seguimiento preventivo de vigencias, vencimientos y actualización de contratos ocupados.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ContratosAdminPage() {
  const session = await requireAdminAuth('vouchers', 'view')

  // Restricción: exclusivo rol Contabilidad o Superadmin
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    redirect('/admin')
  }

  // 1. Obtener empresas propietarias
  const companies = await prisma.ownerCompany.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  // 2. Obtener lista de edificios únicos (solo de contratos con propietarios activos)
  const buildingRecords = await prisma.rentalContract.findMany({
    where: { isOwnerActive: true },
    select: { building: true },
    distinct: ['building'],
    orderBy: { building: 'asc' },
  })
  const buildings = buildingRecords.map((b) => b.building).filter(Boolean)

  // 3. Obtener solo contratos con status: 'Ocupado' (los disponibles y vendidos no tienen arriendo vigente)
  const contracts = await prisma.rentalContract.findMany({
    where: {
      status: 'Ocupado',
      isOwnerActive: true,
    },
    include: {
      company: {
        select: { id: true, code: true, name: true },
      },
      vouchers: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          receiptNumber: true,
          invoiceNumber: true,
          totalMonth: true,
          pendingBalance: true,
          paymentStatus: true,
          month: true,
          year: true,
          paymentDate: true,
        },
      },
    },
    orderBy: [
      { building: 'asc' },
      { unitNumber: 'asc' },
    ],
  })

  // Mapear latestVoucher para compatibilidad
  const formattedContracts = contracts.map((c) => ({
    ...c,
    latestVoucher: c.vouchers[0] || null,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ContratosRenovacionesManager
        initialContracts={formattedContracts as any}
        companies={companies}
        buildings={buildings}
        isSuperadmin={session.isSuperadmin}
      />
    </div>
  )
}
