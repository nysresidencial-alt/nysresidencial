'use client'

import React, { useState, useEffect } from 'react'
import { X, Printer, Download, Loader2, Mail } from 'lucide-react'
import { assignVoucherReceiptNumber } from '@/app/admin/vouchers/actions'
import { VoucherCard } from './VoucherCard'
import { VoucherEmailModal } from './VoucherEmailModal'
import { generateVoucherVectorPdf } from '@/lib/voucher-pdf'
import { VoucherDatePicker } from './VoucherDatePicker'

export interface VoucherDetail {
  id: string
  month: string
  year: number
  receiptNumber: string | null
  invoiceNumber: string | null
  baseRent: number
  adjustmentPercent: number
  adjustmentAmount: number
  totalRent: number
  guaranteeAmount?: number | null
  totalMonth: number
  amountInWords: string | null
  paymentStatus: string
  paymentDate: string | null
  transferAmount: number
  cashAmount: number
  depositAmount: number
  collectedAmount: number
  accountsReceivable?: number
  bank?: string | null
  pendingBalance: number
  comment: string | null
  paymentMethod: string
  contract: {
    id: string
    building: string
    unitNumber: string
    propertyType: string
    rol: string | null
    address: string | null
    storageNumber: string | null
    parkingNumber: string | null
    tenantName: string
    tenantRut: string | null
    tenantPhone: string | null
    tenantEmail: string | null
    guarantorRelation: string | null
    guarantorPhone: string | null
    guarantorEmail: string | null
    newAssignee?: string | null
    assigneeRut?: string | null
    baseRent?: number
    totalRent?: number
    vouchersHistory?: Array<{
      id: string
      month: string
      year: number
      receiptNumber: string | null
      invoiceNumber: string | null
      paymentStatus: string
      paymentDate: string | null
      collectedAmount: number
      totalMonth: number
      bank: string | null
      paymentMethod: string
    }>
    company?: {
      id: string
      code: string
      name: string
      rut: string | null
      landlordName: string | null
      address: string | null
      phone: string | null
      email: string | null
    } | null
  }
  company?: {
    id: string
    code: string
    name: string
    rut: string | null
    landlordName: string | null
    address: string | null
    phone: string | null
    email: string | null
  } | null
}

interface VoucherPrintModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onReceiptNumberAssigned?: (updatedVoucher: VoucherDetail) => void
}

export function VoucherPrintModal({ voucher: initialVoucher, onClose, onReceiptNumberAssigned }: VoucherPrintModalProps) {
  const [voucher, setVoucher] = useState<VoucherDetail>(initialVoucher)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  // Fecha seleccionada para el comprobante (por defecto la fecha registrada o la de hoy)
  const initialVoucherDate = initialVoucher.paymentDate
    ? (() => {
        const raw = initialVoucher.paymentDate
        if (raw.includes('/')) return raw
        if (raw.includes('-')) {
          const parts = raw.split('T')[0].split('-')
          if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
        }
        return raw
      })()
    : (() => {
        const now = new Date()
        return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
      })()

  const [customDate, setCustomDate] = useState<string>(initialVoucherDate)

  // Asignar correlativo automáticamente si aún no tiene N° de Recibo
  useEffect(() => {
    let isMounted = true
    const currentNum = voucher.receiptNumber ? voucher.receiptNumber.trim() : ''
    if ((!currentNum || currentNum === 'S/N') && !isAssigning) {
      setIsAssigning(true)
      assignVoucherReceiptNumber(voucher.id)
        .then((res) => {
          if (isMounted && res.success && res.voucher) {
            setVoucher(res.voucher as any)
            onReceiptNumberAssigned?.(res.voucher as any)
          }
          if (isMounted) setIsAssigning(false)
        })
        .catch((err) => {
          console.error('Error auto-asignando recibo:', err)
          if (isMounted) setIsAssigning(false)
        })
    }
  }, [voucher.id])

  const c = voucher.contract
  const comp = voucher.company || c?.company

  const landlordName = (c?.newAssignee?.trim() || comp?.name || comp?.landlordName || 'PATRICIA DEL CARMEN RETAMAL BUSTOS').toUpperCase()
  const landlordRut = c?.assigneeRut || comp?.rut || '10.943.065-K'
  const landlordAddress = comp?.address || '1 SUR , Nº885 TALCA'
  const landlordPhone = comp?.phone || '+56 9 98859496'
  const landlordEmail = comp?.email || 'administracion@sunrisechile.cl'

  const receiptNo = voucher.receiptNumber || 'S/N'
  const month = voucher.month || 'OCTUBRE'
  const year = voucher.year || 2026

  const isNoneOrNA =
    !voucher.paymentMethod ||
    voucher.paymentMethod === 'No Aplica' ||
    voucher.paymentMethod === 'Ninguno' ||
    voucher.paymentMethod === 'Sin Especificar' ||
    voucher.paymentMethod.toLowerCase().includes('no aplica')

  const isTransfer = !isNoneOrNA && (voucher.transferAmount > 0 || voucher.paymentMethod === 'Transferencia')
  const isCash = !isNoneOrNA && (voucher.cashAmount > 0 || voucher.paymentMethod === 'Efectivo')
  const isDoc = !isNoneOrNA && voucher.paymentMethod === 'Documento'

  const formattedAmount = voucher.totalMonth.toLocaleString('es-CL')

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

  // Se considera pagado ÚNICAMENTE si tiene fecha de pago registrada y estado Pagado
  const hasPaymentDate = Boolean(voucher.paymentDate && voucher.paymentDate.trim() !== '')
  const isPaid = hasPaymentDate && (voucher.paymentStatus || '').toLowerCase().includes('pag')

  // Descargar directamente en archivo PDF (1 plana vectorial nítida y perfectamente alineada)
  async function handleDownloadPDF() {
    setIsDownloading(true)
    try {
      const pdf = generateVoucherVectorPdf(voucher, customDate)
      const receiptNum = voucher.receiptNumber || 'SN'
      const cleanBuilding = (voucher.contract.building || 'Inmueble').replace(/\s+/g, '_')
      const cleanUnit = (voucher.contract.unitNumber || '').replace(/\s+/g, '_')
      const fileName = `Recibo_${voucher.month}_${voucher.year}_${cleanBuilding}_${cleanUnit}_N${receiptNum}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('Error al generar PDF descargable:', err)
      alert('Hubo un problema al generar el archivo PDF descargable. Por favor intenta con la opción de Imprimir.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Imprimir aislado en iframe (garantiza estrictamente 1 plana sin imprimir la tabla ni 4 hojas)
  function handlePrint() {
    const card = document.getElementById('voucher-printable-card')
    if (!card) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) return

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((s) => s.outerHTML)
      .join('\n')

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo de Arriendo - ${voucher.contract.building} ${voucher.contract.unitNumber}</title>
          ${styles}
          <style>
            @page {
              size: letter portrait;
              margin: 8mm 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: auto !important;
            }
            .voucher-isolated-sheet {
              width: 100% !important;
              max-width: 740px !important;
              margin: 0 auto !important;
              padding: 24px 32px !important;
              border: 2px solid #18181b !important;
              border-radius: 12px !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
              box-sizing: border-box !important;
            }
          </style>
        </head>
        <body>
          <div class="voucher-isolated-sheet">
            ${card.innerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    iframe.contentWindow?.focus()
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }, 1000)
    }, 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Botones Flotantes de Acción (Ocultos al imprimir) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        {/* Botón Enviar por Correo */}
        <button
          type="button"
          onClick={() => setIsEmailModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
          title="Enviar este recibo por correo electrónico"
        >
          <Mail className="w-4 h-4" />
          <span>Enviar por Correo</span>
        </button>

        {/* Botón Descargar PDF directo */}
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-60"
          title="Descargar archivo PDF directamente a tu computador"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </>
          )}
        </button>

        {/* Botón Imprimir (1 plana aislada) */}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90 transition-all cursor-pointer"
          title="Imprimir solo este recibo (1 plana limpia)"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir</span>
        </button>

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-background border border-border text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer shadow-md"
          title="Cerrar vista previa"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Barra Flotante de Selección de Fecha (Oculta al imprimir) */}
      <div className="fixed top-4 left-4 z-50 print:hidden bg-card/95 backdrop-blur-md border border-border p-2.5 rounded-2xl shadow-xl w-72">
        <VoucherDatePicker
          value={customDate}
          onChange={setCustomDate}
          label="Fecha de Emisión / Pago"
          fallbackMonth={voucher.month}
          fallbackYear={voucher.year}
          defaultCartolaDate={voucher.paymentDate ? formatDisplayDate(voucher.paymentDate) : null}
        />
      </div>

      {/* Contenedor del Voucher Oficial (id para captura e impresión aislada) */}
      <div className="my-8">
        <VoucherCard
          voucher={voucher}
          id="voucher-printable-card"
          isAssigning={isAssigning}
          customDate={customDate}
        />
      </div>

      {/* MODAL PARA ENVIAR VOUCHER POR CORREO */}
      {isEmailModalOpen && (
        <VoucherEmailModal
          voucher={{
            ...voucher,
            paymentDate: customDate,
          }}
          onClose={() => setIsEmailModalOpen(false)}
          onSent={(updated) => {
            setVoucher(updated)
            onReceiptNumberAssigned?.(updated)
          }}
        />
      )}
    </div>
  )
}
