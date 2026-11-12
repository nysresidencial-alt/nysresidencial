import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { VouchersManager } from '@/components/admin/VouchersManager'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vouchers y Liquidaciones de Arriendo | NyS Admin',
  description: 'Gestión de cobros de arriendos, recibos mensuales y recaudación inmobiliaria.',
}

export default async function VouchersAdminPage() {
  const session = await requireAdminAuth('vouchers', 'view')

  // 1. Obtener todas las empresas propietarias
  const companies = await prisma.ownerCompany.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  // 2. Obtener lista de edificios únicos
  const contracts = await prisma.rentalContract.findMany({
    select: { building: true },
    distinct: ['building'],
    orderBy: { building: 'asc' },
  })
  const buildings = contracts.map((c) => c.building).filter(Boolean)

  // 3. Obtener vouchers del año activo (2026) con su contrato y empresa
  const vouchers = await prisma.leaseVoucher.findMany({
    where: {
      year: 2026,
    },
    include: {
      contract: {
        select: {
          id: true,
          building: true,
          unitNumber: true,
          propertyType: true,
          rol: true,
          address: true,
          storageNumber: true,
          parkingNumber: true,
          tenantName: true,
          tenantRut: true,
          tenantPhone: true,
          tenantEmail: true,
          guarantorRelation: true,
          guarantorPhone: true,
          guarantorEmail: true,
          company: {
            select: {
              id: true,
              code: true,
              name: true,
              rut: true,
              landlordName: true,
              address: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      company: {
        select: {
          id: true,
          code: true,
          name: true,
          rut: true,
          landlordName: true,
          address: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: [
      { receiptNumber: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // Formatear datos serializables para el cliente
  const formattedVouchers = vouchers.map((v) => ({
    id: v.id,
    month: v.month,
    year: v.year,
    receiptNumber: v.receiptNumber,
    invoiceNumber: v.invoiceNumber,
    baseRent: v.baseRent,
    adjustmentPercent: v.adjustmentPercent,
    adjustmentAmount: v.adjustmentAmount,
    totalRent: v.totalRent,
    guaranteeAmount: v.guaranteeAmount,
    totalMonth: v.totalMonth,
    amountInWords: v.amountInWords,
    paymentStatus: v.paymentStatus,
    paymentDate: v.paymentDate,
    transferAmount: v.transferAmount,
    cashAmount: v.cashAmount,
    depositAmount: v.depositAmount,
    accountsReceivable: v.accountsReceivable,
    bank: v.bank,
    collectedAmount: v.collectedAmount,
    pendingBalance: v.pendingBalance,
    comment: v.comment,
    paymentMethod: v.paymentMethod,
    contract: {
      id: v.contract.id,
      building: v.contract.building,
      unitNumber: v.contract.unitNumber,
      propertyType: v.contract.propertyType,
      rol: v.contract.rol,
      address: v.contract.address,
      storageNumber: v.contract.storageNumber,
      parkingNumber: v.contract.parkingNumber,
      tenantName: v.contract.tenantName,
      tenantRut: v.contract.tenantRut,
      tenantPhone: v.contract.tenantPhone,
      tenantEmail: v.contract.tenantEmail,
      guarantorRelation: v.contract.guarantorRelation,
      guarantorPhone: v.contract.guarantorPhone,
      guarantorEmail: v.contract.guarantorEmail,
      company: v.contract.company || null,
    },
    company: v.company || v.contract.company || null,
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <VouchersManager
        initialVouchers={formattedVouchers}
        companies={companies}
        buildings={buildings}
        currentRole={session.roleName}
        isSuperadmin={session.isSuperadmin}
      />
    </div>
  )
}
