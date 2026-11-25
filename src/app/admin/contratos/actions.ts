'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { analyzeContractRenewal, toInputDate } from '@/lib/contract-renewals'

async function checkAuth(action: 'view' | 'create' | 'edit' | 'delete') {
  const session = await requireAdminAuth('vouchers', action)
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    throw new Error('Acceso no autorizado: Módulo exclusivo para el rol de Contabilidad')
  }
  return session
}

/**
 * Actualiza en tiempo real la fecha de contrato, período de renovación y/o prórroga automática
 */
export async function updateContractRenewalDates(
  contractId: string,
  data: {
    contractDate?: string | null
    renewalPeriod?: string | null
    autoRenewal?: boolean
  }
) {
  await checkAuth('edit')

  try {
    const existing = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    })

    if (!existing) {
      return { error: 'Propiedad / Contrato no encontrado' }
    }

    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        contractDate: data.contractDate !== undefined ? (data.contractDate?.trim() || null) : existing.contractDate,
        renewalPeriod: data.renewalPeriod !== undefined ? (data.renewalPeriod?.trim().toUpperCase() || null) : existing.renewalPeriod,
        autoRenewal: data.autoRenewal !== undefined ? data.autoRenewal : existing.autoRenewal,
      },
      include: {
        company: true,
      },
    })

    revalidatePath('/admin/contratos')
    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')

    return { success: true, contract: updated }
  } catch (err: any) {
    console.error('Error updating contract renewal dates:', err)
    return { error: err.message || 'Error al actualizar las fechas del contrato' }
  }
}

/**
 * Cambia el estado de renovación automática (SÍ/NO) de una propiedad con un solo clic
 */
export async function toggleContractAutoRenewal(
  contractId: string,
  autoRenewal: boolean
) {
  await checkAuth('edit')

  try {
    const existing = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    })

    if (!existing) {
      return { error: 'Propiedad no encontrada' }
    }

    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        autoRenewal,
      },
      include: {
        company: true,
      },
    })

    revalidatePath('/admin/contratos')
    revalidatePath('/admin/arriendos')

    return { success: true, contract: updated, autoRenewal: updated.autoRenewal }
  } catch (err: any) {
    console.error('Error toggling auto renewal:', err)
    return { error: err.message || 'Error al cambiar la renovación automática' }
  }
}

/**
 * Renueva un contrato en 1 clic:
 * Toma la fecha de vencimiento calculada (o la fecha indicada) y la establece como la nueva fecha de vigencia,
 * dejando registrado el evento en el historial de la ficha.
 */
export async function renewContractPeriod(
  contractId: string,
  customNewStartDate?: string
) {
  await checkAuth('edit')

  try {
    const existing = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    })

    if (!existing) {
      return { error: 'Propiedad no encontrada' }
    }

    const analysis = analyzeContractRenewal(
      existing.contractDate,
      existing.renewalPeriod,
      new Date(),
      existing.autoRenewal
    )

    // La nueva fecha de inicio del ciclo será la fecha de vencimiento anterior o la fecha de hoy
    let newStartDate: string
    if (customNewStartDate) {
      newStartDate = customNewStartDate
    } else if (analysis.expirationDate) {
      newStartDate = toInputDate(analysis.expirationDate)
    } else {
      newStartDate = toInputDate(new Date())
    }

    const todayStr = toInputDate(new Date())
    const renewalNote = `[Renovación de contrato registrada el ${todayStr}: Prorrogado por período ${existing.renewalPeriod || '1 AÑO'} con nueva fecha base ${newStartDate}]`

    const updatedOtherContact = existing.otherContactInfo
      ? `${existing.otherContactInfo.trim()}\n${renewalNote}`
      : renewalNote

    const updated = await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        contractDate: newStartDate,
        otherContactInfo: updatedOtherContact,
      },
      include: {
        company: true,
      },
    })

    revalidatePath('/admin/contratos')
    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/vouchers')

    return { success: true, contract: updated, newStartDate }
  } catch (err: any) {
    console.error('Error renewing contract:', err)
    return { error: err.message || 'Error al renovar el contrato' }
  }
}
