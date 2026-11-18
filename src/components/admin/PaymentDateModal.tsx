'use client'

import React, { useState } from 'react'
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
  Sparkles,
} from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { registerVoucherPayment, updateVoucher } from '@/app/admin/vouchers/actions'

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

export function PaymentDateModal({ voucher, onClose, onSaved }: PaymentDateModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const c = voucher.contract

  // Monto esperado de arriendo
  const expectedRent = Math.round(voucher.totalRent || voucher.totalMonth || c.totalRent || voucher.baseRent || 0)
  const initialCollected = voucher.collectedAmount > 0 ? voucher.collectedAmount : expectedRent

  // Estado del formulario
  const [paymentDate, setPaymentDate] = useState<string>(voucher.paymentDate || today)
  const [collectedAmount, setCollectedAmount] = useState<number>(initialCollected)
  const [invoiceNumber, setInvoiceNumber] = useState<string>(voucher.invoiceNumber || '')
  const [bank, setBank] = useState<string>(voucher.bank || 'SANTANDER')
  const [paymentMethod, setPaymentMethod] = useState<string>(voucher.paymentMethod || 'Transferencia')
  const [comment, setComment] = useState<string>(voucher.comment || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)

  const monthName = MONTH_NAMES_TITLE[voucher.month] || voucher.month
  const monthNum = MONTH_NUMBERS[voucher.month] || '11'
  const hasExistingPayment = Boolean(voucher.paymentDate)

  // Acciones rápidas de fecha
  function setQuickDate(type: 'today' | 'day5' | 'yesterday') {
    if (type === 'today') {
      setPaymentDate(today)
    } else if (type === 'day5') {
      setPaymentDate(`${voucher.year}-${monthNum}-05`)
    } else if (type === 'yesterday') {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      setPaymentDate(d.toISOString().split('T')[0])
    }
  }

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

  // Guardar pago y marcar como PAGADO
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentDate) {
      setError('Debes seleccionar una fecha de pago válida.')
      return
    }
    if (collectedAmount <= 0) {
      setError('Debes ingresar un monto total pagado mayor a $0.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await registerVoucherPayment(voucher.id, {
        paymentDate,
        collectedAmount,
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
        onSaved({
          ...voucher,
          paymentDate,
          paymentStatus: 'Pagado',
          collectedAmount,
          pendingBalance: Math.max(0, expectedRent - collectedAmount),
          invoiceNumber: invoiceNumber.trim() || null,
          bank,
          paymentMethod,
          comment: comment.trim() || null,
        })
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
      setError(err?.message || 'Error al desmarcar el pago')
      setIsSubmitting(false)
    }
  }

  // Historial de pagos pasados del contrato
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
                              {formatDisplayDate(h.paymentDate)}
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

            {/* Fila 1: Fecha de Pago y Total Pagado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Fecha de Pago */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Fecha de Pago (Cartola) *</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Día real de abono
                  </span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
                />
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

              {/* Total Pagado */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Total Pagado por el Cliente *</span>
                  <button
                    type="button"
                    onClick={() => setCollectedAmount(expectedRent)}
                    className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    Restablecer al total (${expectedRent.toLocaleString('es-CL')})
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    step={100}
                    value={collectedAmount || ''}
                    onChange={(e) => setCollectedAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3.5 py-2.5 text-sm font-black bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Monto registrado:</span>
                  <strong className="text-foreground">${collectedAmount.toLocaleString('es-CL')} CLP</strong>
                </div>
              </div>
            </div>

            {/* Fila 2: Factura (Opcional) y Banco */}
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

              {/* Banco Receptor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Banco Receptor
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="SANTANDER">Santander</option>
                  <option value="ITAU">Itaú</option>
                  <option value="BANCO DE CHILE">Banco de Chile</option>
                  <option value="BANCOESTADO">BancoEstado</option>
                  <option value="BCI">BCI</option>
                  <option value="SCOTIABANK">Scotiabank</option>
                  <option value="OTRO">Otro / Caja</option>
                </select>
                <div className="pt-0.5">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-xl text-muted-foreground"
                  >
                    <option value="Transferencia">Transferencia Electrónica</option>
                    <option value="Efectivo">Efectivo en Oficina</option>
                    <option value="Documento">Depósito / Cheque</option>
                  </select>
                </div>
              </div>
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
                      <span>Guardando Pago...</span>
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
