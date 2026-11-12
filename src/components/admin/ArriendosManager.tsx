'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
  SlidersHorizontal,
  X,
  RotateCcw,
  Download,
  DollarSign,
  ShieldAlert,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { ContractEditModal, ContractItem } from './ContractEditModal'
import { deleteContractRecord } from '@/app/admin/arriendos/actions'

interface ArriendosManagerProps {
  initialContracts: ContractItem[]
  companies: { id: string; code: string; name: string }[]
  buildings: string[]
  isSuperadmin: boolean
}

export interface ColumnDefinition {
  key: string
  label: string
  group: 'Inmueble' | 'Arrendatario' | 'Contrato' | 'Valores' | 'Estados'
  defaultVisible: boolean
}

export const ALL_COLUMNS: ColumnDefinition[] = [
  // Inmueble
  { key: 'inmueble', label: 'Inmueble / Unidad', group: 'Inmueble', defaultVisible: true },
  { key: 'tipo', label: 'Tipo Inmueble', group: 'Inmueble', defaultVisible: true },
  { key: 'rol', label: 'ROL', group: 'Inmueble', defaultVisible: false },
  { key: 'bodega', label: 'Bodega', group: 'Inmueble', defaultVisible: false },
  { key: 'estacionamiento', label: 'Estacionamiento', group: 'Inmueble', defaultVisible: false },
  { key: 'empresa', label: 'Empresa', group: 'Inmueble', defaultVisible: true },

  // Arrendatario
  { key: 'arrendatario', label: 'Arrendatario / Titular', group: 'Arrendatario', defaultVisible: true },
  { key: 'rut', label: 'RUT Arrendatario', group: 'Arrendatario', defaultVisible: false },
  { key: 'telefono', label: 'Teléfono', group: 'Arrendatario', defaultVisible: true },
  { key: 'correo', label: 'Correo Electrónico', group: 'Arrendatario', defaultVisible: true },
  { key: 'aval', label: 'Aval / Contacto Adicional', group: 'Arrendatario', defaultVisible: false },

  // Contrato
  { key: 'fechaContrato', label: 'Fecha Contrato', group: 'Contrato', defaultVisible: true },
  { key: 'renovacion', label: 'Período Renovación', group: 'Contrato', defaultVisible: false },

  // Valores Financieros
  { key: 'arriendoBase', label: 'Arriendo Base', group: 'Valores', defaultVisible: true },
  { key: 'reajustePorc', label: '% Reajuste', group: 'Valores', defaultVisible: false },
  { key: 'reajusteMonto', label: 'Reajuste ($)', group: 'Valores', defaultVisible: false },
  { key: 'valorT', label: 'Valor T (Reajustado)', group: 'Valores', defaultVisible: true },
  { key: 'total', label: 'Total a Pagar ($)', group: 'Valores', defaultVisible: true },
  { key: 'saldoPendiente', label: 'Saldo Pendiente', group: 'Valores', defaultVisible: true },
  { key: 'garantia', label: 'Garantía', group: 'Valores', defaultVisible: false },
  { key: 'gastosComunes', label: 'Gastos Comunes', group: 'Valores', defaultVisible: false },
  { key: 'arriendoAnterior', label: 'Arriendo Anterior', group: 'Valores', defaultVisible: false },

  // Estados & Acciones
  { key: 'estadoPropiedad', label: 'Estado Propiedad', group: 'Estados', defaultVisible: true },
  { key: 'estadoPago', label: 'Estado de Pago', group: 'Estados', defaultVisible: true },
  { key: 'acciones', label: 'Acciones', group: 'Estados', defaultVisible: true },
]

const STORAGE_KEY = 'nys_arriendos_visible_columns_v3'

function getDefaultVisibleColumns(): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  ALL_COLUMNS.forEach((col) => {
    map[col.key] = col.defaultVisible
  })
  return map
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

  // Columnas visibles personalizables
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(getDefaultVisibleColumns)
  const [showColumnModal, setShowColumnModal] = useState(false)

  // Cargar preferencias guardadas en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setVisibleColumns((prev) => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore
    }
  }, [])

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore
      }
      return updated
    })
  }

  function resetColumns() {
    const defaults = getDefaultVisibleColumns()
    setVisibleColumns(defaults)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    } catch {
      // Ignore
    }
  }

  function setAllColumns(visible: boolean) {
    const updated: Record<string, boolean> = {}
    ALL_COLUMNS.forEach((c) => {
      // Mantener siempre acciones si se desmarca todo
      if (!visible && c.key === 'acciones') {
        updated[c.key] = true
      } else {
        updated[c.key] = visible
      }
    })
    setVisibleColumns(updated)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Ignore
    }
  }

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('TODAS')
  const [filterBuilding, setFilterBuilding] = useState('TODOS')
  const [filterType, setFilterType] = useState('TODOS')
  const [filterStatus, setFilterStatus] = useState('TODOS')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('TODOS')
  const [filterIncompleteOnly, setFilterIncompleteOnly] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Mensajes
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showMessage(text: string, type: 'success' | 'error') {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // Opciones de filtro dependientes (en cascada)
  const availableBuildings = useMemo(() => {
    let pool = contracts
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((c) => c.company?.code === filterCompany)
    }
    const bSet = new Set<string>()
    pool.forEach((c) => {
      if (c.building) bSet.add(c.building)
    })
    return Array.from(bSet).sort()
  }, [contracts, filterCompany])

  const availableTypes = useMemo(() => {
    let pool = contracts
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((c) => c.company?.code === filterCompany)
    }
    if (filterBuilding !== 'TODOS') {
      pool = pool.filter((c) => c.building === filterBuilding)
    }
    const tSet = new Set<string>()
    pool.forEach((c) => {
      if (c.propertyType) tSet.add(c.propertyType)
    })
    return Array.from(tSet).sort()
  }, [contracts, filterCompany, filterBuilding])

  const availableStatuses = useMemo(() => {
    let pool = contracts
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((c) => c.company?.code === filterCompany)
    }
    if (filterBuilding !== 'TODOS') {
      pool = pool.filter((c) => c.building === filterBuilding)
    }
    const sSet = new Set<string>()
    pool.forEach((c) => {
      if (c.status) sSet.add(c.status)
    })
    return Array.from(sSet).sort()
  }, [contracts, filterCompany, filterBuilding])

  function handleCompanyChange(newCompany: string) {
    setFilterCompany(newCompany)
    setCurrentPage(1)
    if (newCompany !== 'TODAS') {
      const validForNewCompany = new Set(
        contracts.filter((c) => c.company?.code === newCompany).map((c) => c.building)
      )
      if (filterBuilding !== 'TODOS' && !validForNewCompany.has(filterBuilding)) {
        setFilterBuilding('TODOS')
      }
    }
  }

  function handleBuildingChange(newBuilding: string) {
    setFilterBuilding(newBuilding)
    setCurrentPage(1)
    if (newBuilding !== 'TODOS') {
      const validTypes = new Set(
        contracts.filter((c) => c.building === newBuilding).map((c) => c.propertyType)
      )
      if (filterType !== 'TODOS' && !validTypes.has(filterType)) {
        setFilterType('TODOS')
      }
    }
  }

  // Comprobar si un contrato tiene campos vacíos / incompletos
  function isContractIncomplete(c: ContractItem): boolean {
    if (c.status === 'Disponible' || c.status === 'Vendido') return false
    return (
      !c.tenantRut ||
      !c.tenantPhone ||
      !c.contractDate ||
      !c.rol ||
      c.tenantName === 'Sin Asignar' ||
      c.tenantName === 'POR ASIGNAR'
    )
  }

  // Filtrado reactivo en cliente
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (filterCompany !== 'TODAS' && c.company?.code !== filterCompany) return false
      if (filterBuilding !== 'TODOS' && c.building !== filterBuilding) return false
      if (filterType !== 'TODOS' && c.propertyType !== filterType) return false
      if (filterStatus !== 'TODOS' && c.status !== filterStatus) return false
      if (filterPaymentStatus !== 'TODOS') {
        const pStatus = c.latestVoucher?.paymentStatus || (c.status === 'Disponible' ? 'Disponible' : 'Pendiente')
        if (pStatus !== filterPaymentStatus) return false
      }

      if (filterIncompleteOnly && !isContractIncomplete(c)) return false

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchTenant = c.tenantName?.toLowerCase().includes(q)
        const matchRut = c.tenantRut?.toLowerCase().includes(q)
        const matchBuilding = c.building?.toLowerCase().includes(q)
        const matchUnit = c.unitNumber?.toLowerCase().includes(q)
        const matchRol = c.rol?.toLowerCase().includes(q)
        const matchPhone = c.tenantPhone?.toLowerCase().includes(q)
        const matchEmail = c.tenantEmail?.toLowerCase().includes(q)
        const matchAssignee = c.newAssignee?.toLowerCase().includes(q)

        if (
          !matchTenant &&
          !matchRut &&
          !matchBuilding &&
          !matchUnit &&
          !matchRol &&
          !matchPhone &&
          !matchEmail &&
          !matchAssignee
        ) {
          return false
        }
      }

      return true
    })
  }, [
    contracts,
    filterCompany,
    filterBuilding,
    filterType,
    filterStatus,
    filterPaymentStatus,
    filterIncompleteOnly,
    searchTerm,
  ])

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

  // Exportar a Excel
  function exportToExcel() {
    const exportData = filteredContracts.map((c) => {
      const totalAmount = c.latestVoucher?.totalMonth ?? c.totalRent
      const pendingBalance = c.latestVoucher?.pendingBalance ?? 0
      const paymentStatus = c.latestVoucher?.paymentStatus ?? (c.status === 'Disponible' ? 'Disponible' : 'Pendiente')

      return {
        'EMPRESA': c.company?.code || '',
        'NOMBRE EMPRESA': c.company?.name || '',
        'ASIGNATARIO': c.newAssignee || '',
        'EDIFICIO': c.building,
        'N° UNIDAD': c.unitNumber,
        'TIPO INMUEBLE': c.propertyType,
        'ROL': c.rol || '',
        'BODEGA': c.storageNumber || '',
        'ESTACIONAMIENTO': c.parkingNumber || '',
        'ARRENDATARIO': c.tenantName,
        'RUT': c.tenantRut || '',
        'TELÉFONO': c.tenantPhone || '',
        'CORREO': c.tenantEmail || '',
        'FECHA CONTRATO': c.contractDate || '',
        'RENOVACIÓN': c.renewalPeriod || '',
        'ARRIENDO BASE': c.baseRent,
        '% REAJUSTE': c.adjustmentPercentage,
        'REAJUSTE $': c.adjustmentAmount,
        'VALOR T': c.totalRent,
        'TOTAL A PAGAR': totalAmount,
        'SALDO PENDIENTE': pendingBalance,
        'ESTADO PROPIEDAD': c.status,
        'ESTADO DE PAGO': paymentStatus,
        'GARANTÍA': c.guaranteeAmount || 0,
        'GASTOS COMUNES CARGO': c.expensesCharge || 0,
        'GASTOS COMUNES ABONO': c.expensesPayment || 0,
        'ARRIENDO ANTERIOR': c.previousRent || 0,
        'AVAL / CONTACTO': c.otherContactInfo || '',
        'RELACIÓN AVAL': c.guarantorRelation || '',
        'TELÉFONO AVAL': c.guarantorPhone || '',
        'CORREO AVAL': c.guarantorEmail || '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro Arriendos')
    const fileName = `Maestro_Arriendos_NYS_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    showMessage(`Excel exportado exitosamente (${exportData.length} registros)`, 'success')
  }

  const activeColumnsCount = Object.values(visibleColumns).filter(Boolean).length

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
            Visualiza y administra de forma personalizada los contratos, arrendatarios, valores consolidados, Valor T y totales a pagar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Personalizar Columnas */}
          <button
            type="button"
            onClick={() => setShowColumnModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:bg-muted/60 text-foreground font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
            title="Seleccionar y personalizar columnas visibles"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Columnas Visibles</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary">
              {activeColumnsCount}
            </span>
          </button>

          {/* Botón Exportar Excel */}
          <button
            type="button"
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
            title="Descargar tabla en formato Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {/* Botón Nueva Propiedad */}
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Propiedad</span>
          </button>
        </div>
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
          {/* Buscador reactivo */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por arrendatario, RUT, depto, edificio, rol, fono, correo..."
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

        {/* Selectores de Filtro en Cascada */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border">
          {/* Empresa */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Empresa</label>
            <select
              value={filterCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
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

          {/* Edificio dependiente */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Edificio</label>
            <select
              value={filterBuilding}
              onChange={(e) => handleBuildingChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">
                {filterCompany === 'TODAS'
                  ? 'Todos los Edificios'
                  : `Edificios (${availableBuildings.length})`}
              </option>
              {availableBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Inmueble dependiente */}
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
              <option value="TODOS">Todos los Tipos ({availableTypes.length})</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Propiedad */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Estado Propiedad</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los Estados ({availableStatuses.length})</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Recaudación / Pago */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Estado de Pago</label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => {
                setFilterPaymentStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">Todos los Pagos</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Saldo a Favor">Saldo a Favor</option>
              <option value="Disponible">Disponible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Maestra Personalizable */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <span>
              Mostrando <span className="font-bold text-foreground">{filteredContracts.length}</span> propiedades
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px]">
              {activeColumnsCount} de {ALL_COLUMNS.length} columnas visibles
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowColumnModal(true)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Ajustar columnas</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Por pág:</span>
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[11px]">
              <tr>
                {visibleColumns.inmueble && <th className="py-3 px-4">Inmueble / Unidad</th>}
                {visibleColumns.tipo && <th className="py-3 px-3">Tipo</th>}
                {visibleColumns.rol && <th className="py-3 px-3">ROL</th>}
                {visibleColumns.bodega && <th className="py-3 px-3">Bodega</th>}
                {visibleColumns.estacionamiento && <th className="py-3 px-3">Est.</th>}
                {visibleColumns.empresa && <th className="py-3 px-3">Empresa</th>}
                {visibleColumns.arrendatario && <th className="py-3 px-4">Arrendatario</th>}
                {visibleColumns.rut && <th className="py-3 px-3">RUT</th>}
                {visibleColumns.telefono && <th className="py-3 px-3">Teléfono</th>}
                {visibleColumns.correo && <th className="py-3 px-3">Correo</th>}
                {visibleColumns.aval && <th className="py-3 px-3">Aval / Contacto</th>}
                {visibleColumns.fechaContrato && <th className="py-3 px-3">Fecha Contrato</th>}
                {visibleColumns.renovacion && <th className="py-3 px-3">Renovación</th>}
                {visibleColumns.arriendoBase && <th className="py-3 px-3 text-right">Arriendo Base</th>}
                {visibleColumns.reajustePorc && <th className="py-3 px-3 text-right">% Reajuste</th>}
                {visibleColumns.reajusteMonto && <th className="py-3 px-3 text-right">Reajuste $</th>}
                {visibleColumns.valorT && (
                  <th className="py-3 px-3 text-right font-black text-foreground">
                    Valor T
                  </th>
                )}
                {visibleColumns.total && (
                  <th className="py-3 px-3 text-right font-black text-primary">
                    Total a Pagar
                  </th>
                )}
                {visibleColumns.saldoPendiente && (
                  <th className="py-3 px-3 text-right font-black">
                    Saldo Pendiente
                  </th>
                )}
                {visibleColumns.garantia && <th className="py-3 px-3 text-right">Garantía</th>}
                {visibleColumns.gastosComunes && <th className="py-3 px-3 text-right">G. Comunes</th>}
                {visibleColumns.arriendoAnterior && <th className="py-3 px-3 text-right">Arr. Anterior</th>}
                {visibleColumns.estadoPropiedad && <th className="py-3 px-3 text-center">Estado Inmueble</th>}
                {visibleColumns.estadoPago && <th className="py-3 px-3 text-center">Estado Pago</th>}
                {visibleColumns.acciones && <th className="py-3 px-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={activeColumnsCount || 1} className="py-12 text-center text-muted-foreground">
                    No se encontraron propiedades que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => {
                  const isIncomplete = isContractIncomplete(c)
                  const totalPayable = c.latestVoucher?.totalMonth ?? c.totalRent
                  const pendingBalance = c.latestVoucher?.pendingBalance ?? 0
                  const paymentStatus =
                    c.latestVoucher?.paymentStatus ??
                    (c.status === 'Disponible' ? 'Disponible' : 'Pendiente')

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Inmueble */}
                      {visibleColumns.inmueble && (
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <span>{c.building}</span>
                            <span className="text-primary font-black">N° {c.unitNumber}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-semibold">
                              {c.propertyType}
                            </span>
                            {c.rol && <span>ROL: {c.rol}</span>}
                          </div>
                        </td>
                      )}

                      {/* Tipo Inmueble */}
                      {visibleColumns.tipo && (
                        <td className="py-3 px-3 text-muted-foreground">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                            {c.propertyType}
                          </span>
                        </td>
                      )}

                      {/* ROL */}
                      {visibleColumns.rol && (
                        <td className="py-3 px-3 font-mono text-[11px] text-foreground">
                          {c.rol || <span className="text-muted-foreground text-[10px]">Sin ROL</span>}
                        </td>
                      )}

                      {/* Bodega */}
                      {visibleColumns.bodega && (
                        <td className="py-3 px-3 text-foreground font-medium">
                          {c.storageNumber ? `Bod. ${c.storageNumber}` : <span className="text-muted-foreground">-</span>}
                        </td>
                      )}

                      {/* Estacionamiento */}
                      {visibleColumns.estacionamiento && (
                        <td className="py-3 px-3 text-foreground font-medium">
                          {c.parkingNumber ? `Est. ${c.parkingNumber}` : <span className="text-muted-foreground">-</span>}
                        </td>
                      )}

                      {/* Empresa */}
                      {visibleColumns.empresa && (
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
                      )}

                      {/* Arrendatario */}
                      {visibleColumns.arrendatario && (
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
                          {c.tenantRut && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              RUT: {c.tenantRut}
                            </div>
                          )}
                        </td>
                      )}

                      {/* RUT */}
                      {visibleColumns.rut && (
                        <td className="py-3 px-3 font-mono text-[11px] text-foreground">
                          {c.tenantRut || <span className="text-muted-foreground text-[10px]">Sin RUT</span>}
                        </td>
                      )}

                      {/* Teléfono */}
                      {visibleColumns.telefono && (
                        <td className="py-3 px-3">
                          {c.tenantPhone ? (
                            <div className="flex items-center gap-1 text-[11px] text-foreground">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{c.tenantPhone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>
                      )}

                      {/* Correo */}
                      {visibleColumns.correo && (
                        <td className="py-3 px-3">
                          {c.tenantEmail ? (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-[150px]" title={c.tenantEmail}>
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{c.tenantEmail}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>
                      )}

                      {/* Aval / Contacto */}
                      {visibleColumns.aval && (
                        <td className="py-3 px-3 text-[11px]">
                          {c.otherContactInfo || c.guarantorRelation ? (
                            <div>
                              <div className="font-medium text-foreground">{c.otherContactInfo || 'Contacto'}</div>
                              <div className="text-[10px] text-muted-foreground">{c.guarantorRelation} {c.guarantorPhone}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">-</span>
                          )}
                        </td>
                      )}

                      {/* Fecha Contrato */}
                      {visibleColumns.fechaContrato && (
                        <td className="py-3 px-3 text-xs text-foreground font-medium">
                          {c.contractDate ? (
                            <span className="px-2 py-0.5 rounded bg-muted/60 font-mono text-[11px]">
                              {c.contractDate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">Sin fecha</span>
                          )}
                        </td>
                      )}

                      {/* Renovación */}
                      {visibleColumns.renovacion && (
                        <td className="py-3 px-3 text-[11px] text-muted-foreground">
                          {c.renewalPeriod || '1 AÑO'}
                        </td>
                      )}

                      {/* Arriendo Base */}
                      {visibleColumns.arriendoBase && (
                        <td className="py-3 px-3 text-right font-medium text-foreground">
                          ${c.baseRent.toLocaleString('es-CL')}
                        </td>
                      )}

                      {/* % Reajuste */}
                      {visibleColumns.reajustePorc && (
                        <td className="py-3 px-3 text-right text-[11px] text-muted-foreground">
                          {c.adjustmentPercentage ? `${(c.adjustmentPercentage * 100).toFixed(1)}%` : '-'}
                        </td>
                      )}

                      {/* Reajuste $ */}
                      {visibleColumns.reajusteMonto && (
                        <td className="py-3 px-3 text-right text-[11px] text-muted-foreground">
                          {c.adjustmentAmount ? `$${c.adjustmentAmount.toLocaleString('es-CL')}` : '-'}
                        </td>
                      )}

                      {/* Valor T */}
                      {visibleColumns.valorT && (
                        <td className="py-3 px-3 text-right font-bold text-foreground">
                          ${c.totalRent.toLocaleString('es-CL')}
                        </td>
                      )}

                      {/* Total a Pagar */}
                      {visibleColumns.total && (
                        <td className="py-3 px-3 text-right font-black text-primary text-sm">
                          ${totalPayable.toLocaleString('es-CL')}
                        </td>
                      )}

                      {/* Saldo Pendiente */}
                      {visibleColumns.saldoPendiente && (
                        <td className="py-3 px-3 text-right font-bold">
                          {pendingBalance === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$0</span>
                          ) : pendingBalance < 0 ? (
                            <span className="text-yellow-600 dark:text-yellow-400" title="Saldo a favor">
                              -${Math.abs(pendingBalance).toLocaleString('es-CL')}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400" title="Saldo pendiente de pago">
                              ${pendingBalance.toLocaleString('es-CL')}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Garantía */}
                      {visibleColumns.garantia && (
                        <td className="py-3 px-3 text-right text-[11px] text-muted-foreground">
                          {c.guaranteeAmount ? `$${c.guaranteeAmount.toLocaleString('es-CL')}` : '-'}
                        </td>
                      )}

                      {/* Gastos Comunes */}
                      {visibleColumns.gastosComunes && (
                        <td className="py-3 px-3 text-right text-[11px] text-muted-foreground">
                          {c.expensesCharge ? `$${c.expensesCharge.toLocaleString('es-CL')}` : '-'}
                        </td>
                      )}

                      {/* Arriendo Anterior */}
                      {visibleColumns.arriendoAnterior && (
                        <td className="py-3 px-3 text-right text-[11px] text-muted-foreground">
                          {c.previousRent ? `$${c.previousRent.toLocaleString('es-CL')}` : '-'}
                        </td>
                      )}

                      {/* Estado Propiedad */}
                      {visibleColumns.estadoPropiedad && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setEditingContract(c)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all hover:scale-105 cursor-pointer shadow-xs ${
                              c.status === 'Ocupado'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : c.status === 'Disponible'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                : c.status === 'Vendido'
                                ? 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                            title="Editar estado del inmueble"
                          >
                            <span>{c.status}</span>
                            <Edit className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        </td>
                      )}

                      {/* Estado de Pago */}
                      {visibleColumns.estadoPago && (
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                              paymentStatus === 'Pagado'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : paymentStatus === 'Pendiente'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : paymentStatus === 'Saldo a Favor'
                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                                : paymentStatus === 'Disponible'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                            }`}
                          >
                            {paymentStatus}
                          </span>
                        </td>
                      )}

                      {/* Acciones */}
                      {visibleColumns.acciones && (
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
                      )}
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

      {/* Modal Personalización de Columnas */}
      {showColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Personalizar Columnas de la Tabla
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <p className="text-muted-foreground text-xs">
                Selecciona los campos que deseas visualizar en la tabla del Maestro de Arriendos. Tu configuración se guardará automáticamente en este navegador.
              </p>

              {/* Botones de acción rápida */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border">
                <button
                  type="button"
                  onClick={() => setAllColumns(true)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold cursor-pointer"
                >
                  Seleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={() => setAllColumns(false)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold cursor-pointer"
                >
                  Deseleccionar Todas
                </button>
                <button
                  type="button"
                  onClick={resetColumns}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Predeterminado</span>
                </button>
              </div>

              {/* Agrupación de columnas */}
              {(['Inmueble', 'Arrendatario', 'Contrato', 'Valores', 'Estados'] as const).map((groupName) => {
                const groupCols = ALL_COLUMNS.filter((c) => c.group === groupName)

                return (
                  <div key={groupName} className="space-y-2">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-primary">
                      {groupName}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {groupCols.map((col) => {
                        const isChecked = !!visibleColumns[col.key]

                        return (
                          <label
                            key={col.key}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-primary/5 border-primary/30 text-foreground font-semibold'
                                : 'bg-background border-border text-muted-foreground hover:border-border/80'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumn(col.key)}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs truncate">{col.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{activeColumnsCount}</span> columnas activas
              </span>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Aplicar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
