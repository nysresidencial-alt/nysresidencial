'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Shield,
  Key,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  UserCheck,
  RotateCcw,
  Sliders,
  X,
  Loader2,
  Eye,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ADMIN_MODULES, PermissionsMatrix, ActionType } from '@/lib/permissions-config'
import {
  createAdminUser,
  updateAdminUser,
  resetAdminPassword,
  deleteAdminUser,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
} from '@/app/admin/usuarios/actions'

interface Props {
  currentUser: {
    id: string
    name: string
    email: string
    roleName: string
    isSuperadmin: boolean
  }
  users: Array<{
    id: string
    name: string
    email: string
    roleId: string
    roleName: string
    isActive: boolean
    customPermissions: PermissionsMatrix | null
    lastLoginAt: Date | string | null
    createdAt: Date | string
  }>
  roles: Array<{
    id: string
    name: string
    description: string | null
    isSystem: boolean
    permissions: PermissionsMatrix
    userCount: number
  }>
}

export function UsersAndRolesManager({ currentUser, users, roles }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users')

  // Modales de Usuario
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Props['users'][0] | null>(null)
  const [resettingUser, setResettingUser] = useState<Props['users'][0] | null>(null)
  const [customPermUser, setCustomPermUser] = useState<Props['users'][0] | null>(null)

  // Modales de Rol
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Props['roles'][0] | null>(null)

  // Estados de carga y error
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 4000)
    }
  }

  /* =========================================================================
     HANDLERS USUARIOS
     ========================================================================= */

  async function handleCreateUserSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const res = await createAdminUser(formData)

    setLoading(false)
    if (res.success) {
      setIsCreateUserOpen(false)
      showNotification('Usuario creado exitosamente.')
      router.refresh()
    } else {
      showNotification(res.error || 'Error al crear usuario', true)
    }
  }

  async function handleToggleUserStatus(user: Props['users'][0]) {
    if (user.id === currentUser.id) {
      showNotification('No puedes desactivar tu propia cuenta en sesión.', true)
      return
    }

    setLoading(true)
    const res = await updateAdminUser(user.id, { isActive: !user.isActive })
    setLoading(false)

    if (res.success) {
      showNotification(`Usuario ${user.isActive ? 'desactivado' : 'activado'} correctamente.`)
      router.refresh()
    } else {
      showNotification(res.error || 'Error al cambiar estado', true)
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!resettingUser) return

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const newPass = formData.get('newPassword') as string

    const res = await resetAdminPassword(resettingUser.id, newPass)
    setLoading(false)

    if (res.success) {
      setResettingUser(null)
      showNotification(`Contraseña restablecida con éxito para ${resettingUser.name}.`)
      router.refresh()
    } else {
      showNotification(res.error || 'Error al restablecer contraseña', true)
    }
  }

  async function handleDeleteUser(user: Props['users'][0]) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${user.name}"?`)) return

    setLoading(true)
    const res = await deleteAdminUser(user.id)
    setLoading(false)

    if (res.success) {
      showNotification('Usuario eliminado.')
      router.refresh()
    } else {
      showNotification(res.error || 'Error al eliminar usuario', true)
    }
  }

  /* =========================================================================
     HANDLERS ROLES
     ========================================================================= */

  async function handleDeleteRole(role: Props['roles'][0]) {
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) return

    setLoading(true)
    const res = await deleteAdminRole(role.id)
    setLoading(false)

    if (res.success) {
      showNotification('Rol eliminado con éxito.')
      router.refresh()
    } else {
      showNotification(res.error || 'Error al eliminar rol', true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notificaciones */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Usuarios ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4 text-primary" />
            <span>Roles y Permisos ({roles.length})</span>
          </button>
        </div>

        {activeTab === 'users' ? (
          <Button
            onClick={() => setIsCreateUserOpen(true)}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm px-5 cursor-pointer shadow-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </Button>
        ) : (
          <Button
            onClick={() => setIsCreateRoleOpen(true)}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm px-5 cursor-pointer shadow-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Rol</span>
          </Button>
        )}
      </div>

      {/* TAB 1: TABLA DE USUARIOS */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Usuario</th>
                  <th className="px-6 py-4 font-bold">Rol</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 font-bold">Permisos / Excepciones</th>
                  <th className="px-6 py-4 font-bold">Último Acceso</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((user) => {
                  const isUserSuperadmin = user.roleName.toLowerCase() === 'superadmin'
                  const hasCustom = user.customPermissions && Object.keys(user.customPermissions).length > 0

                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      {/* Nombre y correo */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <span>{user.name}</span>
                          {user.id === currentUser.id && (
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs font-mono">{user.email}</div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isUserSuperadmin
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : user.roleName === 'Comercial'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{user.roleName}</span>
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={isUserSuperadmin && !currentUser.isSuperadmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${
                            user.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20'
                          }`}
                          title="Clic para cambiar estado activo/inactivo"
                        >
                          {user.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{user.isActive ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Excepciones */}
                      <td className="px-6 py-4">
                        {isUserSuperadmin ? (
                          <span className="text-xs text-muted-foreground italic">Acceso Total</span>
                        ) : hasCustom ? (
                          <button
                            onClick={() => setCustomPermUser(user)}
                            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Con excepciones ({Object.keys(user.customPermissions!).length})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setCustomPermUser(user)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Hereda de rol</span>
                          </button>
                        )}
                      </td>

                      {/* Último acceso */}
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString('es-CL', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setResettingUser(user)}
                            className="rounded-full text-xs hover:bg-muted p-2"
                            title="Restablecer contraseña"
                          >
                            <Key className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                            className="rounded-full text-xs hover:bg-muted p-2"
                            title="Editar usuario y rol"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>

                          {!isUserSuperadmin && user.id !== currentUser.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user)}
                              className="rounded-full text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 p-2"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE ROLES Y PERMISOS */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((role) => {
              const isSuper = role.name.toLowerCase() === 'superadmin'

              return (
                <div
                  key={role.id}
                  className="bg-card border border-border rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg text-foreground">{role.name}</h3>
                      </div>
                      {role.isSystem && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Sistema
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground min-h-[36px] mb-4">
                      {role.description || 'Sin descripción.'}
                    </p>

                    <div className="border-t border-border/80 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Usuarios asignados:</span>
                      <strong className="text-foreground">{role.userCount}</strong>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRole(role)}
                      className="rounded-full text-xs font-semibold flex-1 gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{isSuper ? 'Ver Permisos' : 'Configurar Permisos'}</span>
                    </Button>

                    {!role.isSystem && !isSuper && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role)}
                        className="rounded-full text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 p-2"
                        title="Eliminar rol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 1: CREAR USUARIO
         ========================================================================= */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  <span>Registrar Nuevo Administrador</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una cuenta para dar acceso al panel administrativo de NYS.
                </p>
              </div>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nombre Completo *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Laura Morales Tapia"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Correo Electrónico *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="usuario@nys.cl"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Rol Inicial *</label>
                <select
                  name="roleId"
                  required
                  defaultValue={roles.find((r) => r.name === 'Comercial')?.id || roles[0]?.id}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description?.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Contraseña Inicial *</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="rounded-full text-xs px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 2: EDITAR USUARIO (NOMBRE, CORREO, ROL)
         ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  <span>Editar Administrador</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Modifica los datos y rol asignado a {editingUser.name}.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setLoading(true)
                const formData = new FormData(e.currentTarget)
                const res = await updateAdminUser(editingUser.id, {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  roleId: formData.get('roleId') as string,
                })
                setLoading(false)
                if (res.success) {
                  setEditingUser(null)
                  showNotification('Usuario actualizado.')
                  router.refresh()
                } else {
                  showNotification(res.error || 'Error al actualizar', true)
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nombre Completo *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser.name}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Correo Electrónico *</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  required
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Rol Asignado *</label>
                <select
                  name="roleId"
                  defaultValue={editingUser.roleId}
                  disabled={editingUser.roleName.toLowerCase() === 'superadmin' && !currentUser.isSuperadmin}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="rounded-full text-xs px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 3: RESTABLECER CONTRASEÑA
         ========================================================================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  <span>Restablecer Contraseña</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa una nueva clave para <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                </p>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Nueva Contraseña *</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResettingUser(null)}
                  className="rounded-full text-xs px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar Contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         MODAL 4: EXCEPCIONES INDIVIDUALES DE PERMISOS POR USUARIO
         ========================================================================= */}
      {customPermUser && (
        <UserPermissionsModal
          user={customPermUser}
          roles={roles}
          onClose={() => setCustomPermUser(null)}
          onSuccess={() => {
            setCustomPermUser(null)
            showNotification('Excepciones de permisos actualizadas.')
            router.refresh()
          }}
        />
      )}

      {/* =========================================================================
         MODAL 5: CREAR / EDITAR ROL Y MATRIZ DE PERMISOS
         ========================================================================= */}
      {isCreateRoleOpen && (
        <RoleEditorModal
          role={null}
          onClose={() => setIsCreateRoleOpen(false)}
          onSuccess={() => {
            setIsCreateRoleOpen(false)
            showNotification('Nuevo rol creado con éxito.')
            router.refresh()
          }}
        />
      )}

      {editingRole && (
        <RoleEditorModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSuccess={() => {
            setEditingRole(null)
            showNotification('Rol y permisos actualizados con éxito.')
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

/* ==========================================================================
   SUBCOMPONENTE: MODAL PARA EDITAR MATRIZ DE ROL
   ========================================================================== */

function RoleEditorModal({
  role,
  onClose,
  onSuccess,
}: {
  role: Props['roles'][0] | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(role)
  const isSuperadminRole = role?.name.toLowerCase() === 'superadmin'

  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [permissions, setPermissions] = useState<PermissionsMatrix>(() => {
    if (role?.permissions) return { ...role.permissions }
    const init: PermissionsMatrix = {}
    ADMIN_MODULES.forEach((m) => {
      init[m.key] = { view: false, create: false, edit: false, delete: false }
    })
    return init
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function togglePerm(modKey: string, action: ActionType) {
    if (isSuperadminRole) return // Inmutable

    setPermissions((prev) => {
      const current = prev[modKey] || { view: false }
      const nextVal = !current[action]

      const updated = {
        ...prev,
        [modKey]: {
          ...current,
          [action]: nextVal,
        },
      }

      // Si activó create, edit o delete, activar view automáticamente
      if ((action === 'create' || action === 'edit' || action === 'delete') && nextVal) {
        updated[modKey].view = true
      }

      // Si desactivó view, desactivar las demás acciones
      if (action === 'view' && !nextVal) {
        updated[modKey].create = false
        updated[modKey].edit = false
        updated[modKey].delete = false
      }

      return updated
    })
  }

  function toggleAllForModule(modKey: string, hasCrud: boolean) {
    if (isSuperadminRole) return
    const current = permissions[modKey] || { view: false }
    const willEnable = !current.view

    setPermissions((prev) => ({
      ...prev,
      [modKey]: {
        view: willEnable,
        create: hasCrud ? willEnable : undefined,
        edit: hasCrud ? willEnable : undefined,
        delete: hasCrud ? willEnable : undefined,
      },
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isEditing && role) {
      const res = await updateAdminRole(role.id, description, permissions)
      setLoading(false)
      if (res.success) {
        onSuccess()
      } else {
        setError(res.error || 'Error al actualizar rol')
      }
    } else {
      const res = await createAdminRole(name, description, permissions)
      setLoading(false)
      if (res.success) {
        onSuccess()
      } else {
        setError(res.error || 'Error al crear rol')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>{isEditing ? `Permisos del Rol: ${role?.name}` : 'Crear Nuevo Rol'}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configura mediante checkboxes qué vistas y acciones puede realizar este rol en el panel.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Body Scrollable */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nombre del Rol *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isEditing && role?.isSystem}
                required
                placeholder="Ej: Editor de Contenido"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Gestiona publicaciones sin acceso a clientes"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          </div>

          {/* Matriz de Permisos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Matriz de Vistas y Permisos</span>
              </h4>
              {isSuperadminRole && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Acceso Total Irrestricto
                </span>
              )}
            </div>

            <div className="border border-border rounded-2xl overflow-hidden bg-background">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Módulo / Vista</th>
                    <th className="px-3 py-3 text-center">Ver</th>
                    <th className="px-3 py-3 text-center">Crear</th>
                    <th className="px-3 py-3 text-center">Editar</th>
                    <th className="px-3 py-3 text-center">Eliminar</th>
                    <th className="px-3 py-3 text-right">Rápido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {ADMIN_MODULES.map((mod) => {
                    const perm = permissions[mod.key] || { view: false }

                    return (
                      <tr key={mod.key} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">{mod.name}</div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{mod.description}</div>
                        </td>

                        {/* Ver */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSuperadminRole ? true : Boolean(perm.view)}
                            disabled={isSuperadminRole}
                            onChange={() => togglePerm(mod.key, 'view')}
                            className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                          />
                        </td>

                        {/* Crear */}
                        <td className="px-3 py-3 text-center">
                          {mod.hasCrud ? (
                            <input
                              type="checkbox"
                              checked={isSuperadminRole ? true : Boolean(perm.create)}
                              disabled={isSuperadminRole}
                              onChange={() => togglePerm(mod.key, 'create')}
                              className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                            />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Editar */}
                        <td className="px-3 py-3 text-center">
                          {mod.hasCrud ? (
                            <input
                              type="checkbox"
                              checked={isSuperadminRole ? true : Boolean(perm.edit)}
                              disabled={isSuperadminRole}
                              onChange={() => togglePerm(mod.key, 'edit')}
                              className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                            />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Eliminar */}
                        <td className="px-3 py-3 text-center">
                          {mod.hasCrud ? (
                            <input
                              type="checkbox"
                              checked={isSuperadminRole ? true : Boolean(perm.delete)}
                              disabled={isSuperadminRole}
                              onChange={() => togglePerm(mod.key, 'delete')}
                              className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer accent-primary"
                            />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Botón Todo / Nada */}
                        <td className="px-3 py-3 text-right">
                          {!isSuperadminRole && (
                            <button
                              type="button"
                              onClick={() => toggleAllForModule(mod.key, mod.hasCrud)}
                              className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                            >
                              {perm.view ? 'Quitar' : 'Todo'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full text-xs px-5">
              Cancelar
            </Button>
            {!isSuperadminRole && (
              <Button
                type="submit"
                disabled={loading}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Matriz'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

/* ==========================================================================
   SUBCOMPONENTE: MODAL PARA EXCEPCIONES INDIVIDUALES DE USUARIO
   ========================================================================== */

function UserPermissionsModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: Props['users'][0]
  roles: Props['roles'][0][]
  onClose: () => void
  onSuccess: () => void
}) {
  const userRole = roles.find((r) => r.id === user.roleId)
  const baseRolePermissions = userRole?.permissions || {}

  // Excepciones activas: un mapa donde cada acción puede ser true (permitido), false (denegado) o undefined (hereda)
  const [exceptions, setExceptions] = useState<PermissionsMatrix>(() => {
    return user.customPermissions ? JSON.parse(JSON.stringify(user.customPermissions)) : {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setActionStatus(modKey: string, action: ActionType, status: 'inherit' | 'allow' | 'deny') {
    setExceptions((prev) => {
      const copy = { ...prev }
      const mod = copy[modKey] ? { ...copy[modKey] } : { view: false }

      if (status === 'inherit') {
        delete (mod as any)[action]
      } else if (status === 'allow') {
        (mod as any)[action] = true
        if (action !== 'view') mod.view = true
      } else {
        (mod as any)[action] = false
      }

      // Si el objeto del módulo queda vacío, lo limpiamos
      if (Object.keys(mod).length === 0) {
        delete copy[modKey]
      } else {
        copy[modKey] = mod
      }

      return copy
    })
  }

  async function handleSave() {
    setLoading(true)
    setError(null)

    const cleanedCustom = Object.keys(exceptions).length > 0 ? exceptions : null
    const res = await updateAdminUser(user.id, {
      customPermissions: cleanedCustom,
    })

    setLoading(false)
    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || 'Error al guardar excepciones')
    }
  }

  function handleResetAllToRole() {
    setExceptions({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <span>Excepciones Individuales: {user.name}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Rol Base: <strong className="text-foreground">{user.roleName}</strong>. Aquí puedes forzar permisos
              adicionales o restringir vistas específicas para este usuario.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between text-xs bg-muted/40 p-3 rounded-xl border border-border">
            <span className="text-muted-foreground">
              Puedes otorgar <strong>(Permitir)</strong>, denegar <strong>(Bloquear)</strong> o dejar que <strong>Herede</strong> del rol.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResetAllToRole}
              className="rounded-full text-xs"
            >
              Restablecer todo a su rol
            </Button>
          </div>

          <div className="border border-border rounded-2xl overflow-hidden bg-background">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-3 py-3 text-center">Permiso en Rol</th>
                  <th className="px-3 py-3 text-center">Ver</th>
                  <th className="px-3 py-3 text-center">Crear</th>
                  <th className="px-3 py-3 text-center">Editar</th>
                  <th className="px-3 py-3 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {ADMIN_MODULES.map((mod) => {
                  const basePerm = baseRolePermissions[mod.key] || { view: false }
                  const custom = exceptions[mod.key]

                  return (
                    <tr key={mod.key} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {mod.name}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            basePerm.view
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
                          }`}
                        >
                          {basePerm.view ? 'Habilitado' : 'Sin Acceso'}
                        </span>
                      </td>

                      {/* Selector de Ver */}
                      <td className="px-3 py-3 text-center">
                        <select
                          value={custom?.view === true ? 'allow' : custom?.view === false ? 'deny' : 'inherit'}
                          onChange={(e) => setActionStatus(mod.key, 'view', e.target.value as any)}
                          className="bg-card border border-border text-[11px] rounded-lg px-2 py-1 font-semibold"
                        >
                          <option value="inherit">Hereda ({basePerm.view ? 'Sí' : 'No'})</option>
                          <option value="allow">✓ Permitir</option>
                          <option value="deny">✕ Bloquear</option>
                        </select>
                      </td>

                      {/* Selector de Crear */}
                      <td className="px-3 py-3 text-center">
                        {mod.hasCrud ? (
                          <select
                            value={custom?.create === true ? 'allow' : custom?.create === false ? 'deny' : 'inherit'}
                            onChange={(e) => setActionStatus(mod.key, 'create', e.target.value as any)}
                            className="bg-card border border-border text-[11px] rounded-lg px-2 py-1 font-semibold"
                          >
                            <option value="inherit">Hereda ({basePerm.create ? 'Sí' : 'No'})</option>
                            <option value="allow">✓ Permitir</option>
                            <option value="deny">✕ Bloquear</option>
                          </select>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>

                      {/* Selector de Editar */}
                      <td className="px-3 py-3 text-center">
                        {mod.hasCrud ? (
                          <select
                            value={custom?.edit === true ? 'allow' : custom?.edit === false ? 'deny' : 'inherit'}
                            onChange={(e) => setActionStatus(mod.key, 'edit', e.target.value as any)}
                            className="bg-card border border-border text-[11px] rounded-lg px-2 py-1 font-semibold"
                          >
                            <option value="inherit">Hereda ({basePerm.edit ? 'Sí' : 'No'})</option>
                            <option value="allow">✓ Permitir</option>
                            <option value="deny">✕ Bloquear</option>
                          </select>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>

                      {/* Selector de Eliminar */}
                      <td className="px-3 py-3 text-center">
                        {mod.hasCrud ? (
                          <select
                            value={custom?.delete === true ? 'allow' : custom?.delete === false ? 'deny' : 'inherit'}
                            onChange={(e) => setActionStatus(mod.key, 'delete', e.target.value as any)}
                            className="bg-card border border-border text-[11px] rounded-lg px-2 py-1 font-semibold"
                          >
                            <option value="inherit">Hereda ({basePerm.delete ? 'Sí' : 'No'})</option>
                            <option value="allow">✓ Permitir</option>
                            <option value="deny">✕ Bloquear</option>
                          </select>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-card">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-full text-xs px-5">
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Excepciones'}
          </Button>
        </div>
      </div>
    </div>
  )
}
