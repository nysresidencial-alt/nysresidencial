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
  autoRenewal?: boolean
  noticeDays?: number
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
    const isNewVacantOrSold = data.status === 'Disponible' || data.status === 'Vendido'
    let finalTenantName = data.tenantName.trim()
    let finalTenantRut = data.tenantRut?.trim() || null
    let finalTenantPhone = data.tenantPhone?.trim() || null
    let finalTenantEmail = data.tenantEmail?.trim().toLowerCase() || null
    let finalOtherContact = data.otherContactInfo?.trim() || null

    if (isNewVacantOrSold) {
      const isPlaceholder = ['disponible', 'vendido', 'por asignar', ''].includes(finalTenantName.toLowerCase())
      if (!isPlaceholder) {
        // Archivar el arrendatario en otherContactInfo
        const historyEntry = `[Historial previo: Ex-arrendatario: ${finalTenantName} | RUT: ${finalTenantRut || 'Sin RUT'} | Tel: ${finalTenantPhone || '-'} | Mail: ${finalTenantEmail || '-'}]`
        finalOtherContact = finalOtherContact ? `${finalOtherContact}\n${historyEntry}` : historyEntry
        finalTenantName = data.status === 'Vendido' ? 'VENDIDO' : 'DISPONIBLE'
        finalTenantRut = null
        finalTenantPhone = null
        finalTenantEmail = null
      }
    }

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
        autoRenewal: data.autoRenewal !== undefined ? data.autoRenewal : undefined,
        noticeDays: data.noticeDays !== undefined ? Number(data.noticeDays) : undefined,
        status: data.status.trim(),
        tenantName: finalTenantName,
        tenantRut: finalTenantRut,
        tenantPhone: finalTenantPhone,
        tenantEmail: finalTenantEmail,
        otherContactInfo: finalOtherContact,
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

    // Si se cambió a Disponible o Vendido, actualizar vouchers abiertos sin pago
    if (isNewVacantOrSold) {
      await prisma.leaseVoucher.updateMany({
        where: {
          contractId,
          paymentDate: null,
        },
        data: {
          paymentStatus: data.status.trim(),
        },
      })
    }

    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    return { success: true, contract: updated }
  } catch (err: any) {
    console.error('Error updating contract:', err)
    return { error: err.message || 'Error al actualizar el registro de arriendo' }
  }
}

/**
 * Cambia rápidamente el estado de una propiedad (Ocupado, Disponible, Vendido, En Retiro)
 * Gestiona el archivado automático de arrendatarios previos y sincroniza vouchers
 */
export async function changeContractStatus(
  contractId: string,
  newStatus: string
) {
  await checkAuth('edit')

  try {
    const existing = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    })

    if (!existing) {
      return { error: 'Propiedad no encontrada' }
    }

    // Si pasa a Disponible o Vendido
    if (newStatus === 'Disponible' || newStatus === 'Vendido') {
      const currentName = existing.tenantName || ''
      const isCurrentPlaceholder = ['disponible', 'vendido', 'por asignar', ''].includes(currentName.toLowerCase().trim())

      let otherContact = existing.otherContactInfo || ''
      if (!isCurrentPlaceholder) {
        const histNote = `[Historial previo: Ex-arrendatario: ${currentName.trim()} | RUT: ${existing.tenantRut || 'Sin RUT'} | Tel: ${existing.tenantPhone || '-'} | Mail: ${existing.tenantEmail || '-'}]`
        otherContact = otherContact ? `${otherContact.trim()}\n${histNote}` : histNote
      }

      const updated = await prisma.rentalContract.update({
        where: { id: contractId },
        data: {
          status: newStatus,
          tenantName: newStatus === 'Vendido' ? 'VENDIDO' : 'DISPONIBLE',
          tenantRut: null,
          tenantPhone: null,
          tenantEmail: null,
          otherContactInfo: otherContact || null,
        },
      })

      // Actualizar vouchers abiertos sin pago para no inflar cobranza
      await prisma.leaseVoucher.updateMany({
        where: {
          contractId,
          paymentDate: null,
        },
        data: {
          paymentStatus: newStatus,
        },
      })

      revalidatePath('/admin/arriendos')
      revalidatePath('/admin/vouchers')
      return { success: true, contract: updated }
    }

    // Si pasa a Ocupado
    if (newStatus === 'Ocupado') {
      const currentName = existing.tenantName || ''
      const isPlaceholder = ['disponible', 'vendido', 'por asignar', ''].includes(currentName.toLowerCase().trim())

      if (isPlaceholder) {
        // Indica que requiere registrar los datos del nuevo arrendatario
        return { requiresTenantForm: true, contract: existing }
      }

      const updated = await prisma.rentalContract.update({
        where: { id: contractId },
        data: { status: 'Ocupado' },
      })

      revalidatePath('/admin/arriendos')
      revalidatePath('/admin/vouchers')
      return { success: true, contract: updated }
    }

    // Para cualquier otro estado (ej: En Retiro)
    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: { status: newStatus },
    })

    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')
    return { success: true, contract: updated }
  } catch (err: any) {
    console.error('Error changing contract status:', err)
    return { error: err.message || 'Error al cambiar el estado de la propiedad' }
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
        autoRenewal: data.autoRenewal !== undefined ? data.autoRenewal : true,
        noticeDays: data.noticeDays !== undefined ? Number(data.noticeDays) : 30,
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
