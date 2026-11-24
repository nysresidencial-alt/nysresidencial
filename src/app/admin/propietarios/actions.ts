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
  isActive: boolean
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
  let owners = await prisma.propertyOwner.findMany({
    orderBy: { name: 'asc' },
  })

  // 2. Obtener contratos para calcular totales y edificios por propietario
  const contracts = await prisma.rentalContract.findMany({
    select: {
      newAssignee: true,
      assigneeRut: true,
      building: true,
      company: {
        select: {
          code: true,
          name: true,
          rut: true,
        },
      },
    },
  })

  // Mapa de conteo y edificios
  const statsMap = new Map<string, { count: number; buildings: Set<string> }>()
  const ownerMetaMap = new Map<string, { isCompany: boolean; companyCode?: string; companyName?: string; rut?: string }>()

  for (const c of contracts) {
    const isAssignee = Boolean(c.newAssignee && c.newAssignee.trim() !== '')
    const ownerName = isAssignee
      ? c.newAssignee!.trim()
      : (c.company ? c.company.name : 'Sin Asignar')

    if (!statsMap.has(ownerName)) {
      statsMap.set(ownerName, { count: 0, buildings: new Set() })
      ownerMetaMap.set(ownerName, {
        isCompany: !isAssignee,
        companyCode: c.company?.code || undefined,
        companyName: c.company?.name || undefined,
        rut: (isAssignee ? c.assigneeRut : c.company?.rut) || undefined,
      })
    }
    const stat = statsMap.get(ownerName)!
    stat.count++
    if (c.building) stat.buildings.add(c.building)
  }

  // Si hay propietarios de contratos que no están registrados aún en PropertyOwner, sincronizarlos
  const existingNames = new Set(owners.map((o) => o.name.trim().toUpperCase()))
  const missingOwners = Array.from(statsMap.keys()).filter(
    (name) => name !== 'Sin Asignar' && !existingNames.has(name.trim().toUpperCase())
  )

  if (missingOwners.length > 0) {
    for (const name of missingOwners) {
      const meta = ownerMetaMap.get(name)
      try {
        await prisma.propertyOwner.create({
          data: {
            name,
            rut: meta?.rut || null,
            isCompany: meta?.isCompany || false,
            companyCode: meta?.companyCode || null,
            companyName: meta?.companyName || null,
            isActive: true,
          },
        })
      } catch {
        // Ignorar si ya fue creado por otra petición concurrente
      }
    }

    owners = await prisma.propertyOwner.findMany({
      orderBy: { name: 'asc' },
    })
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
      isActive: o.isActive,
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
 * Alterna la visibilidad de un propietario (Activo vs Histórico/Oculto)
 * y actualiza isOwnerActive en cascada para todos los contratos asociados
 */
export async function toggleOwnerVisibility(id: string): Promise<{ success?: boolean; isActive?: boolean; error?: string }> {
  await checkAuth('edit')

  const existing = await prisma.propertyOwner.findUnique({
    where: { id },
  })

  if (!existing) {
    return { error: 'Propietario no encontrado' }
  }

  const nextActive = !existing.isActive

  try {
    // 1. Actualizar PropertyOwner
    const updated = await prisma.propertyOwner.update({
      where: { id },
      data: { isActive: nextActive },
    })

    // 2. Sincronizar contratos asociados (tanto si es nuevo asignatario o por empresa)
    await prisma.rentalContract.updateMany({
      where: {
        OR: [
          { newAssignee: existing.name },
          {
            AND: [
              { OR: [{ newAssignee: null }, { newAssignee: '' }] },
              { company: { name: existing.name } },
            ],
          },
        ],
      },
      data: {
        isOwnerActive: nextActive,
      },
    })

    revalidatePath('/admin/propietarios')
    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/arriendos')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/correos')
    revalidatePath('/admin/datos')

    return { success: true, isActive: updated.isActive }
  } catch (err: any) {
    console.error('Error alternando visibilidad de propietario:', err)
    return { error: err.message || 'Error al cambiar visibilidad del propietario' }
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
