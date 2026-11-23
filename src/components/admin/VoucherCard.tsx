'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { VoucherDetail } from './VoucherPrintModal'

interface VoucherCardProps {
  voucher: VoucherDetail
  id?: string
  isAssigning?: boolean
  className?: string
}

export function formatVoucherDisplayDate(dateStr: string | null | undefined): string {
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

export function VoucherCard({ voucher, id = 'voucher-printable-card', isAssigning = false, className = '' }: VoucherCardProps) {
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

  const formattedAmount = Math.round(voucher.totalMonth || voucher.totalRent || 0).toLocaleString('es-CL')

  // Se considera pagado ÚNICAMENTE si tiene fecha de pago registrada y estado Pagado
  const hasPaymentDate = Boolean(voucher.paymentDate && voucher.paymentDate.trim() !== '')
  const isPaid = hasPaymentDate && (voucher.paymentStatus || '').toLowerCase().includes('pag')

  return (
    <div
      id={id}
      className={`w-full max-w-3xl bg-white text-zinc-950 font-sans p-6 sm:p-10 rounded-2xl shadow-2xl border border-zinc-200 my-8 print:m-0 print:p-6 print:border-none print:shadow-none print:w-full ${className}`}
    >
      {/* ENCABEZADO */}
      <div className="border-b-2 border-zinc-900 pb-3 mb-4">
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
            <span className="text-2xl md:text-3xl font-black text-zinc-950 border-2 border-zinc-900 px-3 py-1 rounded inline-block bg-zinc-50 min-w-[70px] text-center">
              {isAssigning ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Asignando...</span>
                </span>
              ) : (
                receiptNo
              )}
            </span>
          </div>
        </div>
      </div>

      {/* TÍTULO PRINCIPAL */}
      <div className="text-center my-4">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider text-zinc-950 border-y-2 border-zinc-900 py-1.5 inline-block px-12">
          RECIBO DE ARRIENDO
        </h1>
        <p className="text-xs font-bold text-zinc-800 uppercase tracking-widest mt-2">
          TALCA, 1 DE {month} DE {year}
        </p>
      </div>

      {/* CUERPO DEL RECIBO */}
      <div className="space-y-3 my-5 text-sm text-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-1.5">
          <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
            RECIBÍ DE DON (ÑA):
          </span>
          <span className="font-bold text-base text-zinc-950 flex-1">
            {c.tenantName} {c.tenantRut ? `(RUT: ${c.tenantRut})` : ''}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-1.5">
          <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
            POR ARRIENDO DE:
          </span>
          <span className="font-bold text-sm text-zinc-950 flex-1">
            {c.propertyType.toUpperCase()} {c.unitNumber} - EDIFICIO {c.building}
            {c.parkingNumber ? ` + ESTAC. Nº ${c.parkingNumber}` : ''}
            {c.storageNumber ? ` + BODEGA Nº ${c.storageNumber}` : ''}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-1.5">
          <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
            UBICADO EN:
          </span>
          <span className="font-medium text-sm text-zinc-800 flex-1">
            {c.address || `EDIFICIO ${c.building}, TALCA`}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-b border-zinc-300 pb-1.5">
          <span className="font-extrabold uppercase text-xs text-zinc-600 shrink-0 min-w-[170px]">
            CORRESPONDIENTE AL MES DE:
          </span>
          <span className="font-black text-sm text-zinc-950 flex-1">
            {month} {year}
          </span>
        </div>
      </div>

      {/* FORMA DE PAGO Y TOTALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        {/* Checkboxes de medio de pago */}
        <div className="space-y-1.5 text-xs font-bold text-zinc-800 uppercase">
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
      <div className="bg-zinc-100/80 p-2.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-900 uppercase">
        <span className="text-zinc-600 font-extrabold">SON: </span>
        {voucher.amountInWords || '---'}
      </div>

      {/* PARTE INFERIOR: SELLO PAGADO Y FIRMA */}
      <div className="mt-8 pt-4 flex items-end justify-between min-h-[90px]">
        {/* SELLO DE PAGADO EN LETRAS GRANDES (SOLO SI TIENE FECHA DE PAGO REGISTRADA) */}
        {isPaid ? (
          <div className="border-4 border-emerald-600 rounded-2xl px-6 py-2 bg-emerald-50/70 text-emerald-700 transform -rotate-3 shadow-xs select-none print:border-emerald-700 print:text-emerald-800 print:bg-emerald-50">
            <span className="text-3xl md:text-5xl font-black tracking-widest block uppercase text-center font-sans">
              PAGADO
            </span>
            <span className="text-[11px] font-bold tracking-wider block text-center uppercase mt-0.5 text-emerald-800 font-mono">
              PAGADO EL {formatVoucherDisplayDate(voucher.paymentDate)}
            </span>
          </div>
        ) : (
          <div className="text-xs italic text-zinc-400">
            {/* Espacio reservado para timbre una vez registrado el pago */}
          </div>
        )}

        {/* FIRMA ARRENDADOR */}
        <div className="text-center w-64 border-t-2 border-zinc-900 pt-2 shrink-0">
          <span className="text-xs font-black tracking-widest text-zinc-900 uppercase">
            ARRENDADOR
          </span>
          <span className="block text-[10px] text-zinc-500 font-medium">
            NyS Negocios y Soluciones Inmobiliarias
          </span>
        </div>
      </div>
    </div>
  )
}
