import React from 'react'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { CorreosManager, TenantContractItem } from '@/components/admin/CorreosManager'

export const dynamic = 'force-dynamic'

export default async function AdminCorreosPage() {
  const session = await requireAdminAuth('vouchers', 'view')
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')

  if (!session.isSuperadmin && !isContabilidad) {
    redirect('/admin')
  }

  // Obtener contratos activos y sus empresas
  const contracts = await prisma.rentalContract.findMany({
    include: {
      company: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: [
      { building: 'asc' },
      { unitNumber: 'asc' },
      { tenantName: 'asc' },
    ],
  })

  const formattedContracts: TenantContractItem[] = contracts.map((c) => ({
    id: c.id,
    building: c.building,
    unitNumber: c.unitNumber,
    propertyType: c.propertyType,
    status: c.status,
    tenantName: c.tenantName,
    tenantRut: c.tenantRut,
    tenantPhone: c.tenantPhone,
    tenantEmail: c.tenantEmail,
    company: c.company,
  }))

  return <CorreosManager initialContracts={formattedContracts} />
}
