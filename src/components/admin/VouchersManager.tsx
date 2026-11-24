'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
  Loader2,
  Sparkles,
} from 'lucide-react'
import { VoucherDetail, VoucherPrintModal } from './VoucherPrintModal'
import { VoucherEditModal } from './VoucherEditModal'
import { VoucherStatusModal } from './VoucherStatusModal'
import { PaymentDateModal } from './PaymentDateModal'
import { InvoiceEditModal } from './InvoiceEditModal'
import { VoucherEmailModal } from './VoucherEmailModal'
import { generateMonthVouchers, assignVoucherReceiptNumber, autoAssignMissingReceipts } from '@/app/admin/vouchers/actions'

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

  // Helper para mes actual dinámico en base al reloj del sistema (ej: 'NOVIEMBRE' en nov 2026)
  const currentMonthName = useMemo(() => {
    const mIndex = new Date().getMonth()
    return MONTHS[mIndex] || 'NOVIEMBRE'
  }, [])

  // Filtros con soporte de Selección Múltiple
  const [selectedMonths, setSelectedMonths] = useState<string[]>([currentMonthName])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])
  const [filterBuilding, setFilterBuilding] = useState<string>('TODOS')
  const [filterYear, setFilterYear] = useState<number>(2026)
  const [filterStatus, setFilterStatus] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Control de dropdowns desplegables emergentes
  const [openDropdown, setOpenDropdown] = useState<'month' | 'company' | 'owner' | 'building' | 'status' | 'year' | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Búsquedas internas en desplegables
  const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>('')
  const [companySearchTerm, setCompanySearchTerm] = useState<string>('')
  const [buildingSearchTerm, setBuildingSearchTerm] = useState<string>('')

  // Cierra los menús desplegables al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Selección múltiple y vista ejecutiva (Imagen 3)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'executive' | 'split'>('executive')

  // Modales
  const [printingVoucher, setPrintingVoucher] = useState<VoucherDetail | null>(null)
  const [editingVoucher, setEditingVoucher] = useState<VoucherDetail | null>(null)
  const [statusChangingVoucher, setStatusChangingVoucher] = useState<VoucherDetail | null>(null)
  const [paymentDateVoucher, setPaymentDateVoucher] = useState<VoucherDetail | null>(null)
  const [invoiceEditingVoucher, setInvoiceEditingVoucher] = useState<VoucherDetail | null>(null)
  const [emailSendingVoucher, setEmailSendingVoucher] = useState<VoucherDetail | null>(null)
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
        ? `Pago de $${Math.round(updated.collectedAmount || updated.totalMonth).toLocaleString('es-CL')} registrado exitosamente para ${updated.contract.tenantName} (${formatDisplayDate(updated.paymentDate)}). Estado: PAGADO.`
        : `Pago anulado para ${updated.contract.tenantName}. Arriendo marcado nuevamente como PENDIENTE.`,
      type: 'success',
    })
  }

  function handleInvoiceSaved(voucherId: string, newInvoiceNumber: string | null) {
    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, invoiceNumber: newInvoiceNumber } : v))
    )
    setInvoiceEditingVoucher(null)
    setMessage({
      text: newInvoiceNumber
        ? `N° de Factura #${newInvoiceNumber} registrado exitosamente.`
        : 'N° de Factura eliminado.',
      type: 'success',
    })
  }

  // Lista de empresas disponibles con conteo
  const availableCompanies = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string; count: number }>()
    companies.forEach((c) => {
      map.set(c.code.toUpperCase(), { ...c, count: 0 })
    })
    vouchers.forEach((v) => {
      const comp = v.company || v.contract.company
      if (comp && comp.code) {
        const codeUpper = comp.code.toUpperCase()
        if (!map.has(codeUpper)) {
          map.set(codeUpper, {
            id: comp.id,
            code: comp.code,
            name: comp.name || comp.code,
            count: 0,
          })
        }
        map.get(codeUpper)!.count++
      }
    })
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code))
  }, [companies, vouchers])

  // Lista de propietarios (Nuevo Asignatario o Nombre Empresa) con conteo
  const availableOwners = useMemo(() => {
    const map = new Map<string, number>()
    vouchers.forEach((v) => {
      const owner =
        (v.contract?.newAssignee && v.contract.newAssignee.trim() !== '')
          ? v.contract.newAssignee.trim()
          : (v.company?.name || v.contract?.company?.name || 'Sin Asignar')
      map.set(owner, (map.get(owner) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [vouchers])

  // Lista de edificios disponibles
  const availableBuildings = useMemo(() => {
    const bSet = new Set<string>()
    vouchers.forEach((v) => {
      if (v.contract.building) bSet.add(v.contract.building)
    })
    return Array.from(bSet).sort()
  }, [vouchers])

  function resetFilters() {
    setSelectedMonths([currentMonthName])
    setSelectedCompanies([])
    setSelectedOwners([])
    setFilterBuilding('TODOS')
    setFilterStatus('TODOS')
    setFilterYear(2026)
    setSearchTerm('')
    setOwnerSearchTerm('')
    setCompanySearchTerm('')
    setBuildingSearchTerm('')
    setOpenDropdown(null)
    setCurrentPage(1)
  }

  const isFiltered =
    selectedMonths.length !== 1 ||
    selectedMonths[0] !== currentMonthName ||
    selectedCompanies.length > 0 ||
    selectedOwners.length > 0 ||
    filterBuilding !== 'TODOS' ||
    filterStatus !== 'TODOS' ||
    filterYear !== 2026 ||
    searchTerm.trim() !== ''

  function handleVoucherStatusUpdated(updated: VoucherDetail) {
    setVouchers((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    setMessage({
      text: `Estado del voucher #${updated.receiptNumber || 'S/N'} actualizado a "${updated.paymentStatus}" con éxito`,
      type: 'success',
    })
  }

  // Filtrado reactivo en cliente con orden prioritario: PENDIENTES PRIMERO
  const filteredVouchers = useMemo(() => {
    const list = vouchers.filter((v) => {
      const c = v.contract
      const comp = v.company || c.company
      const ownerName =
        (c.newAssignee && c.newAssignee.trim() !== '')
          ? c.newAssignee.trim()
          : (v.company?.name || c.company?.name || 'Sin Asignar')

      // Filtro Meses (multi-selección)
      if (selectedMonths.length > 0 && selectedMonths.length < 12) {
        const m = (v.month || '').toUpperCase()
        if (!selectedMonths.includes(m)) return false
      }

      // Filtro Empresas (multi-selección)
      if (selectedCompanies.length > 0) {
        const code = comp?.code?.toUpperCase() || ''
        const id = comp?.id || ''
        const name = (comp?.name || '').toLowerCase()
        const matchComp = selectedCompanies.some(
          (sc) =>
            sc.toUpperCase() === code ||
            sc === id ||
            name.includes(sc.toLowerCase())
        )
        if (!matchComp) return false
      }

      // Filtro Propietarios / Asignatarios (multi-selección)
      if (selectedOwners.length > 0) {
        if (!selectedOwners.includes(ownerName)) return false
      }

      // Filtro Edificio
      if (filterBuilding !== 'TODOS' && c.building?.toUpperCase() !== filterBuilding.toUpperCase()) {
        return false
      }

      // Filtro Año
      if (filterYear && v.year !== filterYear) return false

      // Filtro Estado de Pago
      if (filterStatus !== 'TODOS') {
        if (filterStatus === 'Sin Estado') {
          if (v.paymentStatus && v.paymentStatus.trim() !== '') return false
        } else if (v.paymentStatus?.toLowerCase() !== filterStatus.toLowerCase()) {
          return false
        }
      }

      // Búsqueda textual amplia
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = c.tenantName?.toLowerCase().includes(query)
        const matchRut = c.tenantRut?.toLowerCase().includes(query)
        const matchUnit = `${c.building} ${c.unitNumber}`.toLowerCase().includes(query)
        const matchReceipt = v.receiptNumber?.toLowerCase().includes(query)
        const matchInvoice = v.invoiceNumber?.toLowerCase().includes(query)
        const matchBuilding = c.building?.toLowerCase().includes(query)
        const matchCompany = (comp?.name || comp?.code)?.toLowerCase().includes(query)
        const matchOwner = ownerName.toLowerCase().includes(query)
        if (!matchName && !matchRut && !matchUnit && !matchReceipt && !matchInvoice && !matchBuilding && !matchCompany && !matchOwner) {
          return false
        }
      }

      return true
    })

    // Ordenar: PENDIENTES de pago primero para agilizar el registro diario de contabilidad
    return [...list].sort((a, b) => {
      const aIsPending = (a.paymentStatus || '').toLowerCase() === 'pendiente' ? 0 : 1
      const bIsPending = (b.paymentStatus || '').toLowerCase() === 'pendiente' ? 0 : 1
      if (aIsPending !== bIsPending) {
        return aIsPending - bIsPending
      }
      const bComp = (a.contract.building || '').localeCompare(b.contract.building || '')
      if (bComp !== 0) return bComp
      return (a.contract.unitNumber || '').localeCompare(b.contract.unitNumber || '')
    })
  }, [vouchers, selectedMonths, selectedCompanies, selectedOwners, filterBuilding, filterYear, filterStatus, searchTerm])

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
    const paidCount = filteredVouchers.filter((v) => (v.paymentStatus || '').toLowerCase().includes('pag')).length
    const pendingCount = filteredVouchers.filter((v) => (v.paymentStatus || '').toLowerCase() === 'pendiente').length
    const emptyCount = filteredVouchers.filter((v) => !v.paymentStatus || v.paymentStatus.trim() === '').length
    const totalAmount = filteredVouchers.reduce((acc, v) => acc + v.totalMonth, 0)
    const collectedAmount = filteredVouchers.reduce((acc, v) => acc + v.collectedAmount, 0)

    return {
      totalCount,
      paidCount,
      pendingCount,
      emptyCount,
      totalAmount,
      collectedAmount,
    }
  }, [filteredVouchers])

  // Mes seleccionado principal para la acción de aperturar
  const targetApertureMonth = selectedMonths.length === 1 ? selectedMonths[0] : currentMonthName

  // Verifica si el mes seleccionado ya tiene vouchers creados en la base de datos
  const monthHasVouchers = useMemo(() => {
    return vouchers.some((v) => v.month?.toUpperCase() === targetApertureMonth.toUpperCase() && v.year === filterYear)
  }, [vouchers, targetApertureMonth, filterYear])

  // Generar Vouchers del Mes en lote (Apertura de Mes para Contabilidad)
  async function handleBatchGenerate() {
    const targetMonthName = MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth

    if (
      !confirm(
        `¿Deseas aperturar la cobranza para el mes de ${targetMonthName} ${filterYear}?\n\nSe replicarán automáticamente todos los contratos activos con estado PENDIENTE de pago.`
      )
    ) {
      return
    }

    setIsGenerating(true)
    setMessage(null)

    const res = await generateMonthVouchers(targetApertureMonth, filterYear)
    setIsGenerating(false)

    if (res.error) {
      setMessage({ text: res.error, type: 'error' })
    } else {
      setMessage({
        text: `¡Mes de ${targetMonthName} ${filterYear} aperturado con éxito! Se crearon ${res.createdCount} propiedades activas en estado PENDIENTE (${res.skippedCount} ya existían).`,
        type: 'success',
      })
      window.location.reload()
    }
  }

  // Auto-asignar N° de recibos correlativos faltantes en el periodo seleccionado
  async function handleBatchAssignReceipts() {
    if (
      !confirm(
        '¿Deseas auto-asignar número de recibo correlativo a todos los arriendos que aún no tengan número de recibo asignado en este periodo?'
      )
    ) {
      return
    }

    setIsGenerating(true)
    setMessage(null)

    const targetMonth = selectedMonths.length === 1 ? selectedMonths[0] : undefined
    const res = await autoAssignMissingReceipts(targetMonth, filterYear)
    setIsGenerating(false)

    if (res.error) {
      setMessage({ text: res.error, type: 'error' })
    } else {
      setMessage({
        text: res.message || `Se asignaron ${res.count} números de recibo correlativos exitosamente.`,
        type: 'success',
      })
      window.location.reload()
    }
  }

  // Helper para estado estilo pill con punto (Imagen 3)
  function renderPaymentBadge(status: string) {
    const s = (status || '').toLowerCase().trim()
    if (s.includes('manual') || s.includes('pagado') || s.includes('pag')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>{s.includes('manual') ? 'PAGADO MANUAL' : 'PAGADO'}</span>
        </span>
      )
    }
    if (s === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
          <span>PENDIENTE</span>
        </span>
      )
    }
    if (s === 'error' || s.includes('ref')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
          <span>ERROR</span>
        </span>
      )
    }
    // Sin estado / Vacío
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border/60">
        <span className="text-muted-foreground/60">-</span>
        <span>Sin estado</span>
      </span>
    )
  }

  // URL para exportar a Excel
  const exportMonthParam = selectedMonths.length === 1 ? selectedMonths[0] : 'TODOS'
  const exportCompanyParam = selectedCompanies.length === 1 ? selectedCompanies[0] : 'TODOS'
  const excelExportUrl = `/api/vouchers/export?month=${exportMonthParam}&year=${filterYear}&building=${filterBuilding}&company=${exportCompanyParam}`

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-16">
      {/* HEADER DE LA VISTA (ESTILO IMAGEN 3) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tienes <span className="text-foreground font-bold">{stats.totalCount}</span> arriendos en el período (<span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.paidCount} pagados</span>, <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.pendingCount} pendientes</span>{stats.emptyCount > 0 ? `, ${stats.emptyCount} sin estado` : ''})
          </p>
        </div>

        {/* Acciones principales superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Destacado Aperturar Mes */}
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleBatchGenerate}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer disabled:opacity-60 ${
              !monthHasVouchers
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md scale-102 ring-2 ring-primary/20'
                : 'border border-border bg-card hover:bg-muted text-foreground'
            }`}
            title={`Aperturar o actualizar arriendos para el mes de ${MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth} ${filterYear}`}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Aperturar {MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth}</span>
          </button>

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
                    handleBatchAssignReceipts()
                    setIsActionsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Asignar recibos faltantes</span>
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

      {/* PANEL DE FILTROS Y SEGMENTACIÓN REESTRUCTURADO */}
      <div ref={filterRef} className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3.5 relative">
        {/* Encabezado del panel de filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Segmentación y Filtros
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {stats.totalCount} {stats.totalCount === 1 ? 'voucher' : 'vouchers'} encontrados
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer shadow-2xs"
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
            placeholder="Buscar por arrendatario, RUT, propietario, edificio, N° unidad, N° recibo o empresa..."
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-medium"
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

        {/* FILA DE MENÚS DESPLEGABLES (COMPACTOS Y ORDENADOS) */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {/* 1. Dropdown MES */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs',
                selectedMonths.length > 0 && !(selectedMonths.length === 1 && selectedMonths[0] === currentMonthName)
                  ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                {selectedMonths.length === 0 || selectedMonths.length === 12
                  ? 'Mes: Todos'
                  : selectedMonths.length === 1
                  ? `Mes: ${MONTH_NAMES_TITLE[selectedMonths[0]] || selectedMonths[0]}`
                  : `Meses (${selectedMonths.length})`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'month' && (
              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-card border border-border rounded-2xl shadow-xl z-50 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Filtrar por Mes</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([currentMonthName])
                        setCurrentPage(1)
                      }}
                      className="text-primary hover:underline font-bold cursor-pointer"
                    >
                      Mes Actual
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([...MONTHS])
                        setCurrentPage(1)
                      }}
                      className="text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                    >
                      Todos
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonths([])
                        setCurrentPage(1)
                      }}
                      className="text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {MONTHS.map((m) => {
                    const isSelected = selectedMonths.includes(m)
                    const isCurrent = m === currentMonthName
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMonths((prev) =>
                            prev.includes(m) ? prev.filter((item) => item !== m) : [...prev, m]
                          )
                          setCurrentPage(1)
                        }}
                        className={cn(
                          'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer',
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <span>{MONTH_NAMES_TITLE[m] || m}</span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[8px] px-1 py-0.2 rounded font-black',
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            HOY
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Dropdown EMPRESA */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs',
                selectedCompanies.length > 0
                  ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              )}
            >
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span>
                {selectedCompanies.length === 0
                  ? 'Empresa: Todas'
                  : selectedCompanies.length === 1
                  ? `Empresa: ${selectedCompanies[0]}`
                  : `Empresas (${selectedCompanies.length})`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'company' && (
              <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-card border border-border rounded-2xl shadow-xl z-50 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Filtrar por Empresa</span>
                  {selectedCompanies.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanies([])
                        setCurrentPage(1)
                      }}
                      className="text-rose-500 hover:underline font-semibold text-[10px] cursor-pointer"
                    >
                      Limpiar ({selectedCompanies.length})
                    </button>
                  )}
                </div>

                {availableCompanies.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      placeholder="Buscar empresa..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {availableCompanies
                    .filter(
                      (c) =>
                        !companySearchTerm ||
                        c.code.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
                        c.name.toLowerCase().includes(companySearchTerm.toLowerCase())
                    )
                    .map((c) => {
                      const isSelected = selectedCompanies.includes(c.code)
                      return (
                        <label
                          key={c.id || c.code}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedCompanies((prev) =>
                                  prev.includes(c.code)
                                    ? prev.filter((item) => item !== c.code)
                                    : [...prev, c.code]
                                )
                                setCurrentPage(1)
                              }}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <span className="font-bold text-foreground truncate">{c.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">({c.code})</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                            {c.count}
                          </span>
                        </label>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Dropdown PROPIETARIO (Nuevo Asignatario) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'owner' ? null : 'owner')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs',
                selectedOwners.length > 0
                  ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              )}
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span>
                {selectedOwners.length === 0
                  ? 'Propietario: Todos'
                  : selectedOwners.length === 1
                  ? `Propietario: ${selectedOwners[0]}`
                  : `Propietarios (${selectedOwners.length})`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'owner' && (
              <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-card border border-border rounded-2xl shadow-xl z-50 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Propietario / Asignatario</span>
                  {selectedOwners.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOwners([])
                        setCurrentPage(1)
                      }}
                      className="text-rose-500 hover:underline font-semibold text-[10px] cursor-pointer"
                    >
                      Limpiar ({selectedOwners.length})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ownerSearchTerm}
                    onChange={(e) => setOwnerSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {availableOwners
                    .filter(
                      (o) =>
                        !ownerSearchTerm ||
                        o.name.toLowerCase().includes(ownerSearchTerm.toLowerCase())
                    )
                    .map((o) => {
                      const isSelected = selectedOwners.includes(o.name)
                      return (
                        <label
                          key={o.name}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedOwners((prev) =>
                                  prev.includes(o.name)
                                    ? prev.filter((item) => item !== o.name)
                                    : [...prev, o.name]
                                )
                                setCurrentPage(1)
                              }}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                            />
                            <span className="font-bold text-foreground truncate">{o.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-bold text-muted-foreground shrink-0">
                            {o.count}
                          </span>
                        </label>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Dropdown EDIFICIO */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'building' ? null : 'building')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs',
                filterBuilding !== 'TODOS'
                  ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              )}
            >
              <Building className="w-3.5 h-3.5 text-primary" />
              <span>{filterBuilding === 'TODOS' ? 'Edificio: Todos' : `Edificio: ${filterBuilding}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'building' && (
              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-card border border-border rounded-2xl shadow-xl z-50 space-y-2.5 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Edificio</span>
                  {filterBuilding !== 'TODOS' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterBuilding('TODOS')
                        setCurrentPage(1)
                      }}
                      className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Quitar filtro
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buildingSearchTerm}
                    onChange={(e) => setBuildingSearchTerm(e.target.value)}
                    placeholder="Buscar edificio..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterBuilding('TODOS')
                      setOpenDropdown(null)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      filterBuilding === 'TODOS' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    )}
                  >
                    Todos los Edificios
                  </button>
                  {availableBuildings
                    .filter((b) => !buildingSearchTerm || b.toLowerCase().includes(buildingSearchTerm.toLowerCase()))
                    .map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setFilterBuilding(b)
                          setOpenDropdown(null)
                          setCurrentPage(1)
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                          filterBuilding === b ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                        )}
                      >
                        {b}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Dropdown ESTADO DE PAGO */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs',
                filterStatus !== 'TODOS'
                  ? 'bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>{filterStatus === 'TODOS' ? 'Estado: Todos' : `Estado: ${filterStatus}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute left-0 top-full mt-2 w-56 p-2 bg-card border border-border rounded-2xl shadow-xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100">
                {['TODOS', 'Pagado', 'Pendiente', 'Sin Estado', 'Error'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setFilterStatus(st)
                      setOpenDropdown(null)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      filterStatus === st ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {st === 'TODOS' ? 'Todos los Estados' : st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. Dropdown AÑO */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Año: {filterYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {openDropdown === 'year' && (
              <div className="absolute left-0 top-full mt-2 w-36 p-1.5 bg-card border border-border rounded-xl shadow-xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100">
                {[2026, 2025].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setFilterYear(y)
                      setOpenDropdown(null)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      filterYear === y ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CHIPS DE FILTROS ACTIVOS (CON BOTÓN X PARA DESMARCAR INDIVIDUALMENTE) */}
        {isFiltered && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Filtros activos:
            </span>

            {/* Chips Meses */}
            {selectedMonths.length > 0 && selectedMonths.length < 12 && selectedMonths.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20"
              >
                <span>{MONTH_NAMES_TITLE[m] || m}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonths((prev) => prev.filter((item) => item !== m))
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Eliminar este mes"
                >
                  &times;
                </button>
              </span>
            ))}

            {/* Chips Empresas */}
            {selectedCompanies.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              >
                <span>Empresa: {c}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompanies((prev) => prev.filter((item) => item !== c))
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Eliminar filtro de empresa"
                >
                  &times;
                </button>
              </span>
            ))}

            {/* Chips Propietarios */}
            {selectedOwners.map((o) => (
              <span
                key={o}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <span>Prop: {o}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOwners((prev) => prev.filter((item) => item !== o))
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Eliminar filtro de propietario"
                >
                  &times;
                </button>
              </span>
            ))}

            {/* Chip Edificio */}
            {filterBuilding !== 'TODOS' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span>Edificio: {filterBuilding}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBuilding('TODOS')
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Quitar filtro de edificio"
                >
                  &times;
                </button>
              </span>
            )}

            {/* Chip Estado */}
            {filterStatus !== 'TODOS' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                <span>Estado: {filterStatus}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('TODOS')
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Quitar filtro de estado"
                >
                  &times;
                </button>
              </span>
            )}

            {/* Chip Búsqueda */}
            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                <span>&ldquo;{searchTerm}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                  className="hover:text-destructive cursor-pointer font-black text-xs leading-none"
                  title="Limpiar búsqueda"
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        )}
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

      {/* BANNER DE APERTURA DE MES SI NO HAY VOUCHERS REGISTRADOS EN ESTE PERÍODO */}
      {!monthHasVouchers && (
        <div className="p-5 sm:p-6 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  El período de {MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth} {filterYear} aún no ha sido aperturado
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Mes Nuevo
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Al aperturar el mes, se replicarán automáticamente todas las propiedades con contrato activo en estado <strong className="text-amber-600 dark:text-amber-400 font-bold uppercase">PENDIENTE</strong>, listas para ingresar las transferencias de la cartola.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleBatchGenerate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm shadow-md hover:scale-102 transition-all cursor-pointer shrink-0 disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aperturando Mes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Aperturar Mes de {MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* DISPOSICIÓN: TABLA COMPLETA (EXECUTIVE - IMAGEN 3) O SPLIT */}
      <div className={viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : ''}>
        {/* TABLA PRINCIPAL DE VOUCHERS (IMAGEN 3) */}
        <div className={viewMode === 'split' ? 'lg:col-span-7 xl:col-span-8' : ''}>
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
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
                    <th className="py-3 px-3">Periodo</th>
                    <th className="py-3 px-4">Propiedad / Unidad</th>
                    <th className="py-3 px-4">Arrendatario</th>
                    <th className="py-3 px-4 text-right">Valor Arriendo</th>
                    <th className="py-3 px-4 text-center">Fecha Pago</th>
                    <th className="py-3 px-4 text-center">N° Recibo</th>
                    <th className="py-3 px-4 text-center">N° Factura</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center">
                        {!monthHasVouchers ? (
                          <div className="max-w-md mx-auto space-y-3 px-4">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-black text-foreground">
                              Mes de {MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth} {filterYear} sin arriendos generados
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Haz clic en el botón a continuación para aperturar este mes y replicar automáticamente todas las propiedades en estado pendiente de pago.
                            </p>
                            <button
                              type="button"
                              disabled={isGenerating}
                              onClick={handleBatchGenerate}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Generando arriendos...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Aperturar Mes de {MONTH_NAMES_TITLE[targetApertureMonth] || targetApertureMonth}</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs py-8 block">
                            No se encontraron arriendos o vouchers que coincidan con los filtros aplicados.
                          </span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedVouchers.map((v) => {
                      const c = v.contract
                      const isSelected = selectedIds.has(v.id)
                      const isRowActive = selectedVoucherId === v.id
                      const hasAdjustment = (v.adjustmentPercent && v.adjustmentPercent > 0) || (v.adjustmentAmount && v.adjustmentAmount > 0)
                      const monthFormatted = MONTH_NAMES_TITLE[v.month] || v.month
                      const isPaid = (v.paymentStatus || '').toLowerCase() === 'pagado'
                      const rentAmount = Math.round(v.totalRent || v.totalMonth || c.totalRent || v.baseRent || 0)
                      const ownerDisplayName =
                        (c.newAssignee && c.newAssignee.trim() !== '')
                          ? c.newAssignee.trim()
                          : (v.company?.name || c.company?.name || 'Sin Asignar')

                      return (
                        <tr
                          key={v.id}
                          onClick={() => {
                            setSelectedVoucherId(v.id)
                          }}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-primary/5' : ''
                          } ${isRowActive && viewMode === 'split' ? 'border-l-4 border-l-primary' : ''}`}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3.5 px-3 text-center"
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
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-bold text-foreground text-xs block">
                              {monthFormatted}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {v.year}
                            </span>
                          </td>

                          {/* Propiedad / Unidad */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-foreground text-xs leading-snug">
                              {c.building} · {c.unitNumber ? `${c.propertyType} ${c.unitNumber}` : c.propertyType}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              {c.storageNumber && <span>Bodega {c.storageNumber}</span>}
                              {c.parkingNumber && <span>Estac {c.parkingNumber}</span>}
                              {!c.storageNumber && !c.parkingNumber && <span>Talca, Maule</span>}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {hasAdjustment ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  Reajuste {v.adjustmentPercent > 1 ? `${v.adjustmentPercent}%` : `${(v.adjustmentPercent * 100).toFixed(1)}%`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  Arriendo Base
                                </span>
                              )}
                              <span
                                className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                title="Propietario / Asignatario Oficial"
                              >
                                Prop: {ownerDisplayName}
                              </span>
                            </div>
                          </td>

                          {/* Arrendatario */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full border border-primary/20 bg-primary/5 text-primary flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                                {c.tenantName ? c.tenantName.charAt(0).toUpperCase() : 'A'}
                              </div>
                              <div>
                                <div className="font-bold text-foreground text-xs line-clamp-1">
                                  {c.tenantName}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {c.tenantRut || 'Sin RUT'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Valor Arriendo (Monto esperado) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-black text-foreground text-xs">
                              ${rentAmount.toLocaleString('es-CL')}
                            </div>
                            {isPaid && v.collectedAmount > 0 && v.collectedAmount !== rentAmount && (
                              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Pagado: ${Math.round(v.collectedAmount).toLocaleString('es-CL')}
                              </div>
                            )}
                          </td>

                          {/* Fecha de Pago */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {v.paymentDate ? (
                              <button
                                type="button"
                                onClick={() => setPaymentDateVoucher(v)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold text-xs transition-all cursor-pointer group shadow-2xs font-mono"
                                title="Haga clic para ver o editar el registro de pago"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{formatDisplayDate(v.paymentDate)}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">
                                -
                              </span>
                            )}
                          </td>

                          {/* N° Recibo (Correlativo por Empresa) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {v.receiptNumber ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground font-bold text-xs border border-border/80 font-mono shadow-2xs"
                                title={`Recibo Oficial Nº ${v.receiptNumber}`}
                              >
                                <Receipt className="w-3.5 h-3.5 text-primary" />
                                <span>Rec #{v.receiptNumber}</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await assignVoucherReceiptNumber(v.id)
                                  if (res.success && res.voucher) {
                                    setVouchers((prev) =>
                                      prev.map((item) =>
                                        item.id === v.id ? { ...item, receiptNumber: res.voucher.receiptNumber } : item
                                      )
                                    )
                                    setMessage({
                                      text: `N° de Recibo #${res.voucher.receiptNumber} asignado correlativamente con éxito para ${v.contract.tenantName}`,
                                      type: 'success',
                                    })
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all hover:bg-muted/50 cursor-pointer"
                                title="Asignar el siguiente número correlativo de recibo"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Recibo</span>
                              </button>
                            )}
                          </td>

                          {/* N° Factura (Editable en 1 clic) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {v.invoiceNumber ? (
                              <button
                                type="button"
                                onClick={() => setInvoiceEditingVoucher(v)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 font-bold text-xs transition-all cursor-pointer group font-mono shadow-2xs"
                                title="Haga clic para editar el número de factura"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Fac #{v.invoiceNumber}</span>
                                <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setInvoiceEditingVoucher(v)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all hover:bg-muted/50 cursor-pointer"
                                title="Agregar número de factura emitido posteriormente"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Factura</span>
                              </button>
                            )}
                          </td>

                          {/* Estado Pill */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {renderPaymentBadge(v.paymentStatus)}
                          </td>

                          {/* Acciones */}
                          <td
                            className="py-3.5 px-3 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              {/* Botón Principal: Registrar Pago o Ver Detalle */}
                              <button
                                type="button"
                                onClick={() => setPaymentDateVoucher(v)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-xs transition-all cursor-pointer ${
                                  isPaid
                                    ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                                    : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-102'
                                }`}
                                title={isPaid ? 'Ver y modificar pago registrado' : 'Registrar pago de arriendo en cartola'}
                              >
                                {isPaid ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Ver Pago</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar Pago</span>
                                  </>
                                )}
                              </button>

                              {/* Imprimir Recibo */}
                              <button
                                type="button"
                                onClick={() => setPrintingVoucher(v)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                title="Ver / Imprimir Recibo Oficial (PDF)"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Enviar Comprobante por Correo */}
                              <button
                                type="button"
                                onClick={() => setEmailSendingVoucher(v)}
                                className="p-1.5 text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Enviar comprobante por correo (PDF)"
                              >
                                <Mail className="w-4 h-4" />
                              </button>

                              {/* Editar Liquidación */}
                              <button
                                type="button"
                                onClick={() => setEditingVoucher(v)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                title="Editar liquidación completa"
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
                    onClick={() => setEmailSendingVoucher(selectedVoucher)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar Comprobante por Correo</span>
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
          onReceiptNumberAssigned={(updated) => {
            setVouchers((prev) =>
              prev.map((v) => (v.id === updated.id ? { ...v, receiptNumber: updated.receiptNumber } : v))
            )
            setPrintingVoucher((prev) =>
              prev && prev.id === updated.id ? { ...prev, receiptNumber: updated.receiptNumber } : prev
            )
          }}
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

      {/* MODAL DE EDICIÓN RÁPIDA DE FACTURA */}
      {invoiceEditingVoucher && (
        <InvoiceEditModal
          voucher={invoiceEditingVoucher}
          onClose={() => setInvoiceEditingVoucher(null)}
          onSaved={handleInvoiceSaved}
        />
      )}

      {/* MODAL DE ENVÍO MANUAL DE COMPROBANTE POR CORREO */}
      {emailSendingVoucher && (
        <VoucherEmailModal
          voucher={emailSendingVoucher}
          onClose={() => setEmailSendingVoucher(null)}
          onSent={(updated) => {
            setVouchers((prev) =>
              prev.map((item) => (item.id === updated.id ? { ...item, receiptNumber: updated.receiptNumber } : item))
            )
            setMessage({
              text: `Comprobante N° ${updated.receiptNumber || 'S/N'} despachado con éxito`,
              type: 'success',
            })
          }}
        />
      )}
    </div>
  )
}
