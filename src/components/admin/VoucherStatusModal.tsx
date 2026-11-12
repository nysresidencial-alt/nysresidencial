'use client'

import React, { useState } from 'react'
import { X, AlertTriangle, CheckCircle2, Clock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { updateVoucher } from '@/app/admin/vouchers/actions'
import { DatePickerField } from '@/components/ui/DatePickerField'

interface VoucherStatusModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onUpdated: (updatedVoucher: VoucherDetail) => void
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; desc: string; icon: React.ReactNode }
> = {
  Pagado: {
    label: 'Pagado',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    desc: 'Registra el arriendo como recaudado y cancela el saldo pendiente.',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  },
  Pendiente: {
    label: 'Pendiente',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    desc: 'El voucher queda pendiente de pago; el total del mes se registra como saldo por cobrar.',
    icon: <Clock className="w-4 h-4 text-amber-500" />,
  },
  'Saldo a Favor': {
    label: 'Saldo a Favor',
    color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    desc: 'El arrendatario pagó un excedente o tiene saldo a favor para el próximo período.',
    icon: <CheckCircle2 className="w-4 h-4 text-yellow-500" />,
  },
  Disponible: {
    label: 'Disponible',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    desc: 'Inmueble desocupado; no se espera recaudación contractual para este mes.',
    icon: <Clock className="w-4 h-4 text-blue-500" />,
  },
  Nulo: {
    label: 'Nulo / Anulado',
    color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    desc: 'Anula el cobro de esta liquidación por venta, término anticipado o error administrativo.',
    icon: <AlertTriangle className="w-4 h-4 text-zinc-500" />,
  },
}

export function VoucherStatusModal({ voucher, onClose, onUpdated }: VoucherStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(voucher.paymentStatus || 'Pendiente')
  const [paymentDate, setPaymentDate] = useState<string>(
    voucher.paymentDate || new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState<string>(voucher.paymentMethod || 'Transferencia')
  const [bank, setBank] = useState<string>(voucher.bank || 'SANTANDER')
  const [comment, setComment] = useState<string>(voucher.comment || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const c = voucher.contract
  const isChangingToPaid = selectedStatus === 'Pagado'
  const isChangingToPending = selectedStatus === 'Pendiente'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload: any = {
        paymentStatus: selectedStatus,
        comment: comment.trim() || undefined,
      }

      if (selectedStatus === 'Pagado') {
        payload.paymentDate = paymentDate
        payload.paymentMethod = paymentMethod
        payload.bank = bank
        payload.collectedAmount = voucher.totalMonth
        payload.transferAmount = paymentMethod === 'Transferencia' ? voucher.totalMonth : 0
        payload.cashAmount = paymentMethod === 'Efectivo' ? voucher.totalMonth : 0
        payload.depositAmount = paymentMethod === 'Documento' ? voucher.totalMonth : 0
        payload.pendingBalance = 0
      } else if (selectedStatus === 'Pendiente') {
        payload.collectedAmount = 0
        payload.transferAmount = 0
        payload.cashAmount = 0
        payload.depositAmount = 0
        payload.pendingBalance = voucher.totalMonth
      } else if (selectedStatus === 'Nulo' || selectedStatus === 'Disponible') {
        payload.pendingBalance = 0
      }

      const res = await updateVoucher(voucher.id, payload)

      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
      } else {
        const updated: VoucherDetail = {
          ...voucher,
          paymentStatus: selectedStatus,
          paymentDate: payload.paymentDate || voucher.paymentDate,
          paymentMethod: payload.paymentMethod || voucher.paymentMethod,
          bank: payload.bank !== undefined ? payload.bank : voucher.bank,
          comment: payload.comment !== undefined ? payload.comment : voucher.comment,
          collectedAmount: payload.collectedAmount !== undefined ? payload.collectedAmount : voucher.collectedAmount,
          pendingBalance: payload.pendingBalance !== undefined ? payload.pendingBalance : voucher.pendingBalance,
        }
        onUpdated(updated)
        onClose()
      }
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar el estado del voucher')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">
              Cambiar Estado de Liquidación
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Ficha rápida del Voucher */}
          <div className="bg-muted/30 border border-border p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-foreground text-sm">
                {c.building} · Unidad {c.unitNumber}
              </div>
              <div className="text-muted-foreground mt-0.5">
                {c.tenantName} {voucher.receiptNumber ? `(Recibo #${voucher.receiptNumber})` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block uppercase font-bold">Total Arriendo</span>
              <span className="text-base font-black text-primary">
                ${voucher.totalMonth.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {/* Selector de Nuevo Estado */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              Seleccionar Nuevo Estado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.keys(STATUS_CONFIG).map((st) => {
                const conf = STATUS_CONFIG[st]
                const isSelected = selectedStatus === st

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${
                      isSelected
                        ? `${conf.color} ring-2 ring-primary/40 shadow-sm font-black`
                        : 'bg-background border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{conf.label}</span>
                      {isSelected && conf.icon}
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              {STATUS_CONFIG[selectedStatus]?.desc}
            </p>
          </div>

          {/* Modal de Advertencia */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong className="block font-bold mb-0.5">Advertencia de Contabilidad:</strong>
              Modificar el estado a <strong>"{selectedStatus}"</strong> actualizará los balances del período {voucher.month} {voucher.year}, recalculando la recaudación de la empresa propietaria y el saldo adeudado por el arrendatario.
            </div>
          </div>

          {/* Opciones adicionales si se marca como Pagado */}
          {isChangingToPaid && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3.5 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                Detalles del Pago Recibido
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DatePickerField
                  label="Fecha de Pago / Ingreso"
                  value={paymentDate}
                  onChange={setPaymentDate}
                  placeholder="YYYY-MM-DD"
                  required
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Documento">Documento / Depósito</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Banco / Receptor</label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="SANTANDER">Banco Santander</option>
                    <option value="ITAU-CORPBANCA">Itaú / Corpbanca</option>
                    <option value="BANCO DE CHILE">Banco de Chile</option>
                    <option value="BANCOESTADO">BancoEstado</option>
                    <option value="BCI">BCI</option>
                    <option value="INTERNACIONAL">Banco Internacional</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Comentario opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Comentario o Motivo del Cambio (Opcional)
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Pago verificado en cartola Santander, anticipo, etc."
              className="w-full py-2 px-3 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando cambio...</span>
                </>
              ) : (
                <>
                  <span>Confirmar y Aplicar Cambio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
