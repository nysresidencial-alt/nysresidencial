'use client'

import React, { useState, useEffect } from 'react'
import { X, Printer, Download, Loader2 } from 'lucide-react'
import { assignVoucherReceiptNumber } from '@/app/admin/vouchers/actions'
import { VoucherCard } from './VoucherCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  const comp = voucher.company || c.company

  const landlordName = comp?.landlordName || 'PATRICIA DEL CARMEN RETAMAL BUSTOS'
  const landlordRut = comp?.rut || '10.943.065-K'
  const landlordAddress = comp?.address || '1 SUR , Nº885 TALCA'
  const landlordPhone = comp?.phone || '+56 9 98859496'
  const landlordEmail = comp?.email || 'administracion@sunrisechile.cl'

  const receiptNo = voucher.receiptNumber || 'S/N'
  const month = voucher.month || 'OCTUBRE'
  const year = voucher.year || 2026

  const isTransfer = voucher.transferAmount > 0 || voucher.paymentMethod === 'Transferencia'
  const isCash = voucher.cashAmount > 0 || voucher.paymentMethod === 'Efectivo'
  const isDoc = voucher.paymentMethod === 'Documento'

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

  // Descargar directamente en archivo PDF (1 plana)
  async function handleDownloadPDF() {
    const card = document.getElementById('voucher-printable-card')
    if (!card) return

    setIsDownloading(true)
    try {
      const canvas = await html2canvas(card, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const margin = 10
      const contentWidth = pdfWidth - margin * 2
      const contentHeight = (canvas.height * contentWidth) / canvas.width
      const finalHeight = Math.min(contentHeight, pdfHeight - margin * 2)

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, finalHeight)

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

      {/* Contenedor del Voucher Oficial (id para captura e impresión aislada) */}
      <VoucherCard voucher={voucher} id="voucher-printable-card" isAssigning={isAssigning} />
    </div>
  )
}
