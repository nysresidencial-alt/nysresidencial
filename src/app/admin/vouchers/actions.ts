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

  const isNA = Boolean(data.paymentMethod && (data.paymentMethod === 'No Aplica' || data.paymentMethod.toLowerCase().includes('no aplica')))
  const transfer = isNA ? 0 : (data.transferAmount !== undefined ? Number(data.transferAmount) : existing.transferAmount)
  const cash = isNA ? 0 : (data.cashAmount !== undefined ? Number(data.cashAmount) : existing.cashAmount)
  const deposit = isNA ? 0 : (data.depositAmount !== undefined ? Number(data.depositAmount) : existing.depositAmount)
  const collected = data.collectedAmount !== undefined ? Number(data.collectedAmount) : (isNA ? (existing.collectedAmount || 0) : (transfer + cash + deposit))
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
        paymentMethod: data.paymentMethod !== undefined ? data.paymentMethod : (cash > 0 ? 'Efectivo' : 'Transferencia'),
      },
      include: {
        contract: {
          include: { company: true },
        },
        company: true,
      },
    })

    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/arriendos')
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
 * Obtiene el siguiente N° de Recibo correlativo para una empresa (talonario por empresa)
 */
export async function getNextReceiptNumberForCompany(companyId: string | null): Promise<string> {
  let targetCompanyIds: string[] = []

  if (companyId) {
    const comp = await prisma.ownerCompany.findUnique({ where: { id: companyId } })
    if (comp) {
      if (comp.code === 'JR' || comp.code === 'AMB') {
        const jrAmb = await prisma.ownerCompany.findMany({
          where: { code: { in: ['JR', 'AMB'] } },
          select: { id: true },
        })
        targetCompanyIds = jrAmb.map((c) => c.id)
      } else {
        targetCompanyIds = [comp.id]
      }
    }
  }

  const whereClause: any = {
    receiptNumber: { not: null },
  }
  if (targetCompanyIds.length > 0) {
    whereClause.companyId = { in: targetCompanyIds }
  }

  const vouchers = await prisma.leaseVoucher.findMany({
    where: whereClause,
    select: { receiptNumber: true },
  })

  let maxNum = 0
  for (const v of vouchers) {
    if (!v.receiptNumber) continue
    const clean = v.receiptNumber.replace(/\D/g, '')
    if (clean) {
      const n = parseInt(clean, 10)
      if (!isNaN(n) && n > maxNum) {
        maxNum = n
      }
    }
  }

  return String(maxNum + 1)
}

/**
 * Asigna el siguiente N° de Recibo correlativo a un voucher si aún no lo tiene.
 * Si ya tiene número de recibo, lo conserva intacto.
 */
export async function assignVoucherReceiptNumber(voucherId: string) {
  await checkAuth('edit')

  const existing = await prisma.leaseVoucher.findUnique({
    where: { id: voucherId },
    include: {
      contract: {
        include: { company: true },
      },
      company: true,
    },
  })

  if (!existing) {
    return { error: 'Voucher no encontrado' }
  }

  // Si ya tiene número de recibo válido, lo retornamos sin alterar
  if (existing.receiptNumber && existing.receiptNumber.trim() !== '' && existing.receiptNumber !== 'S/N') {
    return { success: true, voucher: existing, assigned: false }
  }

  const companyId = existing.companyId || existing.contract?.companyId || null
  const nextNumber = await getNextReceiptNumberForCompany(companyId)

  const updated = await prisma.leaseVoucher.update({
    where: { id: voucherId },
    data: { receiptNumber: nextNumber },
    include: {
      contract: {
        include: { company: true },
      },
      company: true,
    },
  })

  revalidatePath('/admin/vouchers')
  revalidatePath('/admin/arriendos')
  return { success: true, voucher: updated, assigned: true }
}

/**
 * Auto-asigna correlativos de N° de Recibo a todos los vouchers de un mes que aún no tienen número.
 * Mantiene orden consecutivo por empresa para garantizar trazabilidad.
 */
export async function autoAssignMissingReceipts(month?: string, year?: number) {
  await checkAuth('edit')

  try {
    const whereClause: any = {
      OR: [
        { receiptNumber: null },
        { receiptNumber: '' },
        { receiptNumber: 'S/N' },
      ],
    }

    if (month && month !== 'TODOS') {
      whereClause.month = month.trim().toUpperCase()
    }
    if (year) {
      whereClause.year = year
    }

    const vouchersToAssign = await prisma.leaseVoucher.findMany({
      where: whereClause,
      include: {
        contract: {
          include: { company: true },
        },
        company: true,
      },
      orderBy: [
        { contract: { building: 'asc' } },
        { contract: { unitNumber: 'asc' } },
      ],
    })

    if (vouchersToAssign.length === 0) {
      return { success: true, count: 0, message: 'Todos los arriendos ya tienen su N° de Recibo asignado.' }
    }

    const companyRunningNumMap = new Map<string, number>()
    let assignedCount = 0

    for (const voucher of vouchersToAssign) {
      const compId = voucher.companyId || voucher.contract?.companyId || null
      const compIdKey = compId || 'GENERAL'

      let currentNum = companyRunningNumMap.get(compIdKey)
      if (currentNum === undefined) {
        const nextStr = await getNextReceiptNumberForCompany(compId)
        currentNum = parseInt(nextStr, 10) || 1
      }

      const assignedNo = String(currentNum)
      companyRunningNumMap.set(compIdKey, currentNum + 1)

      await prisma.leaseVoucher.update({
        where: { id: voucher.id },
        data: { receiptNumber: assignedNo },
      })
      assignedCount++
    }

    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/arriendos')

    return {
      success: true,
      count: assignedCount,
      message: `Se asignaron ${assignedCount} números de recibo correlativos exitosamente.`,
    }
  } catch (error: any) {
    console.error('Error auto-asignando recibos faltantes:', error)
    return { success: false, error: error.message || 'Error al asignar números de recibo' }
  }
}

/**
 * Genera automáticamente en lote los vouchers de un mes para todos los contratos activos
 */
export async function generateMonthVouchers(month: string, year: number) {
  await checkAuth('create')

  const upperMonth = month.trim().toUpperCase()

  try {
    // 1. Obtener todos los contratos con estado Ocupado / En Retiro y de propietarios activos
    const contracts = await prisma.rentalContract.findMany({
      where: {
        isOwnerActive: true,
        status: { in: ['Ocupado', 'OCUPADO', 'ocupado', 'EN RETIRO', 'En Retiro', 'en retiro'] },
      },
      include: { company: true },
    })

    let createdCount = 0
    let skippedCount = 0

    // Mapa en memoria para correlativos consecutivos por empresa durante la generación masiva
    const companyRunningNumMap = new Map<string, number>()

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

      // Correlativo consecutivo para la empresa
      const compIdKey = contract.companyId || 'GENERAL'
      let currentNum = companyRunningNumMap.get(compIdKey)
      if (currentNum === undefined) {
        const nextStr = await getNextReceiptNumberForCompany(contract.companyId)
        currentNum = parseInt(nextStr, 10) || 1
      }
      const assignedReceiptNo = String(currentNum)
      companyRunningNumMap.set(compIdKey, currentNum + 1)

      const rentAmount = Math.round(
        contract.totalRent || (contract.baseRent + (contract.adjustmentAmount || 0)) || contract.baseRent || 0
      )
      const amountInWords = numberToWordsCLP(rentAmount)

      await prisma.leaseVoucher.create({
        data: {
          contractId: contract.id,
          companyId: contract.companyId,
          month: upperMonth,
          year,
          receiptNumber: assignedReceiptNo,
          baseRent: Math.round(contract.baseRent || 0),
          adjustmentPercent: contract.adjustmentPercentage || 0,
          adjustmentAmount: Math.round(contract.adjustmentAmount || 0),
          totalRent: rentAmount,
          totalMonth: rentAmount,
          amountInWords,
          paymentStatus: 'Pendiente',
          pendingBalance: rentAmount,
          collectedAmount: 0,
          paymentDate: null,
          invoiceNumber: null,
          paymentMethod: 'Transferencia',
          bank: 'SANTANDER',
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
 * Registra el pago de un Voucher (Conciliación Bancaria)
 * Permite registrar fecha real de pago, monto pagado, N° de factura (opcional), banco y método de pago
 * Si el voucher no tiene número de recibo, le asigna el siguiente correlativo para la empresa
 */
export async function registerVoucherPayment(
  voucherId: string,
  data: {
    paymentDate: string
    collectedAmount: number
    invoiceNumber?: string
    bank?: string
    paymentMethod?: string
    comment?: string
  }
) {
  await checkAuth('edit')

  const existing = await prisma.leaseVoucher.findUnique({
    where: { id: voucherId },
    include: {
      contract: {
        include: { company: true },
      },
      company: true,
    },
  })

  if (!existing) {
    return { error: 'Voucher no encontrado' }
  }

  const hasPaymentDate = Boolean(data.paymentDate && data.paymentDate.trim() !== '')
  const total = existing.totalMonth || existing.totalRent || existing.baseRent
  let collected = Number(data.collectedAmount) || 0
  if (collected === 0 && hasPaymentDate) {
    collected = total
  }
  const pending = Math.max(0, total - collected)
  const isPaid = hasPaymentDate && (collected > 0 || total === 0)

  const paymentMethod = data.paymentMethod || 'Transferencia'
  const isNA = paymentMethod === 'No Aplica' || paymentMethod.toLowerCase().includes('no aplica')
  const transfer = isNA ? 0 : paymentMethod === 'Transferencia' ? collected : 0
  const cash = isNA ? 0 : paymentMethod === 'Efectivo' ? collected : 0
  const deposit = isNA ? 0 : paymentMethod === 'Documento' ? collected : 0

  // Si aún no tiene número de recibo, asignar automáticamente el correlativo para su empresa
  let receiptNumberToSet = existing.receiptNumber
  if (!receiptNumberToSet || receiptNumberToSet.trim() === '' || receiptNumberToSet === 'S/N') {
    const compId = existing.companyId || existing.contract?.companyId || null
    receiptNumberToSet = await getNextReceiptNumberForCompany(compId)
  }

  try {
    const updated = await prisma.leaseVoucher.update({
      where: { id: voucherId },
      data: {
        receiptNumber: receiptNumberToSet,
        paymentDate: hasPaymentDate ? data.paymentDate : null,
        paymentStatus: isPaid ? 'Pagado' : collected > 0 ? 'Parcial' : 'Pendiente',
        collectedAmount: hasPaymentDate ? collected : 0,
        pendingBalance: hasPaymentDate ? pending : total,
        transferAmount: hasPaymentDate ? transfer : 0,
        cashAmount: hasPaymentDate ? cash : 0,
        depositAmount: hasPaymentDate ? deposit : 0,
        invoiceNumber: data.invoiceNumber !== undefined ? data.invoiceNumber.trim() : existing.invoiceNumber,
        bank: data.bank ? data.bank.trim() : (existing.bank || 'SANTANDER'),
        paymentMethod,
        comment: data.comment !== undefined ? data.comment.trim() : existing.comment,
      },
      include: {
        contract: {
          include: { company: true },
        },
        company: true,
      },
    })

    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/arriendos')
    return { success: true, voucher: updated }
  } catch (e: any) {
    console.error('Error registering voucher payment:', e)
    return { error: e.message || 'Error al registrar el pago' }
  }
}

/**
 * Actualiza rápidamente el N° de Factura de un Voucher
 * (Para cuando las facturas de SII se emiten días después del pago)
 */
export async function updateVoucherInvoice(voucherId: string, invoiceNumber: string) {
  await checkAuth('edit')

  try {
    const updated = await prisma.leaseVoucher.update({
      where: { id: voucherId },
      data: {
        invoiceNumber: invoiceNumber ? invoiceNumber.trim() : null,
      },
      include: {
        contract: {
          include: { company: true },
        },
        company: true,
      },
    })

    revalidatePath('/admin/vouchers')
    return { success: true, voucher: updated }
  } catch (e: any) {
    console.error('Error updating voucher invoice:', e)
    return { error: e.message || 'Error al actualizar el número de factura' }
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
