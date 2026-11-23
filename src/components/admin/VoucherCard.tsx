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
        border: '1px solid #e4e4e7',
        borderRadius: '16px',
        boxShadow: 'none',
        width: '740px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '36px 40px',
        margin: '0 auto',
      }}
      className={`font-sans print:m-0 print:p-6 print:border-none print:w-full ${className}`}
    >
      {/* ENCABEZADO */}
      <div style={{ borderBottom: '2px solid #18181b', paddingBottom: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2
              style={{
                color: '#09090b',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                margin: 0,
                lineHeight: '1.2',
              }}
            >
              {landlordName}
            </h2>
            <div style={{ color: '#3f3f46', fontSize: '11px', fontWeight: 600, marginTop: '6px', lineHeight: '1.4' }}>
              <p style={{ margin: '1px 0' }}>RUT: {landlordRut}</p>
              <p style={{ margin: '1px 0' }}>{landlordAddress}</p>
              <p style={{ margin: '1px 0' }}>CEL: {landlordPhone}</p>
              <p style={{ margin: '1px 0' }}>E-MAIL: {landlordEmail}</p>
            </div>
          </div>

          {/* Número de Recibo */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span
              style={{
                color: '#52525b',
                fontSize: '11px',
                fontWeight: 800,
                display: 'block',
                margin: '0 0 2px 0',
                lineHeight: '1',
              }}
            >
              Nº
            </span>
            <div
              style={{
                color: '#09090b',
                border: '2px solid #18181b',
                backgroundColor: '#ffffff',
                minWidth: '85px',
                padding: '4px 14px',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '26px',
                fontWeight: 900,
                lineHeight: '1.2',
              }}
            >
              {isAssigning ? (
                <span
                  style={{
                    color: '#71717a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 0',
                  }}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Asignando...</span>
                </span>
              ) : (
                receiptNo
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TÍTULO PRINCIPAL */}
      <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'inline-block' }}>
          <h1
            style={{
              color: '#09090b',
              borderTop: '2px solid #18181b',
              borderBottom: '2px solid #18181b',
              fontSize: '22px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '6px 48px',
              margin: '0 auto',
              lineHeight: '1.3',
            }}
          >
            RECIBO DE ARRIENDO
          </h1>
          <p
            style={{
              color: '#27272a',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: '6px',
              marginBottom: 0,
              textAlign: 'center',
            }}
          >
            TALCA, 1 DE {month} DE {year}
          </p>
        </div>
      </div>

      {/* CUERPO DEL RECIBO */}
      <div style={{ color: '#09090b', marginTop: '16px', marginBottom: '16px' }}>
        <div
          style={{
            borderBottom: '1px solid #d4d4d8',
            paddingTop: '6px',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: '#52525b',
              width: '190px',
              minWidth: '190px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '11px',
            }}
          >
            RECIBÍ DE DON (ÑA):
          </span>
          <span style={{ color: '#09090b', fontWeight: 700, fontSize: '14px', flex: 1 }}>
            {c.tenantName} {c.tenantRut ? `(RUT: ${c.tenantRut})` : ''}
          </span>
        </div>

        <div
          style={{
            borderBottom: '1px solid #d4d4d8',
            paddingTop: '6px',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: '#52525b',
              width: '190px',
              minWidth: '190px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '11px',
            }}
          >
            POR ARRIENDO DE:
          </span>
          <span style={{ color: '#09090b', fontWeight: 700, fontSize: '13px', flex: 1 }}>
            {c.propertyType.toUpperCase()} {c.unitNumber} - EDIFICIO {c.building}
            {c.parkingNumber ? ` + ESTAC. Nº ${c.parkingNumber}` : ''}
            {c.storageNumber ? ` + BODEGA Nº ${c.storageNumber}` : ''}
          </span>
        </div>

        <div
          style={{
            borderBottom: '1px solid #d4d4d8',
            paddingTop: '6px',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: '#52525b',
              width: '190px',
              minWidth: '190px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '11px',
            }}
          >
            UBICADO EN:
          </span>
          <span style={{ color: '#27272a', fontWeight: 600, fontSize: '13px', flex: 1 }}>
            {c.address || `EDIFICIO ${c.building}, TALCA`}
          </span>
        </div>

        <div
          style={{
            borderBottom: '1px solid #d4d4d8',
            paddingTop: '6px',
            paddingBottom: '6px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              color: '#52525b',
              width: '190px',
              minWidth: '190px',
              fontWeight: 800,
              textTransform: 'uppercase',
              fontSize: '11px',
            }}
          >
            CORRESPONDIENTE AL MES DE:
          </span>
          <span style={{ color: '#09090b', fontWeight: 900, fontSize: '13px', flex: 1 }}>
            {month} {year}
          </span>
        </div>
      </div>

      {/* FORMA DE PAGO Y TOTALES */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e4e4e7',
          padding: '14px 18px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Checkboxes de medio de pago */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#27272a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '12px',
                lineHeight: 1,
                backgroundColor: '#ffffff',
              }}
            >
              {isCash ? '✓' : ''}
            </div>
            <span>EFECTIVO</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '12px',
                lineHeight: 1,
                backgroundColor: '#ffffff',
              }}
            >
              {isTransfer ? '✓' : ''}
            </div>
            <span>TRANSFERENCIA</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                border: '2px solid #18181b',
                color: '#09090b',
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '12px',
                lineHeight: 1,
                backgroundColor: '#ffffff',
              }}
            >
              {isDoc ? '✓' : ''}
            </div>
            <span>DOCUMENTO</span>
          </div>
        </div>

        {/* Montos */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#52525b', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
            VALOR $: <span style={{ color: '#09090b', fontWeight: 800 }}>${formattedAmount}</span>
          </div>
          <div
            style={{
              color: '#09090b',
              borderTop: '1px solid #d4d4d8',
              paddingTop: '6px',
              fontSize: '13px',
              fontWeight: 800,
            }}
          >
            TOTAL DE ARRIENDO:{' '}
            <span style={{ color: '#09090b', fontSize: '16px', fontWeight: 900 }}>${formattedAmount}</span>
          </div>
        </div>
      </div>

      {/* MONTO EN PALABRAS */}
      <div
        style={{
          backgroundColor: '#f4f4f5',
          border: '1px solid #e4e4e7',
          color: '#09090b',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginTop: '12px',
          marginBottom: '20px',
        }}
      >
        <span style={{ color: '#52525b', fontWeight: 800 }}>SON: </span>
        {voucher.amountInWords || '---'}
      </div>

      {/* PARTE INFERIOR: SELLO PAGADO Y FIRMA */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '8px',
          paddingBottom: '8px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          minHeight: '110px',
        }}
      >
        {/* SELLO DE PAGADO */}
        {isPaid ? (
          <div style={{ padding: '4px', overflow: 'visible' }}>
            <div
              style={{
                border: '3px solid #059669',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                borderRadius: '10px',
                padding: '8px 22px',
                transform: 'none',
                display: 'inline-block',
                boxShadow: 'none',
              }}
            >
              <span
                style={{
                  color: '#047857',
                  fontSize: '30px',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  display: 'block',
                  textAlign: 'center',
                  lineHeight: '1.1',
                  textTransform: 'uppercase',
                }}
              >
                PAGADO
              </span>
              <span
                style={{
                  color: '#065f46',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '4px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                }}
              >
                PAGADO EL {formatVoucherDisplayDate(voucher.paymentDate)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ width: '100px' }} />
        )}

        {/* FIRMA ARRENDADOR */}
        <div
          style={{
            borderTop: '2px solid #18181b',
            paddingTop: '8px',
            width: '240px',
            textAlign: 'center',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              color: '#09090b',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            ARRENDADOR
          </span>
          <span style={{ color: '#71717a', fontSize: '10px', fontWeight: 500, display: 'block', marginTop: '2px' }}>
            NyS Negocios y Soluciones Inmobiliarias
          </span>
        </div>
      </div>
    </div>
  )
}
