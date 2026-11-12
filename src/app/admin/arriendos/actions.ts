'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'

async function checkAuth(action: 'view' | 'create' | 'edit' | 'delete') {
  const session = await requireAdminAuth('vouchers', action)
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    throw new Error('Acceso no autorizado: Módulo exclusivo para el rol de Contabilidad')
  }
  return session
}

export interface ContractFormData {
  companyId?: string | null
  newAssignee?: string | null
  building: string
  unitNumber: string
  propertyType: string
  rol?: string | null
  address?: string | null
  storageNumber?: string | null
  parkingNumber?: string | null
  contractDate?: string | null
  renewalPeriod?: string | null
  status: string
  tenantName: string
  tenantRut?: string | null
  tenantPhone?: string | null
  tenantEmail?: string | null
  otherContactInfo?: string | null
  guarantorRelation?: string | null
  guarantorPhone?: string | null
  guarantorEmail?: string | null
  baseRent: number
  adjustmentPercentage?: number
  adjustmentAmount?: number
  totalRent?: number
  guaranteeAmount?: number | null
  expensesCharge?: number | null
  expensesPayment?: number | null
  previousRent?: number | null
}

/**
 * Actualiza una propiedad / contrato existente
 */
export async function updateContractRecord(contractId: string, data: ContractFormData) {
  await checkAuth('edit')

  try {
    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        companyId: data.companyId || null,
        newAssignee: data.newAssignee?.trim() || null,
        building: data.building.trim().toUpperCase(),
        unitNumber: data.unitNumber.trim(),
        propertyType: data.propertyType.trim(),
        rol: data.rol?.trim() || null,
        address: data.address?.trim() || null,
        storageNumber: data.storageNumber?.trim() || null,
        parkingNumber: data.parkingNumber?.trim() || null,
        contractDate: data.contractDate?.trim() || null,
        renewalPeriod: data.renewalPeriod?.trim() || null,
        status: data.status.trim(),
        tenantName: data.tenantName.trim(),
        tenantRut: data.tenantRut?.trim() || null,
        tenantPhone: data.tenantPhone?.trim() || null,
        tenantEmail: data.tenantEmail?.trim().toLowerCase() || null,
        otherContactInfo: data.otherContactInfo?.trim() || null,
        guarantorRelation: data.guarantorRelation?.trim() || null,
        guarantorPhone: data.guarantorPhone?.trim() || null,
        guarantorEmail: data.guarantorEmail?.trim().toLowerCase() || null,
        baseRent: Number(data.baseRent) || 0,
        adjustmentPercentage: Number(data.adjustmentPercentage) || 0,
        adjustmentAmount: Number(data.adjustmentAmount) || 0,
        totalRent: Number(data.totalRent) || (Number(data.baseRent) + (Number(data.adjustmentAmount) || 0)),
        guaranteeAmount: data.guaranteeAmount !== undefined && data.guaranteeAmount !== null ? Number(data.guaranteeAmount) : null,
        expensesCharge: data.expensesCharge !== undefined && data.expensesCharge !== null ? Number(data.expensesCharge) : null,
        expensesPayment: data.expensesPayment !== undefined && data.expensesPayment !== null ? Number(data.expensesPayment) : null,
        previousRent: data.previousRent !== undefined && data.previousRent !== null ? Number(data.previousRent) : null,
      },
    })

    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    return { success: true, contract: updated }
  } catch (err: any) {
    console.error('Error updating contract:', err)
    return { error: err.message || 'Error al actualizar el registro de arriendo' }
  }
}

/**
 * Crea una nueva propiedad / contrato
 */
export async function createContractRecord(data: ContractFormData) {
  await checkAuth('create')

  try {
    const created = await prisma.rentalContract.create({
      data: {
        companyId: data.companyId || null,
        newAssignee: data.newAssignee?.trim() || null,
        building: data.building.trim().toUpperCase(),
        unitNumber: data.unitNumber.trim(),
        propertyType: data.propertyType.trim(),
        rol: data.rol?.trim() || null,
        address: data.address?.trim() || null,
        storageNumber: data.storageNumber?.trim() || null,
        parkingNumber: data.parkingNumber?.trim() || null,
        contractDate: data.contractDate?.trim() || null,
        renewalPeriod: data.renewalPeriod?.trim() || null,
        status: data.status.trim() || 'Ocupado',
        tenantName: data.tenantName.trim(),
        tenantRut: data.tenantRut?.trim() || null,
        tenantPhone: data.tenantPhone?.trim() || null,
        tenantEmail: data.tenantEmail?.trim().toLowerCase() || null,
        otherContactInfo: data.otherContactInfo?.trim() || null,
        guarantorRelation: data.guarantorRelation?.trim() || null,
        guarantorPhone: data.guarantorPhone?.trim() || null,
        guarantorEmail: data.guarantorEmail?.trim().toLowerCase() || null,
        baseRent: Number(data.baseRent) || 0,
        adjustmentPercentage: Number(data.adjustmentPercentage) || 0,
        adjustmentAmount: Number(data.adjustmentAmount) || 0,
        totalRent: Number(data.totalRent) || (Number(data.baseRent) + (Number(data.adjustmentAmount) || 0)),
        guaranteeAmount: data.guaranteeAmount ? Number(data.guaranteeAmount) : null,
        expensesCharge: data.expensesCharge ? Number(data.expensesCharge) : null,
        expensesPayment: data.expensesPayment ? Number(data.expensesPayment) : null,
        previousRent: data.previousRent ? Number(data.previousRent) : null,
      },
    })

    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    return { success: true, contract: created }
  } catch (err: any) {
    console.error('Error creating contract:', err)
    return { error: err.message || 'Error al crear la propiedad' }
  }
}

/**
 * Elimina una propiedad / contrato
 */
export async function deleteContractRecord(contractId: string) {
  await checkAuth('delete')

  try {
    await prisma.rentalContract.delete({
      where: { id: contractId },
    })

    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al eliminar el registro' }
  }
}
