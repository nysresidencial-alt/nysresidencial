'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Calendar,
  DollarSign,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'
import { VoucherCard, formatVoucherDisplayDate } from './VoucherCard'
import { assignVoucherReceiptNumber } from '@/app/admin/vouchers/actions'
import { generateVoucherPdfBase64 } from '@/lib/voucher-pdf'

interface VoucherEmailModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onSent?: (updatedVoucher: VoucherDetail) => void
}

export function VoucherEmailModal({ voucher: initialVoucher, onClose, onSent }: VoucherEmailModalProps) {
  const [voucher, setVoucher] = useState<VoucherDetail>(initialVoucher)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [successResult, setSuccessResult] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const c = voucher.contract
  const isPaid = Boolean(voucher.paymentDate && (voucher.paymentStatus || '').toLowerCase().includes('pag'))
  const receiptNo = voucher.receiptNumber || 'S/N'
  const expectedRent = Math.round(voucher.totalMonth || voucher.totalRent || 0)

  // Casilla de destino (en marcha blanca prellena con la casilla de la empresa, pero editable para pruebas)
  const [targetEmail, setTargetEmail] = useState('administracion@sunrisechile.cl')

  // Auto-asignar número de recibo si no tiene
  useEffect(() => {
    let isMounted = true
    const currentNum = voucher.receiptNumber ? voucher.receiptNumber.trim() : ''
    if ((!currentNum || currentNum === 'S/N') && !isAssigning) {
      setIsAssigning(true)
      assignVoucherReceiptNumber(voucher.id)
        .then((res) => {
          if (isMounted && res.success && res.voucher) {
            setVoucher(res.voucher as any)
          }
          if (isMounted) setIsAssigning(false)
        })
        .catch((err) => {
          console.error('Error auto-asignando recibo para correo:', err)
          if (isMounted) setIsAssigning(false)
        })
    }
  }, [voucher.id])

  async function handleSendEmail() {
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo de destino válido')
      return
    }

    setIsSending(true)
    setErrorMessage(null)

    try {
      // 1. Generar el PDF vectorial exacto, nítido y perfectamente alineado
      const pdfBase64 = generateVoucherPdfBase64(voucher)

      // 2. Despachar a la API de envío
      const response = await fetch('/api/admin/vouchers/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: voucher.id,
          pdfBase64,
          receiptNumber: voucher.receiptNumber,
          tenantName: c.tenantName,
          tenantEmail: c.tenantEmail,
          targetEmail: targetEmail.trim(),
          building: c.building,
          unitNumber: c.unitNumber,
          month: voucher.month,
          year: voucher.year,
          totalAmount: expectedRent,
          paymentDate: voucher.paymentDate ? formatVoucherDisplayDate(voucher.paymentDate) : null,
        }),
      })

      const responseText = await response.text()
      let result: any = {}
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(responseText || `Error del servidor (${response.status})`)
      }

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Error al procesar el envío')
      }

      setSuccessResult(
        result.message || `Comprobante N° ${voucher.receiptNumber || 'S/N'} despachado con éxito a ${targetEmail}`
      )
      onSent?.(voucher)
    } catch (err: any) {
      console.error('Error enviando voucher por correo:', err)
      setErrorMessage(err?.message || 'Hubo un error al generar o enviar el comprobante')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in-50 zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Enviar Comprobante por Correo
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {c.building} - Depto {c.unitNumber} ({voucher.month} {voucher.year})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 text-xs">
          {/* AVISO MARCHA BLANCA */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Modo Marcha Blanca Activo</span>
              <p className="leading-snug text-[11px] text-amber-700/90 dark:text-amber-400/90">
                El comprobante oficial adjunto se enviará a la casilla interna de la empresa. El correo registrado del cliente es:{' '}
                <strong className="font-mono text-foreground">{c.tenantEmail || 'Sin correo registrado'}</strong>.
              </p>
            </div>
          </div>

          {/* ESTADO DEL TIMBRE */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 border border-border">
            <span className="font-bold text-muted-foreground">Estado del Comprobante:</span>
            {isPaid ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-black text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>PAGADO (Timbre {formatVoucherDisplayDate(voucher.paymentDate)})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-black text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PENDIENTE DE PAGO</span>
              </span>
            )}
          </div>

          {/* FICHA RESUMEN */}
          <div className="bg-background border border-border rounded-2xl p-4 space-y-2 font-medium">
            <div className="flex justify-between border-b border-border/60 pb-1.5">
              <span className="text-muted-foreground">N° de Recibo Oficial:</span>
              <span className="font-mono font-bold text-foreground">
                {isAssigning ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Asignando...
                  </span>
                ) : (
                  `#${receiptNo}`
                )}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-1.5">
              <span className="text-muted-foreground">Arrendatario:</span>
              <span className="font-bold text-foreground">{c.tenantName}</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-1.5">
              <span className="text-muted-foreground">Propiedad:</span>
              <span className="font-semibold text-foreground">
                {c.building} - Unidad {c.unitNumber}
              </span>
            </div>

            <div className="flex justify-between pt-0.5">
              <span className="text-muted-foreground">Total Arriendo:</span>
              <span className="font-black text-sm text-primary">
                ${expectedRent.toLocaleString('es-CL')} CLP
              </span>
            </div>
          </div>

          {/* CASILLA DESTINO DE PRUEBAS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Enviar a la casilla:
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="administracion@sunrisechile.cl"
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Puedes cambiar temporalmente este correo para probar enviándotelo a tu casilla personal o a contabilidad.
            </p>
          </div>

          {/* FEEDBACK MENSAJES */}
          {successResult && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successResult}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {successResult ? 'Cerrar' : 'Cancelar'}
          </button>

          {!successResult && (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={isSending || isAssigning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF y Despachando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Comprobante Ahora</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
