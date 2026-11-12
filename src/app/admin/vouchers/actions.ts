'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { numberToWordsCLP } from '@/lib/number-to-words'

async function checkAuth(action: 'view' | 'create' | 'edit' | 'delete') {
  const session = await requireAdminAuth('vouchers', action)
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    throw new Error('Acceso no autorizado: Módulo exclusivo para el rol de Contabilidad')
  }
  return session
}

/**
 * Actualiza los datos de un Voucher específico (monto, fecha pago, estado, comentarios, recibo, factura)
 */
export async function updateVoucher(
  voucherId: string,
  data: {
    receiptNumber?: string
    invoiceNumber?: string
    baseRent?: number
    adjustmentPercent?: number
    adjustmentAmount?: number
    totalRent?: number
    guaranteeAmount?: number
    paymentStatus?: string
    paymentDate?: string
    transferAmount?: number
    cashAmount?: number
    depositAmount?: number
    accountsReceivable?: number
    collectedAmount?: number
    pendingBalance?: number
    bank?: string
    comment?: string
    paymentMethod?: string
  }
) {
  await checkAuth('edit')

  const existing = await prisma.leaseVoucher.findUnique({
    where: { id: voucherId },
  })

  if (!existing) {
    return { error: 'Voucher no encontrado' }
  }

  const baseRent = data.baseRent !== undefined ? Number(data.baseRent) : existing.baseRent
  const adjustmentAmount = data.adjustmentAmount !== undefined ? Number(data.adjustmentAmount) : existing.adjustmentAmount
  const totalRent = data.totalRent !== undefined ? Number(data.totalRent) : (baseRent + adjustmentAmount)
  const guarantee = data.guaranteeAmount !== undefined ? Number(data.guaranteeAmount) : (existing.guaranteeAmount || 0)
  const totalMonth = totalRent + guarantee

  const transfer = data.transferAmount !== undefined ? Number(data.transferAmount) : existing.transferAmount
  const cash = data.cashAmount !== undefined ? Number(data.cashAmount) : existing.cashAmount
  const deposit = data.depositAmount !== undefined ? Number(data.depositAmount) : existing.depositAmount
  const collected = data.collectedAmount !== undefined ? Number(data.collectedAmount) : (transfer + cash + deposit)
  const pending = data.pendingBalance !== undefined ? Number(data.pendingBalance) : (totalMonth - collected)

  const amountInWords = numberToWordsCLP(totalMonth)

  try {
    const updated = await prisma.leaseVoucher.update({
      where: { id: voucherId },
      data: {
        receiptNumber: data.receiptNumber !== undefined ? data.receiptNumber.trim() : existing.receiptNumber,
        invoiceNumber: data.invoiceNumber !== undefined ? data.invoiceNumber.trim() : existing.invoiceNumber,
        baseRent,
        adjustmentPercent: data.adjustmentPercent !== undefined ? Number(data.adjustmentPercent) : existing.adjustmentPercent,
        adjustmentAmount,
        totalRent,
        guaranteeAmount: guarantee > 0 ? guarantee : null,
        totalMonth,
        amountInWords,
        paymentStatus: data.paymentStatus || (pending === 0 && collected > 0 ? 'Pagado' : 'Pendiente'),
        paymentDate: data.paymentDate !== undefined ? data.paymentDate : existing.paymentDate,
        transferAmount: transfer,
        cashAmount: cash,
        depositAmount: deposit,
        collectedAmount: collected,
        pendingBalance: pending,
        accountsReceivable: data.accountsReceivable !== undefined ? Number(data.accountsReceivable) : existing.accountsReceivable,
        bank: data.bank !== undefined ? data.bank.trim() : existing.bank,
        comment: data.comment !== undefined ? data.comment.trim() : existing.comment,
        paymentMethod: data.paymentMethod || (cash > 0 ? 'Efectivo' : 'Transferencia'),
      },
    })

    revalidatePath('/admin/vouchers')
    return { success: true, voucher: updated }
  } catch (e: any) {
    console.error('Error updating voucher:', e)
    return { error: e.message || 'Error al actualizar el voucher' }
  }
}

/**
 * Actualiza los datos maestros de un Contrato y Arrendatario (valores, fechas, contacto, aval, unidad)
 */
export async function updateContract(
  contractId: string,
  data: {
    tenantName: string
    tenantRut?: string
    tenantPhone?: string
    tenantEmail?: string
    building?: string
    unitNumber?: string
    propertyType?: string
    rol?: string
    address?: string
    storageNumber?: string
    parkingNumber?: string
    contractDate?: string
    renewalPeriod?: string
    status?: string
    baseRent?: number
    adjustmentPercentage?: number
    adjustmentAmount?: number
    totalRent?: number
    guarantorRelation?: string
    guarantorPhone?: string
    guarantorEmail?: string
    newAssignee?: string
    companyId?: string
  }
) {
  await checkAuth('edit')

  try {
    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        tenantName: data.tenantName.trim(),
        tenantRut: data.tenantRut ? data.tenantRut.trim() : null,
        tenantPhone: data.tenantPhone ? data.tenantPhone.trim() : null,
        tenantEmail: data.tenantEmail ? data.tenantEmail.trim().toLowerCase() : null,
        building: data.building ? data.building.trim().toUpperCase() : undefined,
        unitNumber: data.unitNumber ? data.unitNumber.trim() : undefined,
        propertyType: data.propertyType || 'Departamento',
        rol: data.rol ? data.rol.trim() : null,
        address: data.address ? data.address.trim() : null,
        storageNumber: data.storageNumber ? data.storageNumber.trim() : null,
        parkingNumber: data.parkingNumber ? data.parkingNumber.trim() : null,
        contractDate: data.contractDate ? data.contractDate.trim() : null,
        renewalPeriod: data.renewalPeriod ? data.renewalPeriod.trim() : null,
        status: data.status || 'Ocupado',
        baseRent: data.baseRent !== undefined ? Number(data.baseRent) : undefined,
        adjustmentPercentage: data.adjustmentPercentage !== undefined ? Number(data.adjustmentPercentage) : undefined,
        adjustmentAmount: data.adjustmentAmount !== undefined ? Number(data.adjustmentAmount) : undefined,
        totalRent: data.totalRent !== undefined ? Number(data.totalRent) : undefined,
        guarantorRelation: data.guarantorRelation ? data.guarantorRelation.trim() : null,
        guarantorPhone: data.guarantorPhone ? data.guarantorPhone.trim() : null,
        guarantorEmail: data.guarantorEmail ? data.guarantorEmail.trim().toLowerCase() : null,
        newAssignee: data.newAssignee ? data.newAssignee.trim() : null,
        companyId: data.companyId || null,
      },
    })

    revalidatePath('/admin/vouchers')
    return { success: true, contract: updated }
  } catch (e: any) {
    console.error('Error updating rental contract:', e)
    return { error: e.message || 'Error al actualizar el contrato' }
  }
}

/**
 * Genera automáticamente en lote los vouchers de un mes para todos los contratos activos
 */
export async function generateMonthVouchers(month: string, year: number) {
  await checkAuth('create')

  const upperMonth = month.trim().toUpperCase()

  try {
    // 1. Obtener todos los contratos con estado Ocupado
    const contracts = await prisma.rentalContract.findMany({
      where: {
        status: { in: ['Ocupado', 'EN RETIRO'] },
      },
      include: { company: true },
    })

    let createdCount = 0
    let skippedCount = 0

    for (const contract of contracts) {
      // Verificar si ya existe voucher para este contrato y mes
      const exists = await prisma.leaseVoucher.findFirst({
        where: {
          contractId: contract.id,
          month: upperMonth,
          year,
        },
      })

      if (exists) {
        skippedCount++
        continue
      }

      const rentAmount = contract.totalRent || contract.baseRent
      const amountInWords = numberToWordsCLP(rentAmount)

      await prisma.leaseVoucher.create({
        data: {
          contractId: contract.id,
          companyId: contract.companyId,
          month: upperMonth,
          year,
          baseRent: contract.baseRent,
          adjustmentPercent: contract.adjustmentPercentage,
          adjustmentAmount: contract.adjustmentAmount,
          totalRent: rentAmount,
          totalMonth: rentAmount,
          amountInWords,
          paymentStatus: 'Pendiente',
          pendingBalance: rentAmount,
          paymentMethod: 'Transferencia',
        },
      })
      createdCount++
    }

    revalidatePath('/admin/vouchers')
    return { success: true, createdCount, skippedCount }
  } catch (e: any) {
    console.error('Error batch generating vouchers:', e)
    return { error: e.message || 'Error al generar los vouchers del mes' }
  }
}

/**
 * Elimina un voucher
 */
export async function deleteVoucher(voucherId: string) {
  await checkAuth('delete')

  try {
    await prisma.leaseVoucher.delete({
      where: { id: voucherId },
    })
    revalidatePath('/admin/vouchers')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Error al eliminar el voucher' }
  }
}
