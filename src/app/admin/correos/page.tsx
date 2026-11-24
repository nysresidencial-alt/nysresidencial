import React from 'react'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { CorreosManager, TenantContractItem } from '@/components/admin/CorreosManager'
import { getEmailConfig } from '@/lib/email-config'

export const dynamic = 'force-dynamic'

export default async function AdminCorreosPage() {
  const session = await requireAdminAuth('vouchers', 'view')
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')

  if (!session.isSuperadmin && !isContabilidad) {
    redirect('/admin')
  }

  // Carga concurrente de contratos y configuración de plantilla/modo test
  const [contracts, initialConfig] = await Promise.all([
    prisma.rentalContract.findMany({
      where: { isOwnerActive: true },
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
    }),
    getEmailConfig(),
  ])

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

  return <CorreosManager initialContracts={formattedContracts} initialConfig={initialConfig} />
}
