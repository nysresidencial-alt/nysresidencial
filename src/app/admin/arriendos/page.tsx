import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { ArriendosManager } from '@/components/admin/ArriendosManager'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maestro de Arriendos e Inmuebles | NyS Admin',
  description: 'Gestión integral de propiedades en arriendo, contratos, datos de arrendatarios y reajustes.',
}

export default async function ArriendosAdminPage() {
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

  // 2. Obtener lista de edificios únicos
  const buildingRecords = await prisma.rentalContract.findMany({
    select: { building: true },
    distinct: ['building'],
    orderBy: { building: 'asc' },
  })
  const buildings = buildingRecords.map((b) => b.building).filter(Boolean)

  // 3. Obtener todos los contratos con su empresa y última liquidación/voucher
  const contracts = await prisma.rentalContract.findMany({
    include: {
      company: {
        select: { id: true, code: true, name: true },
      },
      vouchers: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
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

  // Formatear datos serializables para el cliente
  const formattedContracts = contracts.map((c) => ({
    id: c.id,
    companyId: c.companyId,
    newAssignee: c.newAssignee,
    building: c.building,
    unitNumber: c.unitNumber,
    propertyType: c.propertyType,
    rol: c.rol,
    address: c.address,
    storageNumber: c.storageNumber,
    parkingNumber: c.parkingNumber,
    contractDate: c.contractDate,
    renewalPeriod: c.renewalPeriod,
    status: c.status,
    tenantName: c.tenantName,
    tenantRut: c.tenantRut,
    tenantPhone: c.tenantPhone,
    tenantEmail: c.tenantEmail,
    otherContactInfo: c.otherContactInfo,
    guarantorRelation: c.guarantorRelation,
    guarantorPhone: c.guarantorPhone,
    guarantorEmail: c.guarantorEmail,
    baseRent: c.baseRent,
    adjustmentPercentage: c.adjustmentPercentage,
    adjustmentAmount: c.adjustmentAmount,
    totalRent: c.totalRent,
    guaranteeAmount: c.guaranteeAmount,
    expensesCharge: c.expensesCharge,
    expensesPayment: c.expensesPayment,
    previousRent: c.previousRent,
    company: c.company,
    latestVoucher: c.vouchers[0] || null,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <ArriendosManager
        initialContracts={formattedContracts}
        companies={companies}
        buildings={buildings}
        isSuperadmin={session.isSuperadmin}
      />
    </div>
  )
}
