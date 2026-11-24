'use client'

import React, { useState, useMemo } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  Building,
  Home,
  Phone,
  Mail,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { PropietarioDetail, toggleOwnerVisibility } from '@/app/admin/propietarios/actions'
import { OwnerEditModal } from './OwnerEditModal'
import { OwnerPropertiesModal } from './OwnerPropertiesModal'
import { cn } from '@/lib/utils'

interface PropietariosManagerProps {
  initialOwners: PropietarioDetail[]
  currentRole?: string
  isSuperadmin?: boolean
}

export function PropietariosManager({
  initialOwners,
  currentRole,
  isSuperadmin,
}: PropietariosManagerProps) {
  const [owners, setOwners] = useState<PropietarioDetail[]>(initialOwners)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRutStatus, setFilterRutStatus] = useState<'ALL' | 'WITH_RUT' | 'WITHOUT_RUT'>('ALL')
  const [filterVisibility, setFilterVisibility] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL')

  // Modales
  const [editingOwner, setEditingOwner] = useState<PropietarioDetail | null>(null)
  const [viewingPropertiesOwner, setViewingPropertiesOwner] = useState<string | null>(null)

  // Estado para acción de ocultar/mostrar con ojo
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Mensaje temporal de éxito
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  // Métricas
  const totalOwners = owners.length
  const activeOwners = owners.filter((o) => o.isActive).length
  const hiddenOwners = owners.filter((o) => !o.isActive).length
  const ownersWithRut = owners.filter((o) => o.rut && o.rut.trim() !== '').length
  const ownersPendingRut = totalOwners - ownersWithRut
  const totalProperties = owners.reduce((acc, o) => acc + o.propertiesCount, 0)

  // Filtrado reactivo
  const filteredOwners = useMemo(() => {
    return owners.filter((o) => {
      // Filtro de Visibilidad (Ojo)
      if (filterVisibility === 'ACTIVE' && !o.isActive) return false
      if (filterVisibility === 'HIDDEN' && o.isActive) return false

      // Filtro de RUT
      if (filterRutStatus === 'WITH_RUT' && (!o.rut || o.rut.trim() === '')) return false
      if (filterRutStatus === 'WITHOUT_RUT' && Boolean(o.rut && o.rut.trim() !== '')) return false

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = o.name.toLowerCase().includes(query)
        const matchRut = (o.rut || '').toLowerCase().includes(query)
        const matchComp = (o.companyName || '').toLowerCase().includes(query) || (o.companyCode || '').toLowerCase().includes(query)
        const matchBuildings = o.buildings.some((b) => b.toLowerCase().includes(query))
        if (!matchName && !matchRut && !matchComp && !matchBuildings) return false
      }

      return true
    })
  }, [owners, searchTerm, filterRutStatus, filterVisibility])

  function handleOwnerSaved(updated: PropietarioDetail) {
    setOwners((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)))
    setEditingOwner(null)
    showToast(`RUT y datos de "${updated.name}" actualizados con éxito. Sincronizado en contratos y vouchers.`)
  }

  async function handleToggleVisibility(owner: PropietarioDetail) {
    const nextState = !owner.isActive
    setTogglingId(owner.id)

    // Actualización optimista inmediata en UI
    setOwners((prev) =>
      prev.map((o) => (o.id === owner.id ? { ...o, isActive: nextState } : o))
    )

    try {
      const res = await toggleOwnerVisibility(owner.id)
      if (res.error) {
        // Revertir en caso de error
        setOwners((prev) =>
          prev.map((o) => (o.id === owner.id ? { ...o, isActive: !nextState } : o))
        )
        showToast(`Error al cambiar visibilidad: ${res.error}`)
      } else {
        showToast(
          nextState
            ? `Propietario "${owner.name}" activado y visible nuevamente en Vouchers y Propiedades.`
            : `Propietario "${owner.name}" ocultado de Vouchers y Propiedades. Sus datos se conservan en el historial.`
        )
      }
    } catch (err: any) {
      setOwners((prev) =>
        prev.map((o) => (o.id === owner.id ? { ...o, isActive: !nextState } : o))
      )
      showToast(`Error: ${err.message || 'No se pudo alternar la visibilidad'}`)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast notificador */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Administración de Propietarios
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestión de RUT oficial y control de visibilidad (ocultar de vouchers sin eliminar del historial)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Propietarios
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-foreground">{totalOwners}</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {activeOwners} activos • {hiddenOwners} ocultos
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Activos / Administrados
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeOwners}
            </span>
            <Eye className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Visibles en Vouchers y Propiedades
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Históricos / Ocultos
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-zinc-600 dark:text-zinc-300">
              {hiddenOwners}
            </span>
            <EyeOff className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Ocultos de Vouchers (guardados en BD)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Pendientes de RUT
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {ownersPendingRut}
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Requieren ingresar RUT real
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre de propietario, RUT, edificio o empresa..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtros de Visibilidad (Ojo) */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFilterVisibility('ALL')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  filterVisibility === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Todos ({totalOwners})
              </button>
              <button
                type="button"
                onClick={() => setFilterVisibility('ACTIVE')}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  filterVisibility === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Activos ({activeOwners})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterVisibility('HIDDEN')}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  filterVisibility === 'HIDDEN'
                    ? 'bg-zinc-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ocultos ({hiddenOwners})</span>
              </button>
            </div>

            {/* Filtros de estado de RUT */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setFilterRutStatus('WITH_RUT')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  filterRutStatus === 'WITH_RUT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Con RUT ({ownersWithRut})
              </button>
              <button
                type="button"
                onClick={() => setFilterRutStatus('WITHOUT_RUT')}
                className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  filterRutStatus === 'WITHOUT_RUT'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Sin RUT ({ownersPendingRut})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Propietarios */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center" title="Visibilidad en Vouchers y Propiedades">
                  Estado
                </th>
                <th className="py-3.5 px-4">Propietario / Asignatario</th>
                <th className="py-3.5 px-4">RUT Oficial</th>
                <th className="py-3.5 px-4 text-center">Inmuebles</th>
                <th className="py-3.5 px-4">Edificios</th>
                <th className="py-3.5 px-4">Empresa Asociada</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No se encontraron propietarios</p>
                    <p className="text-xs mt-1">Prueba cambiando los términos de búsqueda o filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredOwners.map((owner) => {
                  const hasRut = Boolean(owner.rut && owner.rut.trim() !== '')
                  const isHidden = !owner.isActive

                  return (
                    <tr
                      key={owner.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors group',
                        isHidden && 'bg-muted/15 opacity-65'
                      )}
                    >
                      {/* Botón de Ojo: Alternar Visibilidad */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={togglingId === owner.id}
                          onClick={() => handleToggleVisibility(owner)}
                          className={cn(
                            'p-2 rounded-xl border transition-all cursor-pointer',
                            owner.isActive
                              ? 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
                              : 'text-zinc-500 bg-muted/60 hover:bg-muted hover:text-foreground border-border'
                          )}
                          title={
                            owner.isActive
                              ? 'Propietario ACTIVO (Visible en Vouchers y Propiedades). Haz clic para Ocultar.'
                              : 'Propietario HISTÓRICO (Oculto de Vouchers y Propiedades). Haz clic para Reactivar.'
                          }
                        >
                          {togglingId === owner.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : owner.isActive ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>
                      </td>

                      {/* Nombre y Tipo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-bold text-sm', isHidden ? 'text-muted-foreground line-through decoration-zinc-400' : 'text-foreground')}>
                            {owner.name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-bold px-1.5 py-0.5 rounded-md',
                              owner.isCompany
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            )}
                          >
                            {owner.isCompany ? 'Empresa' : 'Nuevo Asignatario'}
                          </span>
                          {isHidden && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                              Oculto / Histórico
                            </span>
                          )}
                        </div>
                        {owner.notes && (
                          <span className="text-[10px] text-muted-foreground truncate block max-w-xs mt-0.5">
                            {owner.notes}
                          </span>
                        )}
                      </td>

                      {/* RUT Oficial */}
                      <td className="py-3.5 px-4">
                        {hasRut ? (
                          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{owner.rut}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingOwner(owner)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                            title="Haz clic para ingresar el RUT oficial"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>Ingresar RUT</span>
                          </button>
                        )}
                      </td>

                      {/* Cantidad de Inmuebles */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingPropertiesOwner(owner.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
                          title="Ver detalle de departamentos / unidades"
                        >
                          <span>{owner.propertiesCount} {owner.propertiesCount === 1 ? 'unidad' : 'unidades'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>

                      {/* Edificios */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {owner.buildings.slice(0, 3).map((b) => (
                            <span
                              key={b}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md font-medium text-muted-foreground"
                            >
                              {b}
                            </span>
                          ))}
                          {owner.buildings.length > 3 && (
                            <span
                              onClick={() => setViewingPropertiesOwner(owner.name)}
                              className="text-[10px] bg-muted/80 text-primary font-bold px-1.5 py-0.5 rounded-md cursor-pointer hover:underline"
                            >
                              +{owner.buildings.length - 3} más
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Empresa Asociada */}
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">
                        {owner.companyName ? (
                          <div>
                            <span className="text-foreground font-semibold">{owner.companyName}</span>
                            {owner.companyCode && (
                              <span className="text-[10px] text-muted-foreground ml-1">
                                ({owner.companyCode})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {owner.phone || owner.email ? (
                          <div className="space-y-0.5 text-[11px]">
                            {owner.phone && <div className="text-foreground">{owner.phone}</div>}
                            {owner.email && <div className="text-muted-foreground truncate max-w-[150px]">{owner.email}</div>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 text-[11px]">Sin contacto</span>
                        )}
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingOwner(owner)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all cursor-pointer shadow-2xs"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar RUT</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de RUT y Datos */}
      {editingOwner && (
        <OwnerEditModal
          owner={editingOwner}
          onClose={() => setEditingOwner(null)}
          onSaved={handleOwnerSaved}
        />
      )}

      {/* Modal de Lista de Inmuebles */}
      {viewingPropertiesOwner && (
        <OwnerPropertiesModal
          ownerName={viewingPropertiesOwner}
          onClose={() => setViewingPropertiesOwner(null)}
        />
      )}
    </div>
  )
}
