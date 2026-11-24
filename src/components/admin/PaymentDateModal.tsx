'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  User,
  DollarSign,
  Trash2,
  CreditCard,
  History,
  FileText,
  Phone,
  Mail,
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
} from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { registerVoucherPayment, updateVoucher } from '@/app/admin/vouchers/actions'
import { generateVoucherPdfBase64 } from '@/lib/voucher-pdf'

interface PaymentDateModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onSaved: (updatedVoucher: VoucherDetail) => void
}

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

const MONTH_NUMBERS: Record<string, string> = {
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

const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function parseIsoToClDate(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  if (isoDate.includes('/')) return isoDate
  if (isoDate.includes('-')) {
    const parts = isoDate.split('T')[0].split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
  }
  return isoDate
}

function parseClDateToIso(clDate: string): string | null {
  const parts = clDate.trim().split('/')
  if (parts.length !== 3) return null
  const day = Number(parts[0])
  const month = Number(parts[1])
  const year = Number(parts[2])
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function PaymentDateModal({ voucher, onClose, onSaved }: PaymentDateModalProps) {
  const c = voucher.contract
  const monthName = MONTH_NAMES_TITLE[voucher.month] || voucher.month
  const monthNum = MONTH_NUMBERS[voucher.month] || '11'
  const expectedRent = Math.round(voucher.totalRent || voucher.totalMonth || c.totalRent || voucher.baseRent || 0)

  // 1. FECHA DE PAGO (Formato DD/MM/AAAA)
  const initialDateStr = voucher.paymentDate ? parseIsoToClDate(voucher.paymentDate) : ''
  const [dateInput, setDateInput] = useState<string>(initialDateStr)
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Calendario interactivo (mes y año que se está explorando)
  const targetYear = voucher.year || new Date().getFullYear()
  const targetMonthIndex = Number(monthNum) - 1 >= 0 && Number(monthNum) - 1 <= 11 ? Number(monthNum) - 1 : new Date().getMonth()
  const [calendarYear, setCalendarYear] = useState<number>(targetYear)
  const [calendarMonth, setCalendarMonth] = useState<number>(targetMonthIndex)

  // 2. TOTAL PAGADO: No prellenado por solicitud del usuario (empieza vacío)
  const [collectedAmount, setCollectedAmount] = useState<string>(
    voucher.collectedAmount > 0 ? String(Math.round(voucher.collectedAmount)) : ''
  )

  // 3. FACTURA Y OTROS CAMPOS
  const [invoiceNumber, setInvoiceNumber] = useState<string>(voucher.invoiceNumber || '')
  const [bank, setBank] = useState<string>(voucher.bank || 'SANTANDER')
  const [paymentMethod, setPaymentMethod] = useState<string>(voucher.paymentMethod || 'Transferencia')
  const [comment, setComment] = useState<string>(voucher.comment || '')

  // Enviar comprobante por correo (Activo por defecto)
  const [sendEmail, setSendEmail] = useState<boolean>(true)
  const [voucherForPdf, setVoucherForPdf] = useState<VoucherDetail | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)

  const hasExistingPayment = Boolean(voucher.paymentDate)

  // Cerrar calendario si hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Manejo de escritura manual con separadores automáticos
  function handleDateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Si el usuario escribe directamente con barras
    if (raw.includes('/')) {
      const sanitized = raw.replace(/[^\d/]/g, '').slice(0, 10)
      setDateInput(sanitized)
      return
    }

    // Si escribe números continuos sin barras, autoinsertar los separadores
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) {
      setDateInput(digits)
    } else if (digits.length <= 4) {
      setDateInput(`${digits.slice(0, 2)}/${digits.slice(2)}`)
    } else {
      setDateInput(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`)
    }
  }

  // Atajos rápidos de fecha
  function setQuickDate(type: 'today' | 'day5' | 'yesterday') {
    const now = new Date()
    if (type === 'today') {
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = String(now.getFullYear())
      setDateInput(`${d}/${m}/${y}`)
      setCalendarMonth(now.getMonth())
      setCalendarYear(now.getFullYear())
    } else if (type === 'day5') {
      setDateInput(`05/${monthNum}/${voucher.year}`)
      setCalendarMonth(Number(monthNum) - 1)
      setCalendarYear(voucher.year)
    } else if (type === 'yesterday') {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const d = String(yesterday.getDate()).padStart(2, '0')
      const m = String(yesterday.getMonth() + 1).padStart(2, '0')
      const y = String(yesterday.getFullYear())
      setDateInput(`${d}/${m}/${y}`)
      setCalendarMonth(yesterday.getMonth())
      setCalendarYear(yesterday.getFullYear())
    }
    setShowCalendar(false)
  }

  // Navegación en el calendario
  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((y) => y - 1)
    } else {
      setCalendarMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((y) => y + 1)
    } else {
      setCalendarMonth((m) => m + 1)
    }
  }

  function selectCalendarDay(day: number) {
    const dStr = String(day).padStart(2, '0')
    const mStr = String(calendarMonth + 1).padStart(2, '0')
    const yStr = String(calendarYear)
    setDateInput(`${dStr}/${mStr}/${yStr}`)
    setShowCalendar(false)
  }

  // Guardar pago
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // Validar fecha ingresada en DD/MM/AAAA
    const isoDate = parseClDateToIso(dateInput)
    if (!isoDate) {
      setError('Debes ingresar una fecha de pago válida en formato DD/MM/AAAA (ej: 05/10/2026).')
      return
    }

    // Validar monto pagado ingresado
    const numCollected = Number(collectedAmount)
    if (!collectedAmount || isNaN(numCollected) || numCollected <= 0) {
      setError('Debes ingresar el monto total pagado por el cliente.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await registerVoucherPayment(voucher.id, {
        paymentDate: isoDate,
        collectedAmount: numCollected,
        invoiceNumber: invoiceNumber.trim() || undefined,
        bank,
        paymentMethod,
        comment: comment.trim() || undefined,
      })

      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      if (res?.voucher) {
        const isNA = paymentMethod === 'No Aplica' || paymentMethod.toLowerCase().includes('no aplica')
        const updatedVoucher: VoucherDetail = {
          ...voucher,
          contract: {
            ...voucher.contract,
            ...((res.voucher as any).contract || {}),
          },
          company: (res.voucher as any).company || voucher.company,
          receiptNumber: res.voucher.receiptNumber || voucher.receiptNumber,
          paymentDate: isoDate,
          paymentStatus: 'Pagado',
          collectedAmount: numCollected,
          transferAmount: isNA ? 0 : paymentMethod === 'Transferencia' ? numCollected : 0,
          cashAmount: isNA ? 0 : paymentMethod === 'Efectivo' ? numCollected : 0,
          depositAmount: isNA ? 0 : paymentMethod === 'Documento' ? numCollected : 0,
          pendingBalance: Math.max(0, expectedRent - numCollected),
          invoiceNumber: invoiceNumber.trim() || null,
          bank,
          paymentMethod,
          comment: comment.trim() || null,
          totalMonth: expectedRent,
          amountInWords: res.voucher.amountInWords || voucher.amountInWords,
        }

        // Si el switch de correo está activado, generamos el PDF vectorial idéntico y despachamos
        if (sendEmail) {
          try {
            setIsSendingEmail(true)
            const pdfBase64 = generateVoucherPdfBase64(updatedVoucher, dateInput)

            await fetch('/api/admin/vouchers/send-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                voucherId: voucher.id,
                pdfBase64,
                receiptNumber: updatedVoucher.receiptNumber,
                tenantName: c.tenantName,
                tenantEmail: c.tenantEmail,
                building: c.building,
                unitNumber: c.unitNumber,
                month: voucher.month,
                year: voucher.year,
                totalAmount: numCollected,
                paymentDate: dateInput,
              }),
            })
          } catch (emailErr) {
            console.error('Error al generar o enviar comprobante por correo:', emailErr)
          } finally {
            setIsSendingEmail(false)
          }
        }

        onSaved(updatedVoucher)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el pago')
      setIsSubmitting(false)
    }
  }

  // Quitar pago (Desmarcar arriendo)
  async function handleClearPayment() {
    if (!confirm('¿Deseas anular el registro de pago y volver a dejar este arriendo como pendiente?')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await updateVoucher(voucher.id, {
        paymentDate: '',
        paymentStatus: 'Pendiente',
        collectedAmount: 0,
        transferAmount: 0,
        cashAmount: 0,
        depositAmount: 0,
        pendingBalance: voucher.totalMonth,
      })

      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      onSaved({
        ...voucher,
        paymentDate: null,
        paymentStatus: 'Pendiente',
        collectedAmount: 0,
        pendingBalance: voucher.totalMonth,
      })
    } catch (err: any) {
      setError(err?.message || 'Error al anular el pago')
      setIsSubmitting(false)
    }
  }

  // Cómputo de la grilla de días para el mini calendario
  const firstDayOfMonth = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7 // Lunes = 0
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const historyList = (c.vouchersHistory || []).filter((h) => h.id !== voucher.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  Registrar Pago de Arriendo
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {monthName} {voucher.year}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.building} · Unidad {c.unitNumber} ({c.propertyType})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENIDO CON SCROLL */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* 1. FICHA DESTACADA DE LA PROPIEDAD Y VALOR A PAGAR */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-4.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/15">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                  Valor a Pagar de Arriendo ({voucher.year})
                </span>
                <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-0.5">
                  ${expectedRent.toLocaleString('es-CL')}
                  <span className="text-xs font-bold text-muted-foreground ml-1.5">CLP</span>
                </div>
                {voucher.totalRent > 0 && voucher.baseRent > 0 && voucher.totalRent !== voucher.baseRent && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Base: ${Math.round(voucher.baseRent).toLocaleString('es-CL')}
                    {voucher.adjustmentAmount > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                        +${Math.round(voucher.adjustmentAmount).toLocaleString('es-CL')} reajuste
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Estado Actual del Período
                </span>
                <div className="inline-flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs ${
                      voucher.paymentStatus === 'Pagado'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {voucher.paymentStatus === 'Pagado' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pagado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Datos de contacto y unidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Arrendatario Titular
                </span>
                <span className="font-bold text-foreground block line-clamp-1">
                  {c.tenantName}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span className="font-mono">{c.tenantRut || 'Sin RUT'}</span>
                  {c.tenantPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.tenantPhone}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-background/80 border border-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                  Unidad y Adicionales
                </span>
                <span className="font-bold text-foreground block">
                  {c.building} · {c.propertyType} {c.unitNumber}
                </span>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span>Bodega: <strong className="text-foreground">{c.storageNumber || 'N/A'}</strong></span>
                  <span>Estac: <strong className="text-foreground">{c.parkingNumber || 'N/A'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. HISTORIAL DE ÚLTIMOS PAGOS */}
          <div className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-3.5 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span>Últimos Pagos Registrados ({historyList.length})</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (Histórico de transferencias acreditadas)
                </span>
              </div>
              <span className="text-xs text-primary">
                {showHistory ? 'Ocultar' : 'Ver detalle'}
              </span>
            </button>

            {showHistory && (
              <div className="p-3 border-t border-border bg-background">
                {historyList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No se registran pagos previos anteriores en el sistema para esta propiedad.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase font-bold text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="pb-1.5 font-bold">Mes / Periodo</th>
                          <th className="pb-1.5 font-bold">Fecha Pago</th>
                          <th className="pb-1.5 font-bold text-right">Monto Pagado</th>
                          <th className="pb-1.5 font-bold">Recibo / Factura</th>
                          <th className="pb-1.5 font-bold text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-[11px]">
                        {historyList.slice(0, 5).map((h) => (
                          <tr key={h.id} className="hover:bg-muted/30">
                            <td className="py-2 font-semibold text-foreground">
                              {MONTH_NAMES_TITLE[h.month] || h.month} {h.year}
                            </td>
                            <td className="py-2 font-mono text-muted-foreground">
                              {h.paymentDate ? parseIsoToClDate(h.paymentDate) : '-'}
                            </td>
                            <td className="py-2 text-right font-black text-foreground">
                              ${Math.round(h.collectedAmount || h.totalMonth).toLocaleString('es-CL')}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                {h.receiptNumber ? `Rec #${h.receiptNumber}` : 'Sin Rec.'}
                                {h.invoiceNumber && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 font-mono font-bold text-[10px]">
                                    Fac #{h.invoiceNumber}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  h.paymentStatus === 'Pagado'
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {h.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3. FORMULARIO DE REGISTRO DE PAGO (CAMPOS DEL EXCEL) */}
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Datos del Abono / Transferencia</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                (Completar según cartola bancaria)
              </span>
            </div>

            {/* Fila 1: Fecha de Pago (Manual o Calendario) y Total Pagado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* CAMPO FECHA DE PAGO CON FORMATO VISIBLE Y POPUP DE CALENDARIO */}
              <div className="space-y-1.5 relative" ref={calendarRef}>
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Fecha de Pago (Cartola) *</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-foreground font-bold border border-border">
                    Formato: DD/MM/AAAA
                  </span>
                </label>

                {/* Input con botón integrado para abrir calendario modal/popover */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA (ej: 05/10/2026)"
                    value={dateInput}
                    onChange={handleDateInputChange}
                    maxLength={10}
                    className="w-full pl-3.5 pr-11 py-2.5 text-xs font-bold bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    title="Abrir calendario interactivo"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                </div>

                {/* MODAL / POPOVER DEL CALENDARIO INTERACTIVO */}
                {showCalendar && (
                  <div className="absolute left-0 top-full z-40 mt-1.5 w-72 p-3 bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-100">
                    {/* Header del Calendario */}
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">
                        {SPANISH_MONTHS[calendarMonth]} {calendarYear}
                      </span>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
                      {DAYS_OF_WEEK.map((day) => (
                        <span key={day} className="text-[10px] font-bold text-muted-foreground uppercase">
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Grilla de Días */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {/* Espacios vacíos para el offset inicial */}
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-7 w-7" />
                      ))}

                      {/* Días del mes */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1
                        const dStr = String(dayNum).padStart(2, '0')
                        const mStr = String(calendarMonth + 1).padStart(2, '0')
                        const formatted = `${dStr}/${mStr}/${calendarYear}`
                        const isSelected = dateInput === formatted

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => selectCalendarDay(dayNum)}
                            className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary text-primary-foreground font-black shadow-xs scale-105'
                                : 'text-foreground hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {dayNum}
                          </button>
                        )
                      })}
                    </div>

                    {/* Footer rápido dentro del calendario */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-border text-[11px]">
                      <button
                        type="button"
                        onClick={() => setQuickDate('today')}
                        className="text-primary hover:underline font-bold cursor-pointer"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCalendar(false)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                {/* Atajos de fecha */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">Atajos:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDate('day5')}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    Día 5
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('today')}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('yesterday')}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                  >
                    Ayer
                  </button>
                </div>
              </div>

              {/* CAMPO TOTAL PAGADO: SIN PRELLENADO POR SOLICITUD */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Total Pagado por el Cliente *</span>
                  <button
                    type="button"
                    onClick={() => setCollectedAmount(String(expectedRent))}
                    className="text-[10px] text-primary hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                    title="Copiar exactamente el valor esperado del arriendo"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar valor arriendo (${expectedRent.toLocaleString('es-CL')})</span>
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    placeholder={`Ej: ${expectedRent}`}
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(e.target.value)}
                    className="w-full pl-7 pr-3.5 py-2.5 text-sm font-black bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Monto a registrar:</span>
                  {collectedAmount && Number(collectedAmount) > 0 ? (
                    <strong className="text-foreground">${Number(collectedAmount).toLocaleString('es-CL')} CLP</strong>
                  ) : (
                    <span className="italic text-muted-foreground">Sin ingresar</span>
                  )}
                </div>
              </div>
            </div>

            {/* Fila 2: Factura (Opcional) y Medio de Pago (Banco eliminado por solicitud) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* N° de Factura (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>N° de Factura Electrónica</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-bold uppercase">
                    Opcional
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: 14502 (puede agregarse después)"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Si la factura se emite tarde por el SII, déjala vacía. Podrás ingresarla luego directamente con un clic en la tabla.
                </p>
              </div>

              {/* Medio de Pago */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Medio de Pago en Voucher
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Transferencia">Transferencia Electrónica (Marca casilla Transferencia)</option>
                  <option value="Efectivo">Efectivo en Oficina (Marca casilla Efectivo)</option>
                  <option value="Documento">Depósito / Cheque (Marca casilla Documento)</option>
                  <option value="No Aplica">No Aplica (Dejar casillas en blanco sin marcar)</option>
                </select>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Selecciona &quot;No Aplica&quot; si deseas que el recibo de arriendo quede sin casillas marcadas.
                </p>
              </div>
            </div>

            {/* SWITCH ENVÍO DE COMPROBANTE POR CORREO */}
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Enviar comprobante por correo (Voucher PDF)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  El recibo oficial timbrado con <strong className="text-emerald-600 dark:text-emerald-400">PAGADO</strong> se enviará automáticamente en formato PDF según la configuración activa.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Aviso informativo */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Al confirmar el pago con su fecha de acreditación, este arriendo pasará automáticamente al estado <strong className="text-emerald-700 dark:text-emerald-400 uppercase">PAGADO</strong> y se registrará en las métricas de recaudación del Dashboard.
              </p>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border shrink-0">
              {hasExistingPayment ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClearPayment}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Anular fecha y volver a dejar pendiente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Anular Pago</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isSendingEmail ? 'Generando y Despachando Correo...' : 'Guardando Pago...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Registrar Pago</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
