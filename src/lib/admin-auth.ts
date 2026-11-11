import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import crypto from 'crypto'
import { PermissionsMatrix } from './permissions-config'

const SESSION_COOKIE_NAME = 'nys_admin_auth_session'
const SECRET_KEY = process.env.SUPABASE_JWT_SECRET || 'nys_residencial_superadmin_salt_2026_secure'

export interface AdminUserSession {
  id: string
  name: string
  email: string
  roleId: string
  roleName: string
  isSuperadmin: boolean
  permissions: PermissionsMatrix
}

function sign(payload: string): string {
  const hmac = crypto.createHmac('sha256', SECRET_KEY)
  hmac.update(payload)
  return `${payload}.${hmac.digest('hex')}`
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null
  const payload = token.substring(0, lastDot)
  const signature = token.substring(lastDot + 1)
  const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex')
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
    return payload
  }
  return null
}

export async function createAdminSession(user: {
  id: string
  name: string
  email: string
  roleId: string
  roleName: string
}) {
  const cookieStore = await cookies()
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    roleName: user.roleName,
    issuedAt: Date.now(),
  })

  const token = sign(payload)

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  })
}

export async function getAdminSession(): Promise<AdminUserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = verify(token)
    if (!payload) return null
    const data = JSON.parse(payload)

    // Consultar usuario en BD para asegurar que sigue activo y obtener rol y permisos actualizados
    const user = await prisma.adminUser.findUnique({
      where: { id: data.id },
      include: { role: true },
    })

    if (!user || !user.isActive) return null

    const isSuperadmin = user.role.name.toLowerCase() === 'superadmin'

    // Permisos base del rol
    const basePermissions = (user.role.permissions as unknown as PermissionsMatrix) || {}

    // Excepciones individuales del usuario (si existen, sobreescriben al rol)
    const customPermissions = (user.customPermissions as unknown as PermissionsMatrix) || {}

    const mergedPermissions: PermissionsMatrix = { ...basePermissions }
    for (const [modKey, modPerm] of Object.entries(customPermissions)) {
      mergedPermissions[modKey] = {
        ...(mergedPermissions[modKey] || {}),
        ...modPerm,
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.role.id,
      roleName: user.role.name,
      isSuperadmin,
      permissions: mergedPermissions,
    }
  } catch (e) {
    console.error('Error fetching admin session:', e)
    return null
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete('mock_admin_session')
}

/**
 * Valida si la sesión actual tiene permiso para un módulo y acción.
 * Si es Superadmin, siempre devuelve true.
 */
export function hasPermission(
  session: AdminUserSession | null,
  moduleKey: string,
  action: 'view' | 'create' | 'edit' | 'delete' = 'view'
): boolean {
  if (!session) return false
  if (session.isSuperadmin) return true

  const mod = session.permissions[moduleKey]
  if (!mod) return false
  return Boolean(mod[action])
}
