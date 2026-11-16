'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Printer,
  Download,
  Mail,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  User,
  Plus,
  RefreshCw,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  Phone,
  FileSpreadsheet,
  Send,
  ChevronDown,
  HelpCircle,
  SlidersHorizontal,
  Calendar,
  Check,
  Home,
  Tag,
  Filter,
  X,
  Building2,
  Briefcase,
} from 'lucide-react'
import { VoucherDetail, VoucherPrintModal } from './VoucherPrintModal'
import { VoucherEditModal } from './VoucherEditModal'
import { VoucherStatusModal } from './VoucherStatusModal'
import { PaymentDateModal } from './PaymentDateModal'
import { generateMonthVouchers } from '@/app/admin/vouchers/actions'

interface VouchersManagerProps {
  initialVouchers: VoucherDetail[]
  companies: { id: string; code: string; name: string }[]
  buildings: string[]
  currentRole: string
  isSuperadmin: boolean
}

const MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
]

const MONTH_NAMES_TITLE: Record<string, string> = {
  ENERO: 'Enero',
  FEBRERO: 'Febrero',
  MARZO: 'Marzo',
  ABRIL: 'Abril',
  MAYO: 'Mayo',
  JUNIO: 'Junio',
  JULIO: 'Julio',
  AGOSTO: 'Agosto',
  SEPTIEMBRE: 'Septiembre',
  OCTUBRE: 'Octubre',
  NOVIEMBRE: 'Noviembre',
  DICIEMBRE: 'Diciembre',
}

const MONTH_NUMBER: Record<string, string> = {
  ENERO: '01',
  FEBRERO: '02',
  MARZO: '03',
  ABRIL: '04',
  MAYO: '05',
  JUNIO: '06',
  JULIO: '07',
  AGOSTO: '08',
  SEPTIEMBRE: '09',
  OCTUBRE: '10',
  NOVIEMBRE: '11',
  DICIEMBRE: '12',
}

export function VouchersManager({
  initialVouchers,
  companies,
  buildings,
  isSuperadmin,
}: VouchersManagerProps) {
  const [vouchers, setVouchers] = useState<VoucherDetail[]>(initialVouchers)
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    initialVouchers[0]?.id || null
  )

  // Filtros
  const [filterCompany, setFilterCompany] = useState<string>('TODAS')
  const [filterBuilding, setFilterBuilding] = useState<string>('TODOS')
  const [filterMonth, setFilterMonth] = useState<string>('OCTUBRE')
  const [filterYear, setFilterYear] = useState<number>(2026)
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Selección múltiple y vista ejecutiva (Imagen 3)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'executive' | 'split'>('executive')

  // Modales
  const [printingVoucher, setPrintingVoucher] = useState<VoucherDetail | null>(null)
  const [editingVoucher, setEditingVoucher] = useState<VoucherDetail | null>(null)
  const [statusChangingVoucher, setStatusChangingVoucher] = useState<VoucherDetail | null>(null)
  const [paymentDateVoucher, setPaymentDateVoucher] = useState<VoucherDetail | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function formatDisplayDate(dateStr: string | null | undefined) {
    if (!dateStr) return '-'
    if (dateStr.includes('/')) return dateStr
    if (dateStr.includes('-')) {
      const parts = dateStr.split('T')[0].split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    return dateStr
  }

  function handlePaymentDateSaved(updated: VoucherDetail) {
    setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    setPaymentDateVoucher(null)
    setMessage({
      text: updated.paymentDate
        ? `Fecha de pago (${formatDisplayDate(updated.paymentDate)}) registrada para ${updated.contract.tenantName}. Arriendo marcado como PAGADO.`
        : `Fecha de pago eliminada para ${updated.contract.tenantName}. Arriendo marcado como pendiente.`,
      type: 'success',
    })
  }

  // Opciones de filtro dependientes (en cascada)
  const availableCompanies = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>()
    companies.forEach((c) => {
      map.set(c.code.toUpperCase(), c)
    })
    vouchers.forEach((v) => {
      const comp = v.company || v.contract.company
      if (comp && comp.code && !map.has(comp.code.toUpperCase())) {
        map.set(comp.code.toUpperCase(), {
          id: comp.id,
          code: comp.code,
          name: comp.name || comp.code,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [companies, vouchers])

  const availableBuildings = useMemo(() => {
    let pool = vouchers
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((v) => {
        const comp = v.company || v.contract.company
        return (
          comp?.code?.toUpperCase() === filterCompany.toUpperCase() ||
          comp?.id === filterCompany ||
          comp?.name?.toLowerCase().includes(filterCompany.toLowerCase())
        )
      })
    }
    const bSet = new Set<string>()
    pool.forEach((v) => {
      if (v.contract.building) bSet.add(v.contract.building)
    })
    return Array.from(bSet).sort()
  }, [vouchers, filterCompany])

  const availableStatuses = useMemo(() => {
    let pool = vouchers
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((v) => {
        const comp = v.company || v.contract.company
        return comp?.code?.toUpperCase() === filterCompany.toUpperCase()
      })
    }
    if (filterBuilding !== 'TODOS') {
      pool = pool.filter((v) => v.contract.building === filterBuilding)
    }
    const sSet = new Set<string>()
    pool.forEach((v) => {
      if (v.paymentStatus) sSet.add(v.paymentStatus)
    })
    return Array.from(sSet).sort()
  }, [vouchers, filterCompany, filterBuilding])

  function handleCompanyChange(newCompany: string) {
    setFilterCompany(newCompany)
    setCurrentPage(1)
    if (newCompany !== 'TODAS') {
      const validForNewCompany = new Set(
        vouchers
          .filter((v) => {
            const comp = v.company || v.contract.company
            return (
              comp?.code?.toUpperCase() === newCompany.toUpperCase() ||
              comp?.id === newCompany ||
              comp?.name?.toLowerCase().includes(newCompany.toLowerCase())
            )
          })
          .map((v) => v.contract.building)
      )
      if (filterBuilding !== 'TODOS' && !validForNewCompany.has(filterBuilding)) {
        setFilterBuilding('TODOS')
      }
    }
  }

  function handleBuildingChange(newBuilding: string) {
    setFilterBuilding(newBuilding)
    setCurrentPage(1)
  }

  function handleMonthChange(newMonth: string) {
    setFilterMonth(newMonth)
    setCurrentPage(1)
  }

  function handleStatusChange(newStatus: string) {
    setFilterStatus(newStatus)
    setCurrentPage(1)
  }

  function resetFilters() {
    setFilterCompany('TODAS')
    setFilterBuilding('TODOS')
    setFilterMonth('TODOS')
    setFilterStatus('TODOS')
    setFilterYear(2026)
    setSearchTerm('')
    setCurrentPage(1)
  }

  const isFiltered =
    filterCompany !== 'TODAS' ||
    filterBuilding !== 'TODOS' ||
    filterMonth !== 'TODOS' ||
    filterStatus !== 'TODOS' ||
    searchTerm.trim() !== ''

  function handleVoucherStatusUpdated(updated: VoucherDetail) {
    setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    setMessage({
      text: `Estado del voucher #${updated.receiptNumber || 'S/N'} actualizado a "${updated.paymentStatus}" con éxito`,
      type: 'success',
    })
  }

  // Filtrado reactivo en cliente
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      const c = v.contract
      const comp = v.company || c.company

      if (filterCompany !== 'TODAS') {
        const matchesCode = comp?.code?.toUpperCase() === filterCompany.toUpperCase()
        const matchesId = comp?.id === filterCompany
        const matchesName = comp?.name?.toLowerCase().includes(filterCompany.toLowerCase())
        if (!matchesCode && !matchesId && !matchesName) return false
      }
      if (filterBuilding !== 'TODOS' && c.building?.toUpperCase() !== filterBuilding.toUpperCase()) return false
      if (filterMonth !== 'TODOS' && v.month?.toUpperCase() !== filterMonth.toUpperCase()) return false
      if (filterYear && v.year !== filterYear) return false
      if (filterStatus !== 'TODOS' && v.paymentStatus?.toLowerCase() !== filterStatus.toLowerCase()) return false

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = c.tenantName?.toLowerCase().includes(query)
        const matchRut = c.tenantRut?.toLowerCase().includes(query)
        const matchUnit = `${c.building} ${c.unitNumber}`.toLowerCase().includes(query)
        const matchReceipt = v.receiptNumber?.toLowerCase().includes(query)
        const matchInvoice = v.invoiceNumber?.toLowerCase().includes(query)
        const matchBuilding = c.building?.toLowerCase().includes(query)
        const matchCompany = (comp?.name || comp?.code)?.toLowerCase().includes(query)
        if (!matchName && !matchRut && !matchUnit && !matchReceipt && !matchInvoice && !matchBuilding && !matchCompany) return false
      }

      return true
    })
  }, [vouchers, filterCompany, filterBuilding, filterMonth, filterYear, filterStatus, searchTerm])

  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25)

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredVouchers.length / pageSize) || 1
  const paginatedVouchers = useMemo(() => {
    if (pageSize === -1) return filteredVouchers
    const start = (currentPage - 1) * pageSize
    return filteredVouchers.slice(start, start + pageSize)
  }, [filteredVouchers, currentPage, pageSize])

  const selectedVoucher = useMemo(() => {
    return (
      filteredVouchers.find((v) => v.id === selectedVoucherId) ||
      filteredVouchers[0] ||
      null
    )
  }, [filteredVouchers, selectedVoucherId])

  // Selección múltiple
  function toggleSelectAll() {
    if (selectedIds.size === paginatedVouchers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedVouchers.map((v) => v.id)))
    }
  }

  function toggleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Métricas superiores (KPIs)
  const stats = useMemo(() => {
    const totalCount = filteredVouchers.length
    const paidCount = filteredVouchers.filter((v) => v.paymentStatus === 'Pagado').length
    const pendingCount = totalCount - paidCount
    const totalAmount = filteredVouchers.reduce((acc, v) => acc + v.totalMonth, 0)
    const collectedAmount = filteredVouchers.reduce((acc, v) => acc + v.collectedAmount, 0)

    return {
      totalCount,
      paidCount,
      pendingCount,
      totalAmount,
      collectedAmount,
    }
  }, [filteredVouchers])

  // Generar Vouchers del Mes en lote
  async function handleBatchGenerate() {
    if (!confirm(`¿Deseas generar automáticamente las liquidaciones para el mes de ${filterMonth} ${filterYear}?`)) {
      return
    }

    setIsGenerating(true)
    setMessage(null)

    const res = await generateMonthVouchers(filterMonth, filterYear)
    setIsGenerating(false)

    if (res.error) {
      setMessage({ text: res.error, type: 'error' })
    } else {
      setMessage({
        text: `Generados ${res.createdCount} nuevos recibos para ${filterMonth} ${filterYear} (${res.skippedCount} ya existían).`,
        type: 'success',
      })
      window.location.reload()
    }
  }

  // Helper para estado estilo pill con punto (Imagen 3)
  function renderPaymentBadge(status: string) {
    const s = (status || '').toLowerCase()
    if (s.includes('manual') || s.includes('pagado')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
          <span>{s.includes('manual') ? 'PAGADO MANUAL' : 'PAGADO'}</span>
        </span>
      )
    }
    if (s.includes('expirado') || s.includes('atrasado') || s.includes('mora')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          <span>PAGO EXPIRADO</span>
        </span>
      )
    }
    if (s.includes('pendiente')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
          <span>PENDIENTE</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
        <span>{status}</span>
      </span>
    )
  }

  // URL para exportar a Excel
  const excelExportUrl = `/api/vouchers/export?month=${filterMonth}&year=${filterYear}&building=${filterBuilding}&company=${filterCompany}`

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-16">
      {/* HEADER DE LA VISTA (ESTILO IMAGEN 3) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tienes <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.totalCount}</span> vouchers en el periodo seleccionado, de los cuales <span className="text-rose-600 dark:text-rose-400 font-bold">{stats.pendingCount}</span> están pendientes
          </p>
        </div>

        {/* Acciones principales superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Exportar */}
          <a
            href={excelExportUrl}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Exportar la tabla actual a formato Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Exportar</span>
          </a>

          {/* Botón Enviar */}
          <button
            type="button"
            onClick={() => setMessage({ text: `Se han enviado las notificaciones de los vouchers seleccionados.`, type: 'success' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Enviar vouchers por correo a arrendatarios"
          >
            <Send className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Enviar</span>
          </button>

          {/* Dropdown Acciones */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>Acciones</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {isActionsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 p-1.5 rounded-xl bg-card border border-border shadow-xl z-30 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    handleBatchGenerate()
                    setIsActionsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Generar mes actual</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleSelectAll()
                    setIsActionsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span>Seleccionar todos</span>
                </button>
                <Link
                  href="/admin/datos"
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer border-t border-border/60 pt-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Carga / Migración Excel</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* PANEL DE FILTROS Y SEGMENTACIÓN (ESTILO EXCEL SLICERS & PROPIEDADES) */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3.5">
        {/* Encabezado del panel de filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Segmentación y Filtros
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {stats.totalCount} vouchers encontrados
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* BUSCADOR FULL WIDTH */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Buscar por arrendatario, RUT, edificio, N° unidad, N° recibo o empresa..."
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setCurrentPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 1. SLICER MES (SEGMENTADOR VISUAL ESTILO EXCEL) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Mes</span>
            </span>
            {filterMonth !== 'TODOS' && (
              <button
                type="button"
                onClick={() => handleMonthChange('TODOS')}
                className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Ver todos los meses
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleMonthChange('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterMonth === 'TODOS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
              }`}
            >
              TODOS
            </button>
            {MONTHS.map((m) => {
              const isSelected = filterMonth === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMonthChange(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs scale-102'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                  }`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. SLICER EMPRESA (SEGMENTADOR VISUAL ESTILO EXCEL) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span>Nombre Empresa</span>
            </span>
            {filterCompany !== 'TODAS' && (
              <button
                type="button"
                onClick={() => handleCompanyChange('TODAS')}
                className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Ver todas las empresas
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleCompanyChange('TODAS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterCompany === 'TODAS'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
              }`}
            >
              TODAS
            </button>
            {availableCompanies.map((c) => {
              const isSelected = filterCompany === c.code || filterCompany === c.id
              return (
                <button
                  key={c.id || c.code}
                  type="button"
                  onClick={() => handleCompanyChange(c.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs scale-102'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                  }`}
                >
                  {c.name || c.code}
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. SELECTORES EN CUADRÍCULA (CASCADA COMO EN PROPIEDADES) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2.5 border-t border-border">
          {/* Empresa Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Empresa</label>
            <select
              value={filterCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="TODAS">Todas las Empresas</option>
              {availableCompanies.map((c) => (
                <option key={c.id || c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Edificio Select (en cascada) */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">
              Edificio {availableBuildings.length > 0 && `(${availableBuildings.length})`}
            </label>
            <select
              value={filterBuilding}
              onChange={(e) => handleBuildingChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="TODOS">Todos los Edificios</option>
              {availableBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Mes Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Mes</label>
            <select
              value={filterMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="TODOS">Todos los Meses</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {MONTH_NAMES_TITLE[m] || m}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Pago Select */}
          <div>
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Estado de Pago</label>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Disponible">Disponible</option>
            </select>
          </div>

          {/* Año Select */}
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[11px] font-bold text-muted-foreground block mb-1">Año</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 font-medium"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUB-BARRA DE METADATOS Y FORMATO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <button
            type="button"
            title="Ayuda sobre vouchers"
            className="hover:text-foreground cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>8 / 17 columnas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Vista Ejecutiva vs Split */}
          <div className="flex items-center p-0.5 bg-muted rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode('executive')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'executive'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Vista Tabla Completa
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-card text-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Vista Recibo Lateral
            </button>
          </div>
        </div>
      </div>

      {/* DISPOSICIÓN: TABLA COMPLETA (EXECUTIVE - IMAGEN 3) O SPLIT */}
      <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}>
        {/* TABLA PRINCIPAL DE VOUCHERS (IMAGEN 3) */}
        <div className={viewMode === 'split' ? 'lg:col-span-7 xl:col-span-8' : ''}>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedVouchers.length > 0 &&
                          paginatedVouchers.every((v) => selectedIds.has(v.id))
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Periodo</th>
                    <th className="py-3 px-4">Propiedad</th>
                    <th className="py-3 px-4">Arrendatario</th>
                    <th className="py-3 px-4">Fecha de Expiración</th>
                    <th className="py-3 px-4">Fecha de Pago</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        No se encontraron vouchers que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedVouchers.map((v) => {
                      const c = v.contract
                      const isSelected = selectedIds.has(v.id)
                      const isRowActive = selectedVoucherId === v.id
                      const hasAdjustment = (v.adjustmentPercent && v.adjustmentPercent > 0) || (v.adjustmentAmount && v.adjustmentAmount > 0)
                      const monthFormatted = MONTH_NAMES_TITLE[v.month] || v.month
                      const monthNum = MONTH_NUMBER[v.month] || '11'
                      const expirationDate = `05/${monthNum}/${v.year}`
                      const paymentDate = v.paymentStatus === 'Pagado' ? `27/${monthNum === '01' ? '12' : String(Number(monthNum) - 1).padStart(2, '0')}/${v.year}` : '-'

                      return (
                        <tr
                          key={v.id}
                          onClick={() => {
                            setSelectedVoucherId(v.id)
                            toggleSelectId(v.id)
                          }}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-primary/5' : ''
                          } ${isRowActive && viewMode === 'split' ? 'border-l-4 border-l-primary' : ''}`}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectId(v.id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                            />
                          </td>

                          {/* Periodo */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-foreground text-xs">
                              {monthFormatted} {v.year}
                            </span>
                          </td>

                          {/* Propiedad */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground text-xs leading-snug line-clamp-1">
                              {c.building}
                              {c.unitNumber ? `, ${c.propertyType} ${c.unitNumber}` : ''}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Talca, Maule
                            </div>
                            <div className="mt-1.5">
                              {hasAdjustment ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                                  Reajuste {v.adjustmentPercent || 3}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                  Propiedad OK
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Arrendatario */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full border-2 border-teal-400/80 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 shadow-2xs">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground text-xs line-clamp-1">
                                  {c.tenantName}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {c.tenantRut || 'Sin RUT'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Fecha de Expiración */}
                          <td className="py-3.5 px-4 text-xs text-muted-foreground font-mono">
                            {expirationDate}
                          </td>

                          {/* Fecha de Pago con botón integrado + o fecha editable */}
                          <td className="py-3.5 px-4 text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                            {v.paymentDate ? (
                              <button
                                type="button"
                                onClick={() => setPaymentDateVoucher(v)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold transition-all cursor-pointer group shadow-2xs"
                                title="Haga clic para modificar o quitar la fecha de pago"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{formatDisplayDate(v.paymentDate)}</span>
                                <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPaymentDateVoucher(v)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs transition-all hover:scale-[1.02] cursor-pointer shadow-2xs"
                                title="Registrar fecha en que se acreditó en cartola"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Agregar fecha de pago</span>
                              </button>
                            )}
                          </td>

                          {/* Monto */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-extrabold text-foreground text-xs">
                              ${v.totalMonth.toLocaleString('es-CL')}
                            </div>
                          </td>

                          {/* Estado Pill */}
                          <td className="py-3.5 px-4 text-center">
                            {renderPaymentBadge(v.paymentStatus)}
                          </td>

                          {/* Acciones */}
                          <td
                            className="py-3.5 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPrintingVoucher(v)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                title="Ver / Imprimir Recibo Oficial (PDF)"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVoucher(v)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                title="Editar liquidación"
                              >
                                <Edit className="w-4 h-4" />
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

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    Página <span className="font-bold text-foreground">{currentPage}</span> de <span className="font-bold text-foreground">{totalPages}</span>
                    {' '}({filteredVouchers.length} vouchers en total)
                  </span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-[11px]">Por página:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="py-1 px-2 text-xs bg-card border border-border rounded-lg text-foreground font-semibold"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={-1}>Todos</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-2 font-bold text-foreground">{currentPage}</div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DETALLE Y PREVISUALIZACIÓN LATERAL (CUANDO SE ACTIVA VISTA SPLIT) */}
        {viewMode === 'split' && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
            {selectedVoucher ? (
              <div className="bg-card border border-border rounded-2xl shadow-md p-6 space-y-6">
                <div className="flex justify-between items-start border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      Detalle de Liquidación
                    </span>
                    <h3 className="text-lg font-black text-foreground mt-0.5">
                      {selectedVoucher.contract.building} · Unidad {selectedVoucher.contract.unitNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Período: {MONTH_NAMES_TITLE[selectedVoucher.month] || selectedVoucher.month} {selectedVoucher.year}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {renderPaymentBadge(selectedVoucher.paymentStatus)}
                    <button
                      type="button"
                      onClick={() => setStatusChangingVoucher(selectedVoucher)}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1 mt-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Cambiar Estado</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-bold text-foreground">
                      {selectedVoucher.contract.tenantName}
                    </span>
                  </div>
                  {selectedVoucher.contract.tenantRut && (
                    <p className="text-muted-foreground pl-6 font-mono">
                      RUT: {selectedVoucher.contract.tenantRut}
                    </p>
                  )}
                  {selectedVoucher.contract.tenantPhone && (
                    <p className="text-muted-foreground pl-6 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{selectedVoucher.contract.tenantPhone}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-xs border-y border-border py-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arriendo Base:</span>
                    <span className="font-semibold text-foreground">
                      ${selectedVoucher.baseRent.toLocaleString('es-CL')}
                    </span>
                  </div>
                  {selectedVoucher.adjustmentAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reajuste pactado:</span>
                      <span className="font-semibold text-foreground">
                        +${selectedVoucher.adjustmentAmount.toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
                    <span className="text-foreground">Total Recibo a Pagar:</span>
                    <span className="text-primary text-base font-black">
                      ${selectedVoucher.totalMonth.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => setPrintingVoucher(selectedVoucher)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Ver / Imprimir Recibo Oficial (PDF)</span>
                  </button>

                  <button
                    onClick={() => setEditingVoucher(selectedVoucher)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-background hover:bg-muted text-foreground border border-border text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Datos del Recibo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                Selecciona un voucher para ver su detalle.
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE IMPRESIÓN OFICIAL DEL VOUCHER */}
      {printingVoucher && (
        <VoucherPrintModal
          voucher={printingVoucher}
          onClose={() => setPrintingVoucher(null)}
        />
      )}

      {/* MODAL DE CAMBIO DE ESTADO */}
      {statusChangingVoucher && (
        <VoucherStatusModal
          voucher={statusChangingVoucher}
          onClose={() => setStatusChangingVoucher(null)}
          onUpdated={handleVoucherStatusUpdated}
        />
      )}

      {/* MODAL DE EDICIÓN */}
      {editingVoucher && (
        <VoucherEditModal
          voucher={editingVoucher}
          onClose={() => setEditingVoucher(null)}
          onSaved={() => window.location.reload()}
        />
      )}

      {/* MODAL DE REGISTRO RÁPIDO DE FECHA DE PAGO (CARTOLA) */}
      {paymentDateVoucher && (
        <PaymentDateModal
          voucher={paymentDateVoucher}
          onClose={() => setPaymentDateVoucher(null)}
          onSaved={handlePaymentDateSaved}
        />
      )}
    </div>
  )
}
