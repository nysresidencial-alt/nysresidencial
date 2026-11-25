'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  Download,
  Building,
  User,
  Phone,
  Mail,
  RefreshCw,
  Edit,
  ExternalLink,
  ChevronDown,
  X,
  Sparkles,
  Check,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
} from 'lucide-react'
import {
  analyzeContractRenewal,
  formatDisplayDate,
  toInputDate,
  parseContractDate,
  RenewalAnalysis,
} from '@/lib/contract-renewals'
import {
  updateContractRenewalDates,
  renewContractPeriod,
  toggleContractAutoRenewal,
} from '@/app/admin/contratos/actions'
import { ContractEditModal, ContractItem } from './ContractEditModal'

interface ContratosRenovacionesProps {
  initialContracts: ContractItem[]
  companies: { id: string; code: string; name: string }[]
  buildings: string[]
  isSuperadmin: boolean
}

const RENEWAL_OPTIONS = [
  '1 AÑO',
  '6 MESES',
  '1 AÑO Y 10 DÍAS',
  '1 AÑO Y 5 DÍAS',
  '1 AÑO Y 22 DÍAS',
  '2 AÑOS',
  'INDEFINIDO',
]

export function ContratosRenovacionesManager({
  initialContracts,
  companies,
  buildings,
  isSuperadmin,
}: ContratosRenovacionesProps) {
  const [contracts, setContracts] = useState<ContractItem[]>(initialContracts)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<
    'TODOS' | 'POR_VENCER' | 'VENCIDOS' | 'INCOMPLETOS' | 'VIGENTES' | 'INDEFINIDO'
  >('TODOS')
  const [companyFilter, setCompanyFilter] = useState<string>('TODOS')
  const [buildingFilter, setBuildingFilter] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Control de dropdowns de filtro
  const [openDropdown, setOpenDropdown] = useState<'company' | 'building' | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Estados de guardado en fila individual (feedback visual instantáneo)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [savedRowId, setSavedRowId] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; msg: string } | null>(null)

  // Mensaje general
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Modal de Ficha completa
  const [editingContract, setEditingContract] = useState<ContractItem | null>(null)

  // Cierra dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-cerrar mensaje de éxito
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Contratos con su análisis de renovación precalculado
  const contractsWithAnalysis = useMemo(() => {
    return contracts.map((c) => {
      const analysis = analyzeContractRenewal(
        c.contractDate,
        c.renewalPeriod,
        new Date(),
        c.autoRenewal ?? true
      )
      return {
        ...c,
        analysis,
      }
    })
  }, [contracts])

  // KPIs Globales (calculados sobre la cartera ocupada total)
  const stats = useMemo(() => {
    const total = contractsWithAnalysis.length
    const vencidos = contractsWithAnalysis.filter((c) => c.analysis.status === 'VENCIDO').length
    const porVencer = contractsWithAnalysis.filter((c) => c.analysis.status === 'POR_VENCER').length
    const vigentes = contractsWithAnalysis.filter((c) => c.analysis.status === 'VIGENTE').length
    const incompletos = contractsWithAnalysis.filter((c) => c.analysis.status === 'INCOMPLETO').length
    const indefinidos = contractsWithAnalysis.filter((c) => c.analysis.status === 'INDEFINIDO').length

    return { total, vencidos, porVencer, vigentes, incompletos, indefinidos }
  }, [contractsWithAnalysis])

  // Filtrado reactivo de la tabla
  const filteredContracts = useMemo(() => {
    return contractsWithAnalysis
      .filter((c) => {
        // Filtro por Estado de Renovación
        if (statusFilter === 'VENCIDOS' && c.analysis.status !== 'VENCIDO') return false
        if (statusFilter === 'POR_VENCER' && c.analysis.status !== 'POR_VENCER') return false
        if (statusFilter === 'VIGENTES' && c.analysis.status !== 'VIGENTE') return false
        if (statusFilter === 'INCOMPLETOS' && c.analysis.status !== 'INCOMPLETO') return false
        if (statusFilter === 'INDEFINIDO' && c.analysis.status !== 'INDEFINIDO') return false

        // Filtro por Empresa
        if (companyFilter !== 'TODOS') {
          const cCode = (c.company?.code || '').toUpperCase()
          const cName = (c.company?.name || '').toUpperCase()
          if (cCode !== companyFilter.toUpperCase() && cName !== companyFilter.toUpperCase()) {
            return false
          }
        }

        // Filtro por Edificio
        if (buildingFilter !== 'TODOS') {
          if (c.building.toUpperCase() !== buildingFilter.toUpperCase()) {
            return false
          }
        }

        // Búsqueda textual amplia
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim()
          const matchTenant = c.tenantName?.toLowerCase().includes(q)
          const matchRut = c.tenantRut?.toLowerCase().includes(q)
          const matchUnit = `${c.building} ${c.unitNumber}`.toLowerCase().includes(q)
          const matchAssignee = c.newAssignee?.toLowerCase().includes(q)
          if (!matchTenant && !matchRut && !matchUnit && !matchAssignee) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // Orden de prioridad:
        // 1. Incompletos primero (para que el usuario los complete) o Vencidos
        const getPriority = (st: string) => {
          if (st === 'INCOMPLETO') return 0
          if (st === 'VENCIDO') return 1
          if (st === 'POR_VENCER') return 2
          if (st === 'VIGENTE') return 3
          return 4
        }
        const aPri = getPriority(a.analysis.status)
        const bPri = getPriority(b.analysis.status)
        if (aPri !== bPri) return aPri - bPri

        // Días restantes ascendente
        if (a.analysis.daysRemaining !== null && b.analysis.daysRemaining !== null) {
          return a.analysis.daysRemaining - b.analysis.daysRemaining
        }

        return a.building.localeCompare(b.building)
      })
  }, [contractsWithAnalysis, statusFilter, companyFilter, buildingFilter, searchTerm])

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredContracts.length / pageSize) || 1
  const paginatedContracts = useMemo(() => {
    if (pageSize === -1) return filteredContracts
    const start = (currentPage - 1) * pageSize
    return filteredContracts.slice(start, start + pageSize)
  }, [filteredContracts, currentPage, pageSize])

  // =========================================================================
  // HANDLERS DE EDICIÓN RÁPIDA EN LÍNEA
  // =========================================================================

  async function handleDateChange(contractId: string, newDate: string) {
    setSavingRowId(contractId)
    setRowError(null)

    const res = await updateContractRenewalDates(contractId, { contractDate: newDate })
    setSavingRowId(null)

    if (res.error) {
      setRowError({ id: contractId, msg: res.error })
    } else if (res.contract) {
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, ...res.contract } : c))
      )
      setSavedRowId(contractId)
      setTimeout(() => setSavedRowId(null), 2500)
    }
  }

  async function handlePeriodChange(contractId: string, newPeriod: string) {
    setSavingRowId(contractId)
    setRowError(null)

    const res = await updateContractRenewalDates(contractId, { renewalPeriod: newPeriod })
    setSavingRowId(null)

    if (res.error) {
      setRowError({ id: contractId, msg: res.error })
    } else if (res.contract) {
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, ...res.contract } : c))
      )
      setSavedRowId(contractId)
      setTimeout(() => setSavedRowId(null), 2500)
    }
  }

  async function handleToggleAutoRenewal(contractId: string, currentAutoRenewal: boolean) {
    const nextVal = !currentAutoRenewal
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, autoRenewal: nextVal } : c))
    )
    setSavingRowId(contractId)
    setRowError(null)

    const res = await toggleContractAutoRenewal(contractId, nextVal)
    setSavingRowId(null)

    if (res.error) {
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, autoRenewal: currentAutoRenewal } : c))
      )
      setRowError({ id: contractId, msg: res.error })
    } else {
      setSavedRowId(contractId)
      setTimeout(() => setSavedRowId(null), 2500)
    }
  }

  async function handleQuickRenew(c: typeof contractsWithAnalysis[0]) {
    const analysis = c.analysis
    const promptMsg = `¿Deseas prorrogar el contrato de ${c.building} ${c.unitNumber} (${c.tenantName})?\n\nPeríodo configurado: ${c.renewalPeriod || '1 AÑO'}\nSe actualizará la fecha base del contrato y se dejará registro en el historial de la propiedad.`

    if (!window.confirm(promptMsg)) return

    setSavingRowId(c.id)
    const res = await renewContractPeriod(c.id)
    setSavingRowId(null)

    if (res.error) {
      setMessage({ text: res.error, type: 'error' })
    } else if (res.contract) {
      setContracts((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, ...res.contract } : item))
      )
      setMessage({
        text: `¡Contrato de ${c.building} ${c.unitNumber} renovado con éxito! Nueva fecha de inicio: ${res.newStartDate}.`,
        type: 'success',
      })
    }
  }

  // URL para exportación a Excel
  const excelExportUrl = `/api/admin/contratos/export?building=${buildingFilter}&company=${companyFilter}&status=${statusFilter}`

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER PRINCIPAL */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Control de Contratos y Renovaciones
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Seguimiento de vigencias y fechas de prórroga para los{' '}
                <span className="text-foreground font-bold">{stats.total} arriendos activos</span> del portafolio.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Exportar Excel */}
          <a
            href={excelExportUrl}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Descargar planilla Excel de vencimientos"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Control Excel</span>
          </a>

          {/* Enlace a Vista Propiedades */}
          <Link
            href="/admin/arriendos"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-all shadow-2xs"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Ver Inventario</span>
          </Link>
        </div>
      </div>

      {/* Mensaje de alerta / feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TARJETAS KPI RESUMEN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Vencidos */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'VENCIDOS' ? 'TODOS' : 'VENCIDOS')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'VENCIDOS'
              ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30'
              : 'bg-card border-border hover:border-rose-500/40 hover:bg-rose-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Plazo Fijo Vencido
            </span>
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats.vencidos}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Sin prórroga que expiraron</p>
        </button>

        {/* Por Vencer */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'POR_VENCER' ? 'TODOS' : 'POR_VENCER')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'POR_VENCER'
              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-card border-border hover:border-amber-500/40 hover:bg-amber-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Por Vencer (≤ 35d)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.porVencer}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">En ventana de preaviso de 35 días</p>
        </button>

        {/* Datos Incompletos */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'INCOMPLETOS' ? 'TODOS' : 'INCOMPLETOS')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'INCOMPLETOS'
              ? 'bg-orange-500/15 border-orange-500 ring-2 ring-orange-500/30'
              : 'bg-card border-border hover:border-orange-500/40 hover:bg-orange-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Datos Incompletos
            </span>
            <HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">
            {stats.incompletos}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Falta fecha o período en ficha</p>
        </button>

        {/* Vigentes */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter(statusFilter === 'VIGENTES' ? 'TODOS' : 'VIGENTES')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'VIGENTES'
              ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-card border-border hover:border-emerald-500/40 hover:bg-emerald-500/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Vigentes (&gt; 35d)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.vigentes}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Ciclo activo con más de 35 días</p>
        </button>

        {/* Indefinidos o Total */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('TODOS')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'TODOS'
              ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
              : 'bg-card border-border hover:border-primary/40 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
              Total Monitoreados
            </span>
            <Building className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground mt-2">
            {stats.total}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Solo contratos ocupados</p>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE FILTROS Y BÚSQUEDA */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3" ref={filterRef}>
        {/* Barra de búsqueda superior */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Buscar por arrendatario, RUT, edificio, N° unidad o propietario..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros segmentados */}
        <div className="flex items-center gap-2 flex-wrap justify-between pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pestañas de estado */}
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80">
              {[
                { id: 'TODOS', label: 'Todos', count: stats.total },
                { id: 'VENCIDOS', label: 'Vencidos', count: stats.vencidos, color: 'text-rose-600' },
                { id: 'POR_VENCER', label: 'Por Vencer', count: stats.porVencer, color: 'text-amber-600' },
                { id: 'INCOMPLETOS', label: 'Incompletos', count: stats.incompletos, color: 'text-orange-600' },
                { id: 'VIGENTES', label: 'Vigentes', count: stats.vigentes, color: 'text-emerald-600' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id as any)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? 'bg-card text-foreground shadow-xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      statusFilter === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Selector Empresa */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  companyFilter !== 'TODOS'
                    ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                    : 'bg-background border-border hover:bg-muted text-foreground'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{companyFilter === 'TODOS' ? 'Empresa: Todas' : `Empresa: ${companyFilter}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {openDropdown === 'company' && (
                <div className="absolute left-0 top-full mt-1.5 w-60 p-1.5 bg-card border border-border rounded-xl shadow-2xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyFilter('TODOS')
                      setOpenDropdown(null)
                      setCurrentPage(1)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      companyFilter === 'TODOS' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    Todas las Empresas
                  </button>
                  {companies.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => {
                        setCompanyFilter(comp.code || comp.name)
                        setOpenDropdown(null)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        companyFilter === (comp.code || comp.name)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {comp.name} {comp.code ? `(${comp.code})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selector Edificio */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'building' ? null : 'building')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  buildingFilter !== 'TODOS'
                    ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                    : 'bg-background border-border hover:bg-muted text-foreground'
                }`}
              >
                <span>{buildingFilter === 'TODOS' ? 'Edificio: Todos' : `Edificio: ${buildingFilter}`}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {openDropdown === 'building' && (
                <div className="absolute left-0 top-full mt-1.5 w-56 p-1.5 bg-card border border-border rounded-xl shadow-2xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingFilter('TODOS')
                      setOpenDropdown(null)
                      setCurrentPage(1)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      buildingFilter === 'TODOS' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    Todos los Edificios
                  </button>
                  {buildings.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setBuildingFilter(b)
                        setOpenDropdown(null)
                        setCurrentPage(1)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        buildingFilter === b ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(statusFilter !== 'TODOS' || companyFilter !== 'TODOS' || buildingFilter !== 'TODOS' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('TODOS')
                setCompanyFilter('TODOS')
                setBuildingFilter('TODOS')
                setSearchTerm('')
                setCurrentPage(1)
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA PRINCIPAL DE VENCIMIENTOS Y EDICIÓN EN VIVO */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4 text-center">Estado Vigencia</th>
                <th className="py-3.5 px-4">Propiedad / Unidad</th>
                <th className="py-3.5 px-4">Arrendatario Titular</th>
                <th className="py-3.5 px-4 min-w-[170px]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Fecha Contrato</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[170px]">
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    <span>Período Renovación</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center min-w-[140px]">
                  <div className="flex items-center justify-center gap-1" title="Si está activo, el contrato se prorroga automáticamente por cada período sucesivo y avisa 35 días antes">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Prórroga Auto.</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 min-w-[160px]">Próximo Vencimiento</th>
                <th className="py-3.5 px-4 text-right">Canon Arriendo</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Calendar className="w-8 h-8 mx-auto text-muted-foreground/50" />
                      <p className="font-semibold text-foreground">No se encontraron contratos con estos filtros.</p>
                      <p className="text-xs">Prueba seleccionando &ldquo;Todos&rdquo; o limpiando la barra de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((c) => {
                  const a = c.analysis
                  const isSavingThis = savingRowId === c.id
                  const isSavedThis = savedRowId === c.id
                  const hasErrorThis = rowError?.id === c.id
                  const inputDateVal = c.contractDate ? toInputDate(parseContractDate(c.contractDate)) : ''
                  const rentAmount = Math.round(c.totalRent || (c.baseRent + c.adjustmentAmount) || c.baseRent || 0)

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        a.status === 'VENCIDO'
                          ? 'bg-rose-500/[0.02]'
                          : a.status === 'POR_VENCER'
                          ? 'bg-amber-500/[0.02]'
                          : a.status === 'INCOMPLETO'
                          ? 'bg-orange-500/[0.02]'
                          : ''
                      }`}
                    >
                      {/* Estado Vigencia Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-1">
                          {a.status === 'VENCIDO' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-200 dark:border-rose-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                              <span>{a.daysText}</span>
                            </span>
                          )}
                          {a.status === 'POR_VENCER' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>{a.daysText}</span>
                            </span>
                          )}
                          {a.status === 'VIGENTE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>Vigente ({a.daysRemaining}d)</span>
                            </span>
                          )}
                          {a.status === 'INCOMPLETO' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 shadow-2xs">
                              <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>{a.statusLabel}</span>
                            </span>
                          )}
                          {a.status === 'INDEFINIDO' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                              <span>Indefinido</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Propiedad / Unidad */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground text-xs leading-snug">
                          {c.building} · {c.unitNumber ? `${c.propertyType} ${c.unitNumber}` : c.propertyType}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {c.company?.name || 'Inversiones NyS'}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                          {c.newAssignee && (
                            <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-foreground">
                              Asig: {c.newAssignee}
                            </span>
                          )}
                          {c.rol && <span className="font-mono">ROL: {c.rol}</span>}
                        </div>
                      </td>

                      {/* Arrendatario */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {c.tenantName ? c.tenantName.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs line-clamp-1">{c.tenantName}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{c.tenantRut || 'Sin RUT'}</div>
                          </div>
                        </div>

                        {/* Contactos rápidos */}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                          {c.tenantPhone && (
                            <a
                              href={`tel:${c.tenantPhone}`}
                              className="text-primary hover:underline flex items-center gap-1"
                              title="Llamar al arrendatario"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{c.tenantPhone}</span>
                            </a>
                          )}
                          {c.tenantEmail && (
                            <a
                              href={`mailto:${c.tenantEmail}`}
                              className="text-muted-foreground hover:text-foreground flex items-center gap-1 truncate max-w-[130px]"
                              title={c.tenantEmail}
                            >
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{c.tenantEmail}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Fecha Contrato (EDITABLE DIRECTO EN LA CELDA) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="relative flex items-center gap-1.5">
                            <input
                              type="date"
                              value={inputDateVal}
                              onChange={(e) => handleDateChange(c.id, e.target.value)}
                              className={`w-full px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                                !c.contractDate
                                  ? 'border-amber-400 bg-amber-50/80 text-slate-900 placeholder:text-slate-400 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-600'
                                  : 'border-border bg-background text-foreground hover:border-primary/50'
                              }`}
                              title="Haz clic para modificar la fecha de inicio del contrato"
                            />
                            {isSavedThis && (
                              <span className="text-emerald-600 font-black text-xs shrink-0 animate-in fade-in" title="Guardado en base de datos">
                                ✓
                              </span>
                            )}
                            {isSavingThis && (
                              <span className="text-primary text-[10px] shrink-0 font-medium animate-pulse">
                                ...
                              </span>
                            )}
                          </div>
                          <div className="text-[10px]">
                            {c.contractDate ? (
                              <span className="text-muted-foreground">Base: {a.contractDateFormatted}</span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">⚠️ Sin fecha registrada</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Período Renovación (EDITABLE DIRECTO EN LA CELDA) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <select
                            value={c.renewalPeriod || ''}
                            onChange={(e) => handlePeriodChange(c.id, e.target.value)}
                            className={`w-full px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                              !c.renewalPeriod
                                ? 'border-amber-400 bg-amber-50/80 text-slate-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-600'
                                : 'border-border bg-background text-foreground hover:border-primary/50'
                            }`}
                            title="Selecciona el período de renovación"
                          >
                            <option value="" className="bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                              -- Seleccionar período --
                            </option>
                            {RENEWAL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 py-1 font-medium">
                                {opt}
                              </option>
                            ))}
                            {c.renewalPeriod && !RENEWAL_OPTIONS.includes(c.renewalPeriod) && (
                              <option value={c.renewalPeriod} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 py-1 font-medium">
                                {c.renewalPeriod}
                              </option>
                            )}
                          </select>
                          <div className="text-[10px]">
                            {c.renewalPeriod ? (
                              <span className="text-muted-foreground">Cláusula: {c.renewalPeriod}</span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">⚠️ Sin período definido</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Prórroga Automática Toggle (EDITABLE EN 1 CLIC) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleAutoRenewal(c.id, c.autoRenewal ?? true)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 ${
                            (c.autoRenewal ?? true)
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                          }`}
                          title={
                            (c.autoRenewal ?? true)
                              ? 'Prórroga automática activa. El contrato se renueva sucesivamente cada período y avisa 35 días antes. Clic para cambiar a Plazo Fijo.'
                              : 'Plazo fijo sin prórroga automática. Clic para activar Prórroga Automática.'
                          }
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              (c.autoRenewal ?? true) ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{(c.autoRenewal ?? true) ? 'Automática' : 'Plazo Fijo'}</span>
                        </button>
                        {a.autoRenewal && a.cycleNumber > 1 && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            Ciclo #{a.cycleNumber}
                          </div>
                        )}
                      </td>

                      {/* Próximo Vencimiento y Fechas de Ciclo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-foreground text-xs flex items-center gap-1.5">
                          <span>{a.expirationDateFormatted}</span>
                          {a.autoRenewal && a.cycleNumber > 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                              Ciclo {a.cycleNumber}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] font-semibold mt-0.5 ${
                            a.status === 'VENCIDO'
                              ? 'text-rose-600 dark:text-rose-400'
                              : a.status === 'POR_VENCER'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {a.daysText}
                        </div>
                        {a.noticeDate && a.status !== 'INCOMPLETO' && a.status !== 'INDEFINIDO' && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Aviso desde: {a.noticeDateFormatted}
                            </span>
                            {a.autoRenewal && (
                              <span className="text-muted-foreground/80 ml-1">(-35d)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Canon Arriendo */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-foreground text-xs">
                          ${rentAmount.toLocaleString('es-CL')}
                        </div>
                        {c.adjustmentPercentage > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Reajuste:{' '}
                            {c.adjustmentPercentage > 1
                              ? `${c.adjustmentPercentage}%`
                              : `${(c.adjustmentPercentage * 100).toFixed(1)}%`}
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Botón Renovar Rápido */}
                          {(a.status === 'VENCIDO' || a.status === 'POR_VENCER' || a.status === 'INCOMPLETO') && (
                            <button
                              type="button"
                              onClick={() => handleQuickRenew(c)}
                              disabled={isSavingThis}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 transition-all cursor-pointer shadow-2xs hover:scale-102"
                              title="Prorrogar contrato por un nuevo período en la base de datos"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Renovar</span>
                            </button>
                          )}

                          {/* Botón Ver Ficha Completa */}
                          <button
                            type="button"
                            onClick={() => setEditingContract(c)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Ver o editar ficha completa de la propiedad"
                          >
                            <FileText className="w-4 h-4" />
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

        {/* Paginación Inferior */}
        {filteredContracts.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/10">
            <div>
              Mostrando{' '}
              <span className="font-bold text-foreground">
                {pageSize === -1
                  ? filteredContracts.length
                  : Math.min((currentPage - 1) * pageSize + 1, filteredContracts.length)}
              </span>{' '}
              a{' '}
              <span className="font-bold text-foreground">
                {pageSize === -1
                  ? filteredContracts.length
                  : Math.min(currentPage * pageSize, filteredContracts.length)}
              </span>{' '}
              de <span className="font-bold text-foreground">{filteredContracts.length}</span> arriendos filtrados
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground text-xs font-medium cursor-pointer"
              >
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
                <option value={-1}>Ver todos</option>
              </select>

              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 cursor-pointer font-bold"
                  >
                    Ant
                  </button>
                  <span className="px-2 text-foreground font-semibold">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 cursor-pointer font-bold"
                  >
                    Sig
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Ficha Completa */}
      {editingContract && (
        <ContractEditModal
          contract={editingContract}
          companies={companies}
          buildings={buildings}
          initialMode="view"
          initialTab="valores"
          onClose={() => setEditingContract(null)}
          onSaved={(updated) => {
            setContracts((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
            )
            setEditingContract(null)
            setMessage({
              text: `Ficha de ${updated.building} ${updated.unitNumber} actualizada correctamente.`,
              type: 'success',
            })
          }}
        />
      )}
    </div>
  )
}
