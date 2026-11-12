'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Building,
  User,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Phone,
  Mail,
  Home,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { ContractEditModal, ContractItem } from './ContractEditModal'
import { deleteContractRecord } from '@/app/admin/arriendos/actions'

interface ArriendosManagerProps {
  initialContracts: ContractItem[]
  companies: { id: string; code: string; name: string }[]
  buildings: string[]
  isSuperadmin: boolean
}

export function ArriendosManager({
  initialContracts,
  companies,
  buildings,
  isSuperadmin,
}: ArriendosManagerProps) {
  const [contracts, setContracts] = useState<ContractItem[]>(initialContracts)
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('TODAS')
  const [filterBuilding, setFilterBuilding] = useState('TODOS')
  const [filterType, setFilterType] = useState('TODOS')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [filterIncompleteOnly, setFilterIncompleteOnly] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Mensaje de éxito/error
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // Comprobar si un contrato tiene campos vacíos / incompletos
  function isContractIncomplete(c: ContractItem): boolean {
    if (c.status === 'Disponible' || c.status === 'Vendido') return false
    return (
      !c.tenantRut ||
      !c.tenantPhone ||
      !c.contractDate ||
      !c.rol ||
      c.tenantName === 'Sin Asignar'
    )
  }

  // Filtrado reactivo en cliente
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (filterCompany !== 'TODAS' && c.company?.code !== filterCompany) return false
      if (filterBuilding !== 'TODOS' && c.building !== filterBuilding) return false
      if (filterType !== 'TODOS' && c.propertyType !== filterType) return false
      if (filterStatus !== 'TODOS' && c.status !== filterStatus) return false

      if (filterIncompleteOnly && !isContractIncomplete(c)) return false

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchTenant = c.tenantName?.toLowerCase().includes(q)
        const matchRut = c.tenantRut?.toLowerCase().includes(q)
        const matchBuilding = c.building?.toLowerCase().includes(q)
        const matchUnit = c.unitNumber?.toLowerCase().includes(q)
        const matchRol = c.rol?.toLowerCase().includes(q)
        const matchPhone = c.tenantPhone?.toLowerCase().includes(q)
        const matchAssignee = c.newAssignee?.toLowerCase().includes(q)

        if (!matchTenant && !matchRut && !matchBuilding && !matchUnit && !matchRol && !matchPhone && !matchAssignee) {
          return false
        }
      }

      return true
    })
  }, [contracts, filterCompany, filterBuilding, filterType, filterStatus, filterIncompleteOnly, searchTerm])

  // Paginación
  const totalPages = Math.ceil(filteredContracts.length / pageSize) || 1
  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredContracts.slice(start, start + pageSize)
  }, [filteredContracts, currentPage, pageSize])

  // KPIs
  const stats = useMemo(() => {
    const total = contracts.length
    const occupied = contracts.filter((c) => c.status === 'Ocupado').length
    const available = contracts.filter((c) => c.status === 'Disponible').length
    const incomplete = contracts.filter((c) => isContractIncomplete(c)).length
    const totalMonthlyIncome = contracts.reduce((sum, c) => sum + (c.totalRent || c.baseRent || 0), 0)

    return { total, occupied, available, incomplete, totalMonthlyIncome }
  }, [contracts])

  // Handlers
  function handleSaved(updated: any) {
    setContracts((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...updated }
        return copy
      } else {
        return [updated, ...prev]
      }
    })
    showMessage('Propiedad / Contrato guardado correctamente', 'success')
  }

  async function handleDelete(contractId: string, label: string) {
    if (!confirm(`¿Estás seguro de eliminar el registro de ${label}? Esta acción eliminará también sus liquidaciones asociadas.`)) {
      return
    }

    const res = await deleteContractRecord(contractId)
    if (res?.error) {
      showMessage(res.error, 'error')
    } else {
      setContracts((prev) => prev.filter((c) => c.id !== contractId))
      showMessage('Registro eliminado correctamente', 'success')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Alerta de notificación */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Maestro de Arriendos e Inmuebles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los datos maestros de cada propiedad, contratos, arrendatarios, reajustes y fechas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Propiedad / Contrato</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground font-medium">Total Inmuebles</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{stats.occupied}</div>
            <div className="text-xs text-muted-foreground font-medium">Ocupados</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground">{stats.available}</div>
            <div className="text-xs text-muted-foreground font-medium">Disponibles</div>
          </div>
        </div>

        <div 
          onClick={() => setFilterIncompleteOnly(!filterIncompleteOnly)}
          className={`bg-card border p-4 rounded-2xl shadow-sm flex items-center gap-3.5 cursor-pointer transition-all ${
            filterIncompleteOnly ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/50'
          }`}
          title="Haz clic para filtrar solo registros incompletos"
        >
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.incomplete}</div>
            <div className="text-xs text-muted-foreground font-medium">Con Datos Faltantes</div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-foreground">
              ${stats.totalMonthlyIncome.toLocaleString('es-CL')}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Renta Mensual Total</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador de texto reactivo */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por arrendatario, RUT, depto, edificio, rol, teléfono..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Toggle Solo Incompletos */}
          <button
            type="button"
            onClick={() => {
              setFilterIncompleteOnly(!filterIncompleteOnly)
              setCurrentPage(1)
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              filterIncompleteOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Faltan Datos ({stats.incomplete})</span>
          </button>
        </div>

        {/* Selectores de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
          {/* Empresa */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Empresa</label>
            <select
              value={filterCompany}
              onChange={(e) => {
                setFilterCompany(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODAS">Todas las Empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edificio */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Edificio</label>
            <select
              value={filterBuilding}
              onChange={(e) => {
                setFilterBuilding(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los Edificios</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Inmueble */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Tipo Inmueble</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="Departamento">Departamento</option>
              <option value="Local Comercial">Local Comercial</option>
              <option value="Oficina">Oficina</option>
              <option value="Bodega">Bodega</option>
              <option value="Estacionamiento">Estacionamiento</option>
              <option value="Casas">Casas</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Ocupado">Ocupado</option>
              <option value="Disponible">Disponible</option>
              <option value="Vendido">Vendido</option>
              <option value="En Retiro">En Retiro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Maestra */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground">
            Mostrando <span className="font-bold text-foreground">{filteredContracts.length}</span> propiedades encontradas
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="py-1 px-2 text-xs bg-background border border-border rounded-lg text-foreground"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[11px]">
              <tr>
                <th className="py-3 px-4">Inmueble / Unidad</th>
                <th className="py-3 px-3">Empresa</th>
                <th className="py-3 px-4">Arrendatario / Titular</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3">Contrato / Renovación</th>
                <th className="py-3 px-3 text-right">Arriendo Base</th>
                <th className="py-3 px-3 text-right">Total ($)</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No se encontraron propiedades que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => {
                  const isIncomplete = isContractIncomplete(c)

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Inmueble */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <span>{c.building}</span>
                          <span className="text-primary font-black">N° {c.unitNumber}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold">{c.propertyType}</span>
                          {c.rol ? (
                            <span>ROL: {c.rol}</span>
                          ) : (
                            <span className="text-amber-500 font-medium text-[10px]">Sin ROL</span>
                          )}
                          {c.storageNumber && <span>Bod: {c.storageNumber}</span>}
                          {c.parkingNumber && <span>Est: {c.parkingNumber}</span>}
                        </div>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-muted text-foreground border border-border">
                          {c.company?.code || 'JR'}
                        </span>
                        {c.newAssignee && (
                          <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[120px]" title={c.newAssignee}>
                            {c.newAssignee}
                          </div>
                        )}
                      </td>

                      {/* Arrendatario */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <span>{c.tenantName}</span>
                          {isIncomplete && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                              title="Ficha con datos incompletos"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {c.tenantRut ? (
                            <span>RUT: {c.tenantRut}</span>
                          ) : (
                            <span className="text-amber-500 text-[10px] font-medium">Sin RUT</span>
                          )}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {c.tenantPhone ? (
                            <div className="flex items-center gap-1 text-[11px] text-foreground">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{c.tenantPhone}</span>
                            </div>
                          ) : (
                            <span className="text-amber-500 text-[10px] block">Sin fono</span>
                          )}

                          {c.tenantEmail && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-[140px]" title={c.tenantEmail}>
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{c.tenantEmail}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Contrato / Renovación */}
                      <td className="py-3 px-3">
                        <div className="text-xs text-foreground font-medium">
                          {c.contractDate || <span className="text-muted-foreground">Sin fecha</span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {c.renewalPeriod || '1 AÑO'}
                        </div>
                      </td>

                      {/* Arriendo Base */}
                      <td className="py-3 px-3 text-right font-medium text-foreground">
                        ${c.baseRent.toLocaleString('es-CL')}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-black text-primary text-sm">
                        ${c.totalRent.toLocaleString('es-CL')}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            c.status === 'Ocupado'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : c.status === 'Disponible'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : c.status === 'Vendido'
                              ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingContract(c)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Editar ficha completa de la propiedad"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {isSuperadmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(c.id, `${c.building} ${c.unitNumber}`)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar propiedad"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/10 text-xs">
            <span className="text-muted-foreground">
              Página <span className="font-bold text-foreground">{currentPage}</span> de <span className="font-bold text-foreground">{totalPages}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-2 font-bold text-foreground">{currentPage}</div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {(editingContract || isCreating) && (
        <ContractEditModal
          contract={editingContract}
          companies={companies}
          buildings={buildings}
          onClose={() => {
            setEditingContract(null)
            setIsCreating(false)
          }}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}
