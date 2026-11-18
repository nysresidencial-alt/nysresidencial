'use client'

import React, { useState } from 'react'
import { X, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { updateVoucherInvoice } from '@/app/admin/vouchers/actions'

interface InvoiceEditModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onSaved: (voucherId: string, newInvoiceNumber: string | null) => void
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

export function InvoiceEditModal({ voucher, onClose, onSaved }: InvoiceEditModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState<string>(voucher.invoiceNumber || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const c = voucher.contract
  const monthName = MONTH_NAMES_TITLE[voucher.month] || voucher.month
  const hasExistingInvoice = Boolean(voucher.invoiceNumber)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const trimmed = invoiceNumber.trim()
      const res = await updateVoucherInvoice(voucher.id, trimmed)

      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      onSaved(voucher.id, trimmed || null)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el número de factura')
      setIsSubmitting(false)
    }
  }

  async function handleClear() {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await updateVoucherInvoice(voucher.id, '')
      if (res?.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      onSaved(voucher.id, null)
    } catch (err: any) {
      setError(err?.message || 'Error al quitar la factura')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground">
                {hasExistingInvoice ? 'Modificar N° de Factura' : 'Ingresar N° de Factura'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Período {monthName} {voucher.year}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ficha Resumen */}
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/70 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Propiedad:</span>
              <span className="font-bold text-foreground">
                {c.building} · {c.unitNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrendatario:</span>
              <span className="font-semibold text-foreground line-clamp-1">
                {c.tenantName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto Arriendo:</span>
              <span className="font-bold text-primary">
                ${voucher.totalMonth.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Número de Factura Electrónica (SII)</span>
              <span className="text-[10px] text-muted-foreground font-normal">Folio o N°</span>
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ej: 14502"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
              Como las facturas de arriendo se pueden generar posteriormente, puedes registrar o actualizar este número en cualquier momento.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            {hasExistingInvoice ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Eliminar número de factura"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                    <span>Guardar Factura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
