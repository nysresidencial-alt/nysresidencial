'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Download,
  Filter,
  Calendar,
  ChevronDown,
  Search,
  Clock,
  Home,
  Send,
  Building,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import { DashboardMetricData } from '@/app/admin/dashboard/actions'

interface AccountingDashboardProps {
  initialData: DashboardMetricData
}

export function AccountingDashboard({ initialData }: AccountingDashboardProps) {
  const [data] = useState<DashboardMetricData>(initialData)
  const [filterPeriodType, setFilterPeriodType] = useState<'TOTALES' | 'PROMEDIOS'>('TOTALES')
  const [paidByNyS, setPaidByNyS] = useState(false)
  const [eventSearch, setEventSearch] = useState('')

  // Filtros de eventos próximos
  const [eventFilters, setEventFilters] = useState<{
    Reajustes: boolean
    Renovaciones: boolean
    Vouchers: boolean
    Recordatorios: boolean
  }>({
    Reajustes: true,
    Renovaciones: true,
    Vouchers: false,
    Recordatorios: true,
  })

  function toggleEventFilter(key: keyof typeof eventFilters) {
    setEventFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Eventos filtrados
  const filteredEvents = useMemo(() => {
    return data.upcomingEvents.filter((evt) => {
      // Filtrar por categoría
      if (!eventFilters[evt.eventType]) return false
      // Filtrar por texto de búsqueda
      if (eventSearch.trim()) {
        const q = eventSearch.toLowerCase()
        return (
          evt.propertyTitle.toLowerCase().includes(q) ||
          evt.unitInfo.toLowerCase().includes(q) ||
          evt.description.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data.upcomingEvents, eventFilters, eventSearch])

  // Formateador CLP
  function formatCLP(val: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Altura máxima para el gráfico ($60M)
  const MAX_CHART_VALUE = 60000000

  return (
    <div className="space-y-5 pb-12">
      {/* 1. HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Revisa tus indicadores y vouchers
          </p>
        </div>

        {/* Botón Descargar Reporte */}
        <button
          type="button"
          onClick={() => alert('Descargando reporte consolidado de contabilidad...')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Descargar</span>
        </button>
      </div>

      {/* 2. BARRA DE FILTROS RÁPIDOS */}
      <div className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-foreground font-bold">Filtrar</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        <div className="text-[11px] text-muted-foreground">
          Período activo: <span className="font-bold text-foreground">Año 2026</span>
        </div>
      </div>

      {/* 3. GRILLA PRINCIPAL (2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA (8 COLS): GRÁFICO + TARJETAS DE RESUMEN */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* CARD 1: RESUMEN POR PERIODO CON GRÁFICO DE BARRAS */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            
            {/* Header del gráfico */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-border/60">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  RESUMEN POR PERIODO
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary mt-0.5">
                  <span>enero 2026</span>
                  <span className="text-muted-foreground font-normal">hasta</span>
                  <span>diciembre 2026</span>
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </div>
              </div>

              {/* Controles de Totales y Checkbox */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setFilterPeriodType((prev) => (prev === 'TOTALES' ? 'PROMEDIOS' : 'TOTALES'))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span>{filterPeriodType}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={paidByNyS}
                    onChange={(e) => setPaidByNyS(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span>Pagado por NyS</span>
                </label>
              </div>
            </div>

            {/* Gráfico de Barras Mensuales */}
            <div className="pt-2">
              <div className="h-56 w-full flex items-end gap-1.5 sm:gap-2.5 relative pb-6 border-b border-border/60">
                {/* Eje Y (Etiquetas monetarias de referencia a la derecha) */}
                <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-muted-foreground font-semibold pointer-events-none select-none text-right pr-1">
                  <span>$60M</span>
                  <span>$50M</span>
                  <span>$40M</span>
                  <span>$30M</span>
                  <span>$20M</span>
                  <span>$10M</span>
                  <span>$0</span>
                </div>

                {/* Líneas guía horizontales sutiles */}
                <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                  <div className="border-b border-border w-full" />
                </div>

                {/* 12 Columnas de meses */}
                <div className="w-full pr-12 flex items-end justify-between gap-1 sm:gap-2 h-full z-10">
                  {data.monthlyData.map((item) => {
                    const totalMonth =
                      item.liquidado +
                      item.pagado +
                      item.expirado +
                      item.enviado +
                      item.generado +
                      item.anulado

                    const heightPercent = Math.min(
                      100,
                      Math.max(0, (totalMonth / MAX_CHART_VALUE) * 100)
                    )

                    // Cálculo proporcional apilado
                    const pagadoPct = totalMonth > 0 ? (item.pagado / totalMonth) * 100 : 0
                    const expiradoPct = totalMonth > 0 ? (item.expirado / totalMonth) * 100 : 0
                    const liquidadoPct = totalMonth > 0 ? (item.liquidado / totalMonth) * 100 : 0

                    return (
                      <div
                        key={item.monthKey}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Tooltip flotante */}
                        {totalMonth > 0 && (
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border shadow-lg rounded-lg px-2 py-1 text-[10px] font-bold text-foreground pointer-events-none z-20 whitespace-nowrap">
                            {item.label}: {formatCLP(totalMonth)}
                          </div>
                        )}

                        {/* Barra apilada con esquinas superiores redondeadas */}
                        {totalMonth > 0 ? (
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[32px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-110 shadow-2xs"
                          >
                            {/* Segmento Expirado (Rojo / Rose) */}
                            {expiradoPct > 0 && (
                              <div
                                style={{ height: `${expiradoPct}%` }}
                                className="w-full bg-[#EF4444]"
                                title={`Expirado: ${formatCLP(item.expirado)}`}
                              />
                            )}
                            {/* Segmento Liquidado (Verde Esmeralda) */}
                            {liquidadoPct > 0 && (
                              <div
                                style={{ height: `${liquidadoPct}%` }}
                                className="w-full bg-[#10B981]"
                                title={`Liquidado: ${formatCLP(item.liquidado)}`}
                              />
                            )}
                            {/* Segmento Pagado (NyS Magenta / Primario) */}
                            {pagadoPct > 0 && (
                              <div
                                style={{ height: `${pagadoPct}%` }}
                                className="w-full bg-[#CE1156]"
                                title={`Pagado: ${formatCLP(item.pagado)}`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full max-w-[32px] h-0.5 bg-muted rounded-full" />
                        )}

                        {/* Etiqueta del mes debajo */}
                        <span className="text-[10px] font-semibold text-muted-foreground mt-2 group-hover:text-foreground transition-colors truncate max-w-full text-center">
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Leyenda de Colores (Paleta Oficial NyS) */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-[11px] font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#10B981]" />
                  <span>Liquidado</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#CE1156]" />
                  <span className="font-bold text-foreground">Pagado</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#EF4444]" />
                  <span>Expirado</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#26C6DA]" />
                  <span>Enviado</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#F59E0B]" />
                  <span>Generado</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#94A3B8]" />
                  <span>Anulado</span>
                </span>
              </div>
            </div>
          </div>

          {/* SUB-GRID: RESUMEN VOUCHERS + RESUMEN GENERAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* CARD 2: RESUMEN VOUCHERS (DONUT GAUGE NYS) */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  RESUMEN VOUCHERS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  Nov. 2026
                </span>
              </div>

              {/* Gráfico Donut circular SVG con colores NyS */}
              <div className="relative flex items-center justify-center py-4">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Círculo de fondo sutil */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-muted/30"
                  />
                  {/* Círculo de progreso en Magenta NyS (#CE1156) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#CE1156"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="30"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Texto central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-semibold text-muted-foreground">Total</span>
                  <span className="text-2xl font-black text-foreground tracking-tight">
                    {data.totalVouchersPeriod}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Estado de cobro</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  100% Recaudado
                </span>
              </div>
            </div>

            {/* CARD 3: RESUMEN GENERAL (MÉTRICAS MENSUALES) */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  RESUMEN GENERAL
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Resumen de tus métricas mensuales
                </p>

                <p className="text-xs text-foreground mt-4 leading-relaxed font-medium">
                  El mes anterior generaste{' '}
                  <strong className="text-foreground font-black">{data.totalVouchersPeriod}</strong>{' '}
                  vouchers, de los cuales{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">{data.paidVouchers}</strong> se
                  pagaron y{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-black">{data.pendingVouchers}</strong> están
                  pendientes.
                </p>
              </div>

              {/* Caja de Vouchers Enviados */}
              <div className="mt-6 pt-4 border-t border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Send className="w-5 h-5 -rotate-12" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      VOUCHERS ENVIADOS
                    </span>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-black text-foreground tracking-tight truncate">
                        {formatCLP(data.sentVouchersTotalAmount)}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">100%</span>
                    </div>
                  </div>
                </div>

                {/* Barra de progreso en color Magenta NyS */}
                <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-primary h-full rounded-full w-full shadow-2xs" />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* COLUMNA DERECHA (4 COLS): PRÓXIMOS EVENTOS */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col h-full space-y-4">
            
            {/* Header Eventos */}
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                Próximos eventos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Eventos relevantes de tus contratos y vouchers
              </p>
            </div>

            {/* Buscador de Eventos */}
            <div className="relative">
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Buscar"
                className="w-full pl-9 pr-9 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Clock className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Checkboxes de Categorías en 2x2 */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-foreground py-1 border-b border-border/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eventFilters.Reajustes}
                  onChange={() => toggleEventFilter('Reajustes')}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Reajustes</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eventFilters.Renovaciones}
                  onChange={() => toggleEventFilter('Renovaciones')}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Renovaciones</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eventFilters.Vouchers}
                  onChange={() => toggleEventFilter('Vouchers')}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Vouchers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={eventFilters.Recordatorios}
                  onChange={() => toggleEventFilter('Recordatorios')}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Recordatorios</span>
              </label>
            </div>

            {/* Lista Scrollable de Eventos */}
            <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
              {filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No hay eventos con los filtros seleccionados.
                </div>
              ) : (
                filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors flex items-start gap-3 relative group"
                  >
                    {/* Icono Inmueble con estilo de marca NyS */}
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Home className="w-4 h-4" />
                    </div>

                    {/* Contenido del Evento */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground leading-tight truncate">
                        {evt.propertyTitle}, {evt.unitInfo}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        {evt.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {evt.dateString}
                        </span>
                        {evt.downloadUrl && (
                          <button
                            type="button"
                            onClick={() => alert(`Descargando documento de ${evt.propertyTitle}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline cursor-pointer"
                          >
                            <span>Descargar</span>
                            <Download className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
