'use client'

import React from 'react'
import { X, Printer, Download } from 'lucide-react'

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
}

export function VoucherPrintModal({ voucher, onClose }: VoucherPrintModalProps) {
  const c = voucher.contract
  const comp = voucher.company

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

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Botones Flotantes de Acción (Ocultos al imprimir) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Guardar PDF</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 bg-background border border-border text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer shadow-md"
          title="Cerrar vista previa"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenedor del Voucher Oficial */}
      <div className="w-full max-w-3xl bg-white text-zinc-950 font-sans p-8 md:p-12 rounded-2xl shadow-2xl border border-zinc-200 my-8 print:m-0 print:p-8 print:border-none print:shadow-none print:w-full">
        {/* ENCABEZADO */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg md:text-xl font-black tracking-tight text-zinc-950 uppercase">
                {landlordName}
              </h2>
              <div className="text-xs font-semibold text-zinc-700 space-y-0.5 mt-1">
                <p>RUT: {landlordRut}</p>
                <p>{landlordAddress}</p>
                <p>CEL: {landlordPhone}</p>
                <p>E-MAIL: {landlordEmail}</p>
              </div>
            </div>

            {/* Número de Recibo */}
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-600 block">Nº</span>
              <span className="text-2xl md:text-3xl font-black text-zinc-950 border-2 border-zinc-900 px-3 py-1 rounded inline-block bg-zinc-50">
                {receiptNo}
              </span>
            </div>
          </div>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <div className="text-center my-6">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-zinc-950 border-y-2 border-zinc-900 py-2 inline-block px-12">
            RECIBO DE ARRIENDO
          </h1>
          <p className="text-xs font-bold text-zinc-800 uppercase tracking-widest mt-3">
            TALCA, 1 DE {month} DE {year}
          </p>
        </div>

        {/* CUERPO DEL RECIBO */}
        <div className="space-y-4 my-8 text-sm text-zinc-900">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-2">
            <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
              RECIBÍ DE DON (ÑA):
            </span>
            <span className="font-bold text-base text-zinc-950 flex-1">
              {c.tenantName} {c.tenantRut ? `(RUT: ${c.tenantRut})` : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-2">
            <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
              POR ARRIENDO DE:
            </span>
            <span className="font-bold text-sm text-zinc-950 flex-1">
              {c.propertyType.toUpperCase()} {c.unitNumber} - EDIFICIO {c.building}
              {c.parkingNumber ? ` + ESTAC. Nº ${c.parkingNumber}` : ''}
              {c.storageNumber ? ` + BODEGA Nº ${c.storageNumber}` : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-2">
            <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
              UBICADO EN:
            </span>
            <span className="font-medium text-sm text-zinc-800 flex-1">
              {c.address || `EDIFICIO ${c.building}, TALCA`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-2">
            <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
              CORRESPONDIENTE AL MES DE:
            </span>
            <span className="font-black text-sm text-zinc-950 flex-1">
              {month} {year}
            </span>
          </div>
        </div>

        {/* FORMA DE PAGO Y TOTALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8 items-center bg-zinc-50 p-5 rounded-xl border border-zinc-200">
          {/* Checkboxes de medio de pago */}
          <div className="space-y-2 text-xs font-bold text-zinc-800 uppercase">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-900 rounded flex items-center justify-center font-black">
                {isCash ? '✓' : ''}
              </div>
              <span>EFECTIVO</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-900 rounded flex items-center justify-center font-black">
                {isTransfer ? '✓' : ''}
              </div>
              <span>TRANSFERENCIA</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-zinc-900 rounded flex items-center justify-center font-black">
                {isDoc ? '✓' : ''}
              </div>
              <span>DOCUMENTO</span>
            </div>
          </div>

          {/* Montos */}
          <div className="text-right space-y-1">
            <div className="text-xs font-semibold text-zinc-600">
              VALOR $: <span className="font-bold text-zinc-950">${formattedAmount}</span>
            </div>
            <div className="text-sm font-extrabold text-zinc-900 pt-1 border-t border-zinc-300">
              TOTAL DE ARRIENDO: <span className="text-base font-black text-zinc-950">${formattedAmount}</span>
            </div>
          </div>
        </div>

        {/* MONTO EN PALABRAS */}
        <div className="bg-zinc-100/80 p-3 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-900 uppercase">
          <span className="text-zinc-600 font-extrabold">SON: </span>
          {voucher.amountInWords || '---'}
        </div>

        {/* FIRMA */}
        <div className="mt-16 pt-8 flex justify-end">
          <div className="text-center w-64 border-t-2 border-zinc-900 pt-2">
            <span className="text-xs font-black tracking-widest text-zinc-900 uppercase">
              ARRENDADOR
            </span>
            <span className="block text-[10px] text-zinc-500 font-medium">
              NyS Negocios y Soluciones Inmobiliarias
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
