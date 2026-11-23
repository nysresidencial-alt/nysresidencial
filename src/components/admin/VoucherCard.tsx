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
      style={{
        backgroundColor: '#ffffff',
        color: '#09090b',
        borderColor: '#e4e4e7',
        boxShadow: 'none',
      }}
      className={`w-full max-w-3xl font-sans p-6 sm:p-10 rounded-2xl border my-8 print:m-0 print:p-6 print:border-none print:w-full ${className}`}
    >
      {/* ENCABEZADO */}
      <div style={{ borderBottom: '2px solid #18181b', paddingBottom: '12px', marginBottom: '16px' }}>
        <div className="flex justify-between items-start">
          <div>
            <h2 style={{ color: '#09090b' }} className="text-lg md:text-xl font-black tracking-tight uppercase">
              {landlordName}
            </h2>
            <div style={{ color: '#3f3f46' }} className="text-xs font-semibold space-y-0.5 mt-1">
              <p>RUT: {landlordRut}</p>
              <p>{landlordAddress}</p>
              <p>CEL: {landlordPhone}</p>
              <p>E-MAIL: {landlordEmail}</p>
            </div>
          </div>

          {/* Número de Recibo */}
          <div className="text-right">
            <span style={{ color: '#52525b' }} className="text-xs font-bold block">Nº</span>
            <span
              style={{
                color: '#09090b',
                border: '2px solid #18181b',
                backgroundColor: '#f8fafc',
                minWidth: '70px',
              }}
              className="text-2xl md:text-3xl font-black px-3 py-1 rounded inline-block text-center"
            >
              {isAssigning ? (
                <span style={{ color: '#71717a' }} className="inline-flex items-center gap-1.5 text-xs font-bold py-1">
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
        <h1
          style={{
            color: '#09090b',
            borderTop: '2px solid #18181b',
            borderBottom: '2px solid #18181b',
          }}
          className="text-2xl md:text-3xl font-black uppercase tracking-wider py-1.5 inline-block px-12"
        >
          RECIBO DE ARRIENDO
        </h1>
        <p style={{ color: '#27272a' }} className="text-xs font-bold uppercase tracking-widest mt-2">
          TALCA, 1 DE {month} DE {year}
        </p>
      </div>

      {/* CUERPO DEL RECIBO */}
      <div style={{ color: '#09090b' }} className="space-y-3 my-5 text-sm">
        <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '6px' }} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span style={{ color: '#52525b', minWidth: '170px' }} className="font-extrabold uppercase text-xs shrink-0">
            RECIBÍ DE DON (ÑA):
          </span>
          <span style={{ color: '#09090b' }} className="font-bold text-base flex-1">
            {c.tenantName} {c.tenantRut ? `(RUT: ${c.tenantRut})` : ''}
          </span>
        </div>

        <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '6px' }} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span style={{ color: '#52525b', minWidth: '170px' }} className="font-extrabold uppercase text-xs shrink-0">
            POR ARRIENDO DE:
          </span>
          <span style={{ color: '#09090b' }} className="font-bold text-sm flex-1">
            {c.propertyType.toUpperCase()} {c.unitNumber} - EDIFICIO {c.building}
            {c.parkingNumber ? ` + ESTAC. Nº ${c.parkingNumber}` : ''}
            {c.storageNumber ? ` + BODEGA Nº ${c.storageNumber}` : ''}
          </span>
        </div>

        <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '6px' }} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span style={{ color: '#52525b', minWidth: '170px' }} className="font-extrabold uppercase text-xs shrink-0">
            UBICADO EN:
          </span>
          <span style={{ color: '#27272a' }} className="font-medium text-sm flex-1">
            {c.address || `EDIFICIO ${c.building}, TALCA`}
          </span>
        </div>

        <div style={{ borderBottom: '1px solid #d4d4d8', paddingBottom: '6px' }} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
          <span style={{ color: '#52525b', minWidth: '170px' }} className="font-extrabold uppercase text-xs shrink-0">
            CORRESPONDIENTE AL MES DE:
          </span>
          <span style={{ color: '#09090b' }} className="font-black text-sm flex-1">
            {month} {year}
          </span>
        </div>
      </div>

      {/* FORMA DE PAGO Y TOTALES */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e4e4e7',
          padding: '16px',
        }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 items-center rounded-xl"
      >
        {/* Checkboxes de medio de pago */}
        <div style={{ color: '#27272a' }} className="space-y-1.5 text-xs font-bold uppercase">
          <div className="flex items-center gap-2">
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '20px',
                height: '20px',
              }}
              className="rounded flex items-center justify-center font-black"
            >
              {isCash ? '✓' : ''}
            </div>
            <span>EFECTIVO</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '20px',
                height: '20px',
              }}
              className="rounded flex items-center justify-center font-black"
            >
              {isTransfer ? '✓' : ''}
            </div>
            <span>TRANSFERENCIA</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '20px',
                height: '20px',
              }}
              className="rounded flex items-center justify-center font-black"
            >
              {isDoc ? '✓' : ''}
            </div>
            <span>DOCUMENTO</span>
          </div>
        </div>

        {/* Montos */}
        <div className="text-right space-y-1">
          <div style={{ color: '#52525b' }} className="text-xs font-semibold">
            VALOR $: <span style={{ color: '#09090b' }} className="font-bold">${formattedAmount}</span>
          </div>
          <div
            style={{
              color: '#09090b',
              borderTop: '1px solid #d4d4d8',
              paddingTop: '4px',
            }}
            className="text-sm font-extrabold"
          >
            TOTAL DE ARRIENDO: <span style={{ color: '#09090b' }} className="text-base font-black">${formattedAmount}</span>
          </div>
        </div>
      </div>

      {/* MONTO EN PALABRAS */}
      <div
        style={{
          backgroundColor: '#f4f4f5',
          border: '1px solid #e4e4e7',
          color: '#09090b',
          padding: '10px',
        }}
        className="rounded-lg text-xs font-bold uppercase"
      >
        <span style={{ color: '#52525b' }} className="font-extrabold">SON: </span>
        {voucher.amountInWords || '---'}
      </div>

      {/* PARTE INFERIOR: SELLO PAGADO Y FIRMA */}
      <div className="mt-8 pt-4 flex items-end justify-between min-h-[90px]">
        {/* SELLO DE PAGADO EN LETRAS GRANDES (SOLO SI TIENE FECHA DE PAGO REGISTRADA) */}
        {isPaid ? (
          <div
            style={{
              border: '4px solid #059669',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              borderRadius: '16px',
              padding: '8px 24px',
              transform: 'rotate(-3deg)',
              boxShadow: 'none',
            }}
            className="select-none"
          >
            <span
              style={{ color: '#047857' }}
              className="text-3xl md:text-5xl font-black tracking-widest block uppercase text-center font-sans"
            >
              PAGADO
            </span>
            <span
              style={{ color: '#065f46' }}
              className="text-[11px] font-bold tracking-wider block text-center uppercase mt-0.5 font-mono"
            >
              PAGADO EL {formatVoucherDisplayDate(voucher.paymentDate)}
            </span>
          </div>
        ) : (
          <div className="text-xs italic text-zinc-400">
            {/* Espacio reservado para timbre una vez registrado el pago */}
          </div>
        )}

        {/* FIRMA ARRENDADOR */}
        <div
          style={{
            borderTop: '2px solid #18181b',
            paddingTop: '8px',
            width: '256px',
          }}
          className="text-center shrink-0"
        >
          <span style={{ color: '#09090b' }} className="text-xs font-black tracking-widest uppercase block">
            ARRENDADOR
          </span>
          <span style={{ color: '#71717a' }} className="block text-[10px] font-medium">
            NyS Negocios y Soluciones Inmobiliarias
          </span>
        </div>
      </div>
    </div>
  )
}
