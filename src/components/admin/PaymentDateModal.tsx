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
} from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { updateVoucher } from '@/app/admin/vouchers/actions'

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
  // Inicializar con la fecha de pago existente o con hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0]
  const [paymentDate, setPaymentDate] = useState<string>(voucher.paymentDate || today)
  const [bank, setBank] = useState<string>(voucher.bank || 'SANTANDER')
  const [paymentMethod, setPaymentMethod] = useState<string>(voucher.paymentMethod || 'Transferencia')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const c = voucher.contract
  const monthName = MONTH_NAMES_TITLE[voucher.month] || voucher.month
  const monthNum = MONTH_NUMBERS[voucher.month] || '11'
  const contractDueDate = `05/${monthNum}/${voucher.year}`
  const hasExistingDate = Boolean(voucher.paymentDate)

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

  // Guardar fecha y marcar como PAGADO
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentDate) {
      setError('Debes seleccionar una fecha de pago válida.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await updateVoucher(voucher.id, {
        paymentDate,
        paymentStatus: 'Pagado',
        paymentMethod,
        bank,
        collectedAmount: voucher.totalMonth,
        transferAmount: paymentMethod === 'Transferencia' ? voucher.totalMonth : 0,
        cashAmount: paymentMethod === 'Efectivo' ? voucher.totalMonth : 0,
        depositAmount: paymentMethod === 'Documento' ? voucher.totalMonth : 0,
        pendingBalance: 0,
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
          paymentMethod,
          bank,
          collectedAmount: voucher.totalMonth,
          pendingBalance: 0,
        })
      }
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la fecha de pago')
      setIsSubmitting(false)
    }
  }

  // Quitar fecha de pago (Desmarcar arriendo)
  async function handleClearDate() {
    if (!confirm('¿Deseas quitar la fecha de pago y volver a dejar este arriendo como pendiente?')) {
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
      setError(err?.message || 'Error al desmarcar la fecha de pago')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                Registrar Fecha de Pago
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conciliación bancaria para el período {monthName} {voucher.year}
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

        {/* Ficha Resumen de Arrendatario e Inmueble */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Arrendatario
              </span>
              <span className="font-bold text-foreground block line-clamp-1 mt-0.5">
                {c.tenantName}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {c.tenantRut || 'Sin RUT'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Inmueble / Unidad
              </span>
              <span className="font-bold text-foreground block line-clamp-1 mt-0.5">
                {c.building} · {c.unitNumber}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Vence contrato: {contractDueDate}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-muted-foreground font-semibold">Monto Total a Liquidar:</span>
              <span className="text-base font-black text-primary">
                ${voucher.totalMonth.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Input Fecha de Pago */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Fecha en que se acreditó en cartola bancaria *</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (Día real del abono)
                </span>
              </label>

              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
              />

              {/* Botones rápidos */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground">Atajos:</span>
                <button
                  type="button"
                  onClick={() => setQuickDate('day5')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  Día 5 ({monthNum})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('yesterday')}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  Ayer
                </button>
              </div>
            </div>

            {/* Banco y Medio de Pago */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Banco Receptor
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="SANTANDER">Santander</option>
                  <option value="ITAU">Itaú</option>
                  <option value="BANCO DE CHILE">Banco de Chile</option>
                  <option value="BANCOESTADO">BancoEstado</option>
                  <option value="BCI">BCI</option>
                  <option value="SCOTIABANK">Scotiabank</option>
                  <option value="OTRO">Otro / Caja</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Transferencia">Transferencia Electrónica</option>
                  <option value="Efectivo">Efectivo en Oficina</option>
                  <option value="Documento">Depósito / Cheque</option>
                </select>
              </div>
            </div>

            {/* AVISO IMPORTANTE SOLICITADO */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Importante:</strong> Al ingresar una fecha de pago, se marcará automáticamente este arriendo como <span className="font-extrabold uppercase text-emerald-700 dark:text-emerald-400">PAGADO</span>, por lo que los ingresos serán contabilizados en el <strong>Dashboard</strong>.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              {hasExistingDate ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleClearDate}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Quitar fecha y volver a dejar pendiente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar fecha</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Guardar y Marcar como Pagado</span>
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
