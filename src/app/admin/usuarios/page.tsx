import prisma from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-auth'
import { UsersAndRolesManager } from '@/components/admin/UsersAndRolesManager'
import { ShieldCheck, Users } from 'lucide-react'
import { PermissionsMatrix } from '@/lib/permissions-config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Usuarios y Permisos • Superadmin | NYS Residencial',
}

export default async function AdminUsersPage() {
  const session = await requireAdminAuth('usuarios', 'view')
  const isSuperadmin = session.isSuperadmin

  // Cargar usuarios con su rol
  const users = await prisma.adminUser.findMany({
    include: {
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Cargar roles con conteo de usuarios
  const roles = await prisma.adminRole.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const formattedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roleId: u.role.id,
    roleName: u.role.name,
    isActive: u.isActive,
    customPermissions: (u.customPermissions as unknown as PermissionsMatrix) || null,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }))

  const formattedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: (r.permissions as unknown as PermissionsMatrix) || {},
    userCount: r._count.users,
  }))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Panel de Control Superadmin</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <span>Gestión de Usuarios, Roles y Permisos</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Administra las cuentas de acceso al panel de NYS Residencial, crea roles con matrices de permisos por módulo y
          asigna excepciones individuales para cada colaborador.
        </p>
      </div>

      <UsersAndRolesManager
        currentUser={{
          id: session.id,
          name: session.name,
          email: session.email,
          roleName: session.roleName,
          isSuperadmin: session.isSuperadmin,
        }}
        users={formattedUsers}
        roles={formattedRoles}
      />
    </div>
  )
}
