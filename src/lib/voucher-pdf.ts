import { jsPDF } from 'jspdf'
import { VoucherDetail } from '@/components/admin/VoucherPrintModal'

const SPANISH_MONTHS_NAMES = [
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

export function formatPdfDate(dateStr: string | null | undefined): string {
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

export function formatVoucherHeaderDate(
  dateStr: string | null | undefined,
  fallbackMonth: string,
  fallbackYear: number
): string {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') {
    return `TALCA, 1 DE ${fallbackMonth.toUpperCase()} DE ${fallbackYear}`
  }

  // Si viene en formato DD/MM/AAAA
  if (dateStr.includes('/')) {
    const parts = dateStr.trim().split('/')
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10)
      const monthIdx = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `TALCA, ${day} DE ${SPANISH_MONTHS_NAMES[monthIdx]} DE ${year}`
      }
    }
  }

  // Si viene en formato ISO AAAA-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12 && !isNaN(year)) {
        return `TALCA, ${day} DE ${SPANISH_MONTHS_NAMES[monthIdx]} DE ${year}`
      }
    }
  }

  return `TALCA, 1 DE ${fallbackMonth.toUpperCase()} DE ${fallbackYear}`
}

export function generateVoucherVectorPdf(voucher: VoucherDetail, customDate?: string): jsPDF {
  const c = voucher.contract
  const comp = voucher.company || c?.company

  const landlordName = (c?.newAssignee?.trim() || comp?.name || comp?.landlordName || 'PATRICIA DEL CARMEN RETAMAL BUSTOS').toUpperCase()
  const landlordRut = comp?.rut || '10.943.065-K'
  const landlordAddress = comp?.address || '1 SUR , Nº885 TALCA'
  const landlordPhone = comp?.phone || '+56 9 98859496'
  const landlordEmail = comp?.email || 'administracion@sunrisechile.cl'

  const receiptNo = voucher.receiptNumber || 'S/N'
  const month = (voucher.month || 'NOVIEMBRE').toUpperCase()
  const year = voucher.year || 2026

  const isTransfer = voucher.transferAmount > 0 || (voucher.paymentMethod || '').toLowerCase().includes('transf')
  const isCash = voucher.cashAmount > 0 || (voucher.paymentMethod || '').toLowerCase().includes('efect')
  const isDoc = (voucher.paymentMethod || '').toLowerCase().includes('doc')

  const totalAmount = Math.round(voucher.totalMonth || voucher.totalRent || 0)
  const formattedVal = totalAmount.toLocaleString('es-CL')

  // Determinar fecha activa (customDate o paymentDate del voucher)
  const activeDate = customDate || voucher.paymentDate
  const hasPaymentDate = Boolean(activeDate && activeDate.trim() !== '' && activeDate !== '-')
  const isPaid = hasPaymentDate
  const paymentDateStr = formatPdfDate(activeDate)
  const headerDateStr = formatVoucherHeaderDate(activeDate, month, year)

  // Documento Letter en orientación vertical
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth() // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 279.4 mm

  // Dimensiones de la tarjeta (centrada en la página Letter)
  const cardW = 185
  const cardH = 240
  const cardX = (pageWidth - cardW) / 2
  const cardY = (pageHeight - cardH) / 2

  // Fondo blanco y borde exterior redondeado
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(228, 228, 231) // #e4e4e7
  doc.setLineWidth(0.4)
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD')

  // Padding interior
  const padX = 12
  const contentX = cardX + padX
  const contentW = cardW - padX * 2
  let curY = cardY + 12

  // --- 1. ENCABEZADO ---
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(9, 9, 11)
  doc.text(landlordName, contentX, curY)

  // Recibo Nº en el lado derecho
  const receiptBoxW = 28
  const receiptBoxH = 13
  const receiptBoxX = contentX + contentW - receiptBoxW
  const receiptBoxY = curY - 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(82, 82, 91)
  doc.text('Nº', receiptBoxX + receiptBoxW - 4, receiptBoxY - 2, { align: 'right' })

  doc.setDrawColor(24, 24, 27)
  doc.setLineWidth(0.6)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(receiptBoxX, receiptBoxY, receiptBoxW, receiptBoxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(9, 9, 11)
  doc.text(String(receiptNo), receiptBoxX + receiptBoxW / 2, receiptBoxY + 8.5, { align: 'center' })

  // Datos del arrendador
  curY += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(63, 63, 70)
  doc.text(`RUT: ${landlordRut}`, contentX, curY)
  curY += 4
  doc.text(landlordAddress, contentX, curY)
  curY += 4
  doc.text(`CEL: ${landlordPhone}`, contentX, curY)
  curY += 4
  doc.text(`E-MAIL: ${landlordEmail}`, contentX, curY)

  curY += 6
  // Línea divisoria bajo el encabezado
  doc.setDrawColor(24, 24, 27)
  doc.setLineWidth(0.6)
  doc.line(contentX, curY, contentX + contentW, curY)

  // --- 2. TÍTULO: RECIBO DE ARRIENDO ---
  curY += 9
  const titleText = 'RECIBO DE ARRIENDO'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(9, 9, 11)
  const titleW = doc.getTextWidth(titleText) + 24
  const titleBoxX = contentX + (contentW - titleW) / 2

  doc.setLineWidth(0.6)
  doc.line(titleBoxX, curY - 5, titleBoxX + titleW, curY - 5)
  doc.text(titleText, contentX + contentW / 2, curY + 1, { align: 'center' })
  doc.line(titleBoxX, curY + 4, titleBoxX + titleW, curY + 4)

  curY += 9
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(39, 39, 42)
  doc.text(headerDateStr, contentX + contentW / 2, curY, { align: 'center' })

  // --- 3. FILAS DE DATOS ---
  curY += 8
  const rowH = 9
  const labelColW = 55
  const valueColX = contentX + labelColW

  const propertyStr = [
    `${c.propertyType.toUpperCase()} ${c.unitNumber} - EDIFICIO ${c.building}`,
    c.parkingNumber ? `+ ESTAC. Nº ${c.parkingNumber}` : null,
    c.storageNumber ? `+ BODEGA Nº ${c.storageNumber}` : null,
  ].filter(Boolean).join(' ')

  const rows = [
    { label: 'RECIBÍ DE DON (ÑA):', val: `${c.tenantName} ${c.tenantRut ? `(RUT: ${c.tenantRut})` : ''}`, valBold: true },
    { label: 'POR ARRIENDO DE:', val: propertyStr, valBold: true },
    { label: 'UBICADO EN:', val: c.address || `EDIFICIO ${c.building}, TALCA`, valBold: false },
    { label: 'CORRESPONDIENTE AL MES DE:', val: `${month} ${year}`, valBold: true },
  ]

  rows.forEach((r) => {
    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(82, 82, 91)
    doc.text(r.label, contentX, curY + 4)

    // Value
    doc.setFont('helvetica', r.valBold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(9, 9, 11)
    doc.text(r.val, valueColX, curY + 4)

    // Línea separadora inferior
    doc.setDrawColor(212, 212, 216)
    doc.setLineWidth(0.25)
    doc.line(contentX, curY + 6.5, contentX + contentW, curY + 6.5)

    curY += rowH
  })

  // --- 4. FORMA DE PAGO Y TOTALES ---
  curY += 2
  const payBoxH = 26
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(228, 228, 231)
  doc.setLineWidth(0.3)
  doc.roundedRect(contentX, curY, contentW, payBoxH, 3, 3, 'FD')

  // Checkboxes
  const checkStartX = contentX + 6
  let checkY = curY + 6

  const renderCheck = (label: string, checked: boolean) => {
    doc.setDrawColor(24, 24, 27)
    doc.setLineWidth(0.4)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(checkStartX, checkY - 3, 4, 4, 0.8, 0.8, 'FD')

    if (checked) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(9, 9, 11)
      doc.text('X', checkStartX + 2, checkY - 0.2, { align: 'center' })
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(39, 39, 42)
    doc.text(label, checkStartX + 7, checkY)
    checkY += 6.5
  }

  renderCheck('EFECTIVO', isCash)
  renderCheck('TRANSFERENCIA', isTransfer)
  renderCheck('DOCUMENTO', isDoc)

  // Totales en el lado derecho
  const totRightX = contentX + contentW - 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(82, 82, 91)
  doc.text(`VALOR $: $${formattedVal}`, totRightX, curY + 9, { align: 'right' })

  doc.setDrawColor(212, 212, 216)
  doc.setLineWidth(0.25)
  doc.line(totRightX - 60, curY + 12, totRightX, curY + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(9, 9, 11)
  doc.text(`TOTAL DE ARRIENDO: $${formattedVal}`, totRightX, curY + 18, { align: 'right' })

  // --- 5. MONTO EN PALABRAS ---
  curY += payBoxH + 4
  const wordsH = 10
  doc.setFillColor(244, 244, 245)
  doc.setDrawColor(228, 228, 231)
  doc.setLineWidth(0.3)
  doc.roundedRect(contentX, curY, contentW, wordsH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(82, 82, 91)
  doc.text('SON: ', contentX + 4, curY + 6)
  const sonLabelW = doc.getTextWidth('SON: ')
  doc.setTextColor(9, 9, 11)
  doc.text((voucher.amountInWords || '---').toUpperCase(), contentX + 4 + sonLabelW, curY + 6)

  // --- 6. FOOTER: TIMBRE PAGADO Y FIRMA ---
  curY += wordsH + 8
  const footerY = curY

  // Timbre PAGADO DERECHO, RECTO Y ELEGANTE
  if (isPaid) {
    const stampW = 58
    const stampH = 22
    const stampX = contentX + 2
    const stampY = footerY

    doc.setFillColor(236, 253, 245) // #ecfdf5
    doc.setDrawColor(5, 150, 105) // #059669
    doc.setLineWidth(0.8)
    doc.roundedRect(stampX, stampY, stampW, stampH, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(4, 120, 87) // #047857
    doc.text('PAGADO', stampX + stampW / 2, stampY + 11, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(6, 95, 70) // #065f46
    doc.text(`PAGADO EL ${paymentDateStr}`, stampX + stampW / 2, stampY + 17, { align: 'center' })
  }

  // Firma Arrendador
  const signW = 60
  const signX = contentX + contentW - signW - 2
  const signLineY = footerY + 16

  doc.setDrawColor(24, 24, 27)
  doc.setLineWidth(0.6)
  doc.line(signX, signLineY, signX + signW, signLineY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(9, 9, 11)
  doc.text('ARRENDADOR', signX + signW / 2, signLineY + 4, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(113, 113, 122)
  doc.text('NyS Negocios y Soluciones Inmobiliarias', signX + signW / 2, signLineY + 7.5, { align: 'center' })

  return doc
}

export function generateVoucherPdfBase64(voucher: VoucherDetail, customDate?: string): string {
  const doc = generateVoucherVectorPdf(voucher, customDate)
  return doc.output('datauristring')
}

