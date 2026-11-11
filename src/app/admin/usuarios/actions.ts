'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getAdminSession, hasPermission } from '@/lib/admin-auth'
import { hashPassword } from '@/lib/password'
import { PermissionsMatrix } from '@/lib/permissions-config'

/**
 * Validar que quien ejecuta la acción sea Superadmin o tenga permiso explícito de 'usuarios'
 */
async function requireSuperadminOrPermission(action: 'view' | 'create' | 'edit' | 'delete' = 'view') {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('No autorizado. Debes iniciar sesión como administrador.')
  }
  if (!session.isSuperadmin && !hasPermission(session, 'usuarios', action)) {
    throw new Error('Permisos insuficientes para realizar esta acción.')
  }
  return session
}

/* ==========================================================================
   USUARIOS
   ========================================================================== */

export async function createAdminUser(formData: FormData) {
  try {
    await requireSuperadminOrPermission('create')

    const name = (formData.get('name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = (formData.get('password') as string)?.trim()
    const roleId = (formData.get('roleId') as string)?.trim()

    if (!name || !email || !password || !roleId) {
      return { success: false, error: 'Todos los campos obligatorios deben completarse.' }
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
    }

    // Comprobar si el correo ya existe
    const existing = await prisma.adminUser.findUnique({
      where: { email },
    })

    if (existing) {
      return { success: false, error: 'Ya existe un usuario con este correo electrónico.' }
    }

    const passwordHash = hashPassword(password)

    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        roleId,
        isActive: true,
      },
    })

    revalidatePath('/admin/usuarios')
    return { success: true, user: { id: user.id, name: user.name, email: user.email } }
  } catch (err: any) {
    console.error('Error in createAdminUser:', err)
    return { success: false, error: err.message || 'Error al crear el usuario.' }
  }
}

export async function updateAdminUser(
  userId: string,
  data: {
    name?: string
    email?: string
    roleId?: string
    isActive?: boolean
    customPermissions?: PermissionsMatrix | null
  }
) {
  try {
    const session = await requireSuperadminOrPermission('edit')

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    // Proteger al Superadmin: No se puede desactivar ni cambiar rol a Superadmin si no es otro Superadmin
    if (targetUser.role.name.toLowerCase() === 'superadmin' && !session.isSuperadmin) {
      return { success: false, error: 'Solo un Superadministrador puede modificar a otro Superadministrador.' }
    }

    // No permitir desactivar la propia cuenta del Superadmin en sesión
    if (targetUser.id === session.id && data.isActive === false) {
      return { success: false, error: 'No puedes desactivar tu propia cuenta en sesión.' }
    }

    await prisma.adminUser.update({
      where: { id: userId },
      data: {
        name: data.name?.trim(),
        email: data.email?.trim().toLowerCase(),
        roleId: data.roleId,
        isActive: data.isActive,
        customPermissions: data.customPermissions !== undefined ? (data.customPermissions as any) : undefined,
      },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateAdminUser:', err)
    return { success: false, error: err.message || 'Error al actualizar el usuario.' }
  }
}

export async function resetAdminPassword(userId: string, newPassword: string) {
  try {
    const session = await requireSuperadminOrPermission('edit')

    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    if (targetUser.role.name.toLowerCase() === 'superadmin' && !session.isSuperadmin) {
      return { success: false, error: 'Solo un Superadministrador puede cambiar la contraseña de un Superadmin.' }
    }

    const passwordHash = hashPassword(newPassword.trim())

    await prisma.adminUser.update({
      where: { id: userId },
      data: { passwordHash },
    })

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (err: any) {
    console.error('Error in resetAdminPassword:', err)
    return { success: false, error: err.message || 'Error al restablecer contraseña.' }
  }
}

export async function deleteAdminUser(userId: string) {
  try {
    const session = await requireSuperadminOrPermission('delete')

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: userId },
      include: { role: true },
    })

    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    // No se puede eliminar a Superadmin
    if (targetUser.role.name.toLowerCase() === 'superadmin') {
      return { success: false, error: 'El usuario Superadmin está protegido y no puede ser eliminado.' }
    }

    if (targetUser.id === session.id) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta.' }
    }

    await prisma.adminUser.delete({
      where: { id: userId },
    })

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteAdminUser:', err)
    return { success: false, error: err.message || 'Error al eliminar el usuario.' }
  }
}

/* ==========================================================================
   ROLES Y PERMISOS
   ========================================================================== */

export async function createAdminRole(name: string, description: string, permissions: PermissionsMatrix) {
  try {
    await requireSuperadminOrPermission('create')

    const cleanName = name.trim()
    if (!cleanName) {
      return { success: false, error: 'El nombre del rol es obligatorio.' }
    }

    const existing = await prisma.adminRole.findUnique({
      where: { name: cleanName },
    })

    if (existing) {
      return { success: false, error: 'Ya existe un rol con ese nombre.' }
    }

    const role = await prisma.adminRole.create({
      data: {
        name: cleanName,
        description: description?.trim() || null,
        isSystem: false,
        permissions: permissions as any,
      },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin', 'layout')
    return { success: true, role }
  } catch (err: any) {
    console.error('Error in createAdminRole:', err)
    return { success: false, error: err.message || 'Error al crear el rol.' }
  }
}

export async function updateAdminRole(roleId: string, description: string, permissions: PermissionsMatrix) {
  try {
    await requireSuperadminOrPermission('edit')

    const role = await prisma.adminRole.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return { success: false, error: 'Rol no encontrado.' }
    }

    // Superadmin siempre conserva permisos totales
    if (role.name.toLowerCase() === 'superadmin') {
      return { success: false, error: 'El rol Superadmin tiene permisos totales por definición del sistema.' }
    }

    await prisma.adminRole.update({
      where: { id: roleId },
      data: {
        description: description?.trim() || null,
        permissions: permissions as any,
      },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/admin', 'layout')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updateAdminRole:', err)
    return { success: false, error: err.message || 'Error al actualizar el rol.' }
  }
}

export async function deleteAdminRole(roleId: string) {
  try {
    await requireSuperadminOrPermission('delete')

    const role = await prisma.adminRole.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    })

    if (!role) {
      return { success: false, error: 'Rol no encontrado.' }
    }

    if (role.isSystem || role.name.toLowerCase() === 'superadmin') {
      return { success: false, error: 'Los roles del sistema no pueden ser eliminados.' }
    }

    if (role._count.users > 0) {
      return {
        success: false,
        error: `No puedes eliminar este rol porque está asignado a ${role._count.users} usuario(s). Reasigna los usuarios primero.`,
      }
    }

    await prisma.adminRole.delete({
      where: { id: roleId },
    })

    revalidatePath('/admin/usuarios')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deleteAdminRole:', err)
    return { success: false, error: err.message || 'Error al eliminar el rol.' }
  }
}
