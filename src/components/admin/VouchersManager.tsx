'use client'

import React, { useState, useMemo } from 'react'
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
  ChevronRight,
  TrendingUp,
  Receipt,
  Phone,
  FileSpreadsheet,
} from 'lucide-react'
import { VoucherDetail, VoucherPrintModal } from './VoucherPrintModal'
import { VoucherEditModal } from './VoucherEditModal'
import { VoucherStatusModal } from './VoucherStatusModal'
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

  // Modales
  const [printingVoucher, setPrintingVoucher] = useState<VoucherDetail | null>(null)
  const [editingVoucher, setEditingVoucher] = useState<VoucherDetail | null>(null)
  const [statusChangingVoucher, setStatusChangingVoucher] = useState<VoucherDetail | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Opciones de filtro dependientes (en cascada)
  const availableBuildings = useMemo(() => {
    let pool = vouchers
    if (filterCompany !== 'TODAS') {
      pool = pool.filter((v) => (v.company || v.contract.company)?.code === filterCompany)
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
      pool = pool.filter((v) => (v.company || v.contract.company)?.code === filterCompany)
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
    if (newCompany !== 'TODAS') {
      const validForNewCompany = new Set(
        vouchers
          .filter((v) => (v.company || v.contract.company)?.code === newCompany)
          .map((v) => v.contract.building)
      )
      if (filterBuilding !== 'TODOS' && !validForNewCompany.has(filterBuilding)) {
        setFilterBuilding('TODOS')
      }
    }
  }

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

      if (filterCompany !== 'TODAS' && comp?.code !== filterCompany) return false
      if (filterBuilding !== 'TODOS' && c.building !== filterBuilding) return false
      if (filterMonth !== 'TODOS' && v.month !== filterMonth) return false
      if (v.year !== filterYear) return false
      if (filterStatus !== 'TODOS' && v.paymentStatus !== filterStatus) return false

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = c.tenantName.toLowerCase().includes(query)
        const matchRut = c.tenantRut?.toLowerCase().includes(query)
        const matchUnit = `${c.building} ${c.unitNumber}`.toLowerCase().includes(query)
        const matchReceipt = v.receiptNumber?.toLowerCase().includes(query)
        if (!matchName && !matchRut && !matchUnit && !matchReceipt) return false
      }

      return true
    })
  }, [vouchers, filterCompany, filterBuilding, filterMonth, filterYear, filterStatus, searchTerm])

  const selectedVoucher = useMemo(() => {
    return (
      filteredVouchers.find((v) => v.id === selectedVoucherId) ||
      filteredVouchers[0] ||
      null
    )
  }, [filteredVouchers, selectedVoucherId])

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
      // Refrescar página para traer nuevos datos
      window.location.reload()
    }
  }

  // URL para exportar a Excel
  const excelExportUrl = `/api/vouchers/export?month=${filterMonth}&year=${filterYear}&building=${filterBuilding}&company=${filterCompany}`

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* HEADER DE LA VISTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Receipt className="w-8 h-8 text-primary" />
            <span>Gestión de Vouchers & Liquidaciones</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control mensual de recaudación, recibos de arriendo y emisión de comprobantes oficiales.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={excelExportUrl}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-background hover:bg-muted text-foreground border border-border text-xs font-bold rounded-xl shadow-xs transition-colors"
            title="Exportar la tabla actual a formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </a>

          <button
            onClick={handleBatchGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Generar Vouchers de {filterMonth}</span>
          </button>
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

      {/* TARJETAS DE MÉTRICAS KPI (MOCKUP STYLE) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border/70 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Pendientes de Cobro
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.pendingCount}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Por conciliar o cobrar
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Pagados / Recaudados
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.paidCount}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              ${stats.collectedAmount.toLocaleString('es-CL')} ingresados
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Total Vouchers
            </span>
            <span className="text-2xl font-black text-foreground">
              {stats.totalCount}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              En cartera actual
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 p-5 rounded-2xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Monto del Período ({filterMonth})
            </span>
            <span className="text-xl sm:text-2xl font-black text-primary">
              ${stats.totalAmount.toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Total líquido facturado
            </span>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-card border border-border/80 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Mes */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Mes
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="TODOS">Todos los meses</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Año
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Empresa */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Empresa / Propietario
            </label>
            <select
              value={filterCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="TODAS">Todas las empresas</option>
              {companies.map((comp) => (
                <option key={comp.id} value={comp.code}>
                  {comp.name} ({comp.code})
                </option>
              ))}
            </select>
          </div>

          {/* Edificio dependiente */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Edificio / Inmueble
            </label>
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="TODOS">
                {filterCompany === 'TODAS'
                  ? 'Todos los edificios'
                  : `Edificios de ${filterCompany} (${availableBuildings.length})`}
              </option>
              {availableBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Estado de Pago dependiente */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Estado de Pago
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
            >
              <option value="TODOS">Todos los estados</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Búsqueda rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Arrendatario, RUT..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* DISPOSICIÓN MASTER-DETAIL: TABLA IZQUIERDA (62%) + PREVIEW DERECHA (38%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LISTADO DE VOUCHERS (65%) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <span className="text-xs font-bold text-foreground">
              Vouchers Emitidos ({filteredVouchers.length} resultados)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Selecciona una fila para ver el comprobante
            </span>
          </div>

          <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold sticky top-0 z-10 border-b border-border">
                <tr>
                  <th className="py-3 px-3.5">Nº Recibo</th>
                  <th className="py-3 px-3.5">Arrendatario</th>
                  <th className="py-3 px-3.5">Propiedad / Unidad</th>
                  <th className="py-3 px-3.5 text-right">Monto Total</th>
                  <th className="py-3 px-3.5 text-center">Estado</th>
                  <th className="py-3 px-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No se encontraron vouchers con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((v) => {
                    const c = v.contract
                    const isSelected = selectedVoucher?.id === v.id
                    const isPaid = v.paymentStatus === 'Pagado'

                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVoucherId(v.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold text-foreground">
                          {v.receiptNumber ? (
                            <span className="px-2 py-0.5 rounded bg-muted font-mono">
                              #{v.receiptNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">S/N</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-foreground block line-clamp-1">
                            {c.tenantName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.tenantRut || c.tenantPhone || 'Sin datos'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="font-bold text-foreground block">
                            {c.building} · {c.unitNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {c.propertyType}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right font-black text-foreground">
                          ${v.totalMonth.toLocaleString('es-CL')}
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setStatusChangingVoucher(v)
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 cursor-pointer shadow-xs ${
                              v.paymentStatus === 'Pagado'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                : v.paymentStatus === 'Pendiente'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                : v.paymentStatus === 'Saldo a Favor'
                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20'
                                : v.paymentStatus === 'Disponible'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20 hover:bg-zinc-500/20'
                            }`}
                            title="Haz clic para modificar el estado del voucher"
                          >
                            <span>{v.paymentStatus}</span>
                            <Edit className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <div
                            className="inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setPrintingVoucher(v)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
                              title="Imprimir / Ver Recibo Oficial"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingVoucher(v)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                              title="Editar datos de este cliente/recibo"
                            >
                              <Edit className="w-3.5 h-3.5" />
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

        {/* DETALLE Y PREVISUALIZACIÓN LATERAL (35-40%) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
          {selectedVoucher ? (
            <div className="bg-card border border-border rounded-2xl shadow-md p-6 space-y-6">
              {/* Header del detalle */}
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    Detalle de Liquidación
                  </span>
                  <h3 className="text-lg font-black text-foreground mt-0.5">
                    {selectedVoucher.contract.building} · Unidad {selectedVoucher.contract.unitNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Período: {selectedVoucher.month} {selectedVoucher.year}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedVoucher.paymentStatus === 'Pagado'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : selectedVoucher.paymentStatus === 'Pendiente'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : selectedVoucher.paymentStatus === 'Saldo a Favor'
                        ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                        : selectedVoucher.paymentStatus === 'Disponible'
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                        : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                    }`}
                  >
                    {selectedVoucher.paymentStatus}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusChangingVoucher(selectedVoucher)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Cambiar Estado</span>
                  </button>
                </div>
              </div>

              {/* Ficha del Arrendatario */}
              <div className="space-y-2 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="font-bold text-foreground">
                    {selectedVoucher.contract.tenantName}
                  </span>
                </div>
                {selectedVoucher.contract.tenantRut && (
                  <p className="text-muted-foreground pl-6">
                    RUT: {selectedVoucher.contract.tenantRut}
                  </p>
                )}
                {selectedVoucher.contract.tenantPhone && (
                  <p className="text-muted-foreground pl-6 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span>{selectedVoucher.contract.tenantPhone}</span>
                  </p>
                )}
                {selectedVoucher.contract.tenantEmail && (
                  <p className="text-muted-foreground pl-6 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span>{selectedVoucher.contract.tenantEmail}</span>
                  </p>
                )}
                {selectedVoucher.contract.guarantorRelation && (
                  <p className="text-muted-foreground pl-6 pt-1 border-t border-border/60">
                    Aval: {selectedVoucher.contract.guarantorRelation} ({selectedVoucher.contract.guarantorPhone || 'Sin tel.'})
                  </p>
                )}
              </div>

              {/* Desglose Financiero */}
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
                {selectedVoucher.guaranteeAmount && selectedVoucher.guaranteeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garantía / Mes de garantía:</span>
                    <span className="font-semibold text-foreground">
                      +${selectedVoucher.guaranteeAmount.toLocaleString('es-CL')}
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

              {/* Acciones principales del voucher */}
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
                  <span>Editar Datos del Cliente / Recibo</span>
                </button>

                {selectedVoucher.contract.tenantEmail && (
                  <a
                    href={`mailto:${selectedVoucher.contract.tenantEmail}?subject=Recibo de Arriendo - ${selectedVoucher.month} ${selectedVoucher.year}&body=Estimado(a) ${selectedVoucher.contract.tenantName}, adjuntamos su comprobante de arriendo correspondiente a ${selectedVoucher.month} ${selectedVoucher.year} de la unidad ${selectedVoucher.contract.building} ${selectedVoucher.contract.unitNumber}.`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Correo con Notificación</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
              Selecciona un voucher para ver su detalle.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE IMPRESIÓN OFICIAL DEL VOUCHER */}
      {printingVoucher && (
        <VoucherPrintModal
          voucher={printingVoucher}
          onClose={() => setPrintingVoucher(null)}
        />
      )}

      {/* MODAL DE CAMBIO DE ESTADO CON ADVERTENCIA */}
      {statusChangingVoucher && (
        <VoucherStatusModal
          voucher={statusChangingVoucher}
          onClose={() => setStatusChangingVoucher(null)}
          onUpdated={handleVoucherStatusUpdated}
        />
      )}

      {/* MODAL DE EDICIÓN COMPLETA */}
      {editingVoucher && (
        <VoucherEditModal
          voucher={editingVoucher}
          onClose={() => setEditingVoucher(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </div>
  )
}
