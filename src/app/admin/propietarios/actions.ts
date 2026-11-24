'use server'

import prisma from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

async function checkAuth(action: 'view' | 'edit') {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('No autorizado: sesión no válida')
  }

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    const hasPerm = session.permissions?.['vouchers']?.[action] || session.permissions?.['arriendos']?.[action]
    if (!hasPerm) {
      throw new Error(`Acceso denegado: Se requiere rol de Contabilidad o Superadmin`)
    }
  }

  return session
}

export interface PropietarioDetail {
  id: string
  name: string
  rut: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  companyCode: string | null
  companyName: string | null
  isCompany: boolean
  propertiesCount: number
  buildings: string[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Obtiene la lista completa de propietarios con el conteo de propiedades y edificios asociados
 */
export async function getPropietarios(): Promise<PropietarioDetail[]> {
  await checkAuth('view')

  // 1. Obtener todos los propietarios registrados
  const owners = await prisma.propertyOwner.findMany({
    orderBy: { name: 'asc' },
  })

  // 2. Obtener contratos para calcular totales y edificios por propietario
  const contracts = await prisma.rentalContract.findMany({
    select: {
      newAssignee: true,
      building: true,
      company: {
        select: {
          name: true,
        },
      },
    },
  })

  // Mapa de conteo y edificios
  const statsMap = new Map<string, { count: number; buildings: Set<string> }>()
  for (const c of contracts) {
    const isAssignee = Boolean(c.newAssignee && c.newAssignee.trim() !== '')
    const ownerName = isAssignee
      ? c.newAssignee!.trim()
      : (c.company ? c.company.name : 'Sin Asignar')

    if (!statsMap.has(ownerName)) {
      statsMap.set(ownerName, { count: 0, buildings: new Set() })
    }
    const stat = statsMap.get(ownerName)!
    stat.count++
    if (c.building) stat.buildings.add(c.building)
  }

  return owners.map((o) => {
    const stat = statsMap.get(o.name) || { count: 0, buildings: new Set() }
    return {
      id: o.id,
      name: o.name,
      rut: o.rut,
      phone: o.phone,
      email: o.email,
      address: o.address,
      notes: o.notes,
      companyCode: o.companyCode,
      companyName: o.companyName,
      isCompany: o.isCompany,
      propertiesCount: stat.count,
      buildings: Array.from(stat.buildings),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }
  })
}

/**
 * Actualiza los datos de un Propietario (RUT, teléfono, email, dirección, notas)
 * y sincroniza el nuevo RUT con la tabla RentalContract y OwnerCompany
 */
export async function updatePropietario(
  id: string,
  data: {
    rut?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
  }
) {
  await checkAuth('edit')

  const existing = await prisma.propertyOwner.findUnique({
    where: { id },
  })

  if (!existing) {
    return { error: 'Propietario no encontrado' }
  }

  const cleanRut = data.rut ? data.rut.trim().toUpperCase() : null
  const cleanPhone = data.phone !== undefined ? data.phone?.trim() || null : existing.phone
  const cleanEmail = data.email !== undefined ? data.email?.trim() || null : existing.email
  const cleanAddress = data.address !== undefined ? data.address?.trim() || null : existing.address
  const cleanNotes = data.notes !== undefined ? data.notes?.trim() || null : existing.notes

  try {
    // 1. Actualizar registro en la tabla PropertyOwner
    const updated = await prisma.propertyOwner.update({
      where: { id },
      data: {
        rut: cleanRut,
        phone: cleanPhone,
        email: cleanEmail,
        address: cleanAddress,
        notes: cleanNotes,
      },
    })

    // 2. Sincronizar en la tabla maestra RentalContract para mantener el full de datos actualizado
    await prisma.rentalContract.updateMany({
      where: {
        newAssignee: existing.name,
      },
      data: {
        assigneeRut: cleanRut,
      },
    })

    // Si el propietario es una empresa, sincronizar también en OwnerCompany
    if (existing.isCompany) {
      await prisma.ownerCompany.updateMany({
        where: {
          name: existing.name,
        },
        data: {
          rut: cleanRut,
          phone: cleanPhone,
          email: cleanEmail,
          address: cleanAddress,
        },
      })
    }

    revalidatePath('/admin/propietarios')
    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/datos')

    return { success: true, owner: updated }
  } catch (err: any) {
    console.error('Error actualizando propietario:', err)
    return { error: err.message || 'Error al actualizar propietario' }
  }
}

/**
 * Obtiene todas las propiedades / contratos pertenecientes a un propietario específico
 */
export async function getPropietarioProperties(ownerName: string) {
  await checkAuth('view')

  const contracts = await prisma.rentalContract.findMany({
    where: {
      OR: [
        { newAssignee: ownerName },
        {
          AND: [
            { OR: [{ newAssignee: null }, { newAssignee: '' }] },
            { company: { name: ownerName } },
          ],
        },
      ],
    },
    include: {
      company: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: [
      { building: 'asc' },
      { unitNumber: 'asc' },
    ],
  })

  return contracts.map((c) => ({
    id: c.id,
    building: c.building,
    unitNumber: c.unitNumber,
    propertyType: c.propertyType,
    status: c.status,
    tenantName: c.tenantName,
    tenantPhone: c.tenantPhone,
    totalRent: c.totalRent,
    contractDate: c.contractDate,
    companyCode: c.company?.code || '',
    companyName: c.company?.name || '',
    newAssignee: c.newAssignee,
    assigneeRut: c.assigneeRut,
  }))
}
