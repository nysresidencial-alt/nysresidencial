'use client'

import React, { useState } from 'react'
import { X, Save, Loader2, Building, User, DollarSign, Calendar, FileText } from 'lucide-react'
import { updateVoucher, updateContract } from '@/app/admin/vouchers/actions'
import { VoucherDetail } from './VoucherPrintModal'

interface VoucherEditModalProps {
  voucher: VoucherDetail
  onClose: () => void
  onSaved: () => void
}

export function VoucherEditModal({ voucher, onClose, onSaved }: VoucherEditModalProps) {
  const [activeTab, setActiveTab] = useState<'voucher' | 'contract'>('voucher')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const c = voucher.contract

  // Estado del Voucher
  const [receiptNumber, setReceiptNumber] = useState(voucher.receiptNumber || '')
  const [invoiceNumber, setInvoiceNumber] = useState(voucher.invoiceNumber || '')
  const [totalRent, setTotalRent] = useState(voucher.totalRent.toString())
  const [guaranteeAmount, setGuaranteeAmount] = useState(voucher.guaranteeAmount?.toString() || '0')
  const [paymentStatus, setPaymentStatus] = useState(voucher.paymentStatus || 'Pendiente')
  const [paymentDate, setPaymentDate] = useState(voucher.paymentDate || '')
  const [transferAmount, setTransferAmount] = useState(voucher.transferAmount.toString())
  const [cashAmount, setCashAmount] = useState(voucher.cashAmount.toString())
  const [depositAmount, setDepositAmount] = useState(voucher.depositAmount.toString())
  const [bank, setBank] = useState(voucher.bank || '')
  const [comment, setComment] = useState(voucher.comment || '')
  const [paymentMethod, setPaymentMethod] = useState(voucher.paymentMethod || 'Transferencia')

  // Estado del Contrato / Arrendatario
  const [tenantName, setTenantName] = useState(c.tenantName)
  const [tenantRut, setTenantRut] = useState(c.tenantRut || '')
  const [tenantPhone, setTenantPhone] = useState(c.tenantPhone || '')
  const [tenantEmail, setTenantEmail] = useState(c.tenantEmail || '')
  const [building, setBuilding] = useState(c.building)
  const [unitNumber, setUnitNumber] = useState(c.unitNumber)
  const [propertyType, setPropertyType] = useState(c.propertyType)
  const [rol, setRol] = useState(c.rol || '')
  const [address, setAddress] = useState(c.address || '')
  const [storageNumber, setStorageNumber] = useState(c.storageNumber || '')
  const [parkingNumber, setParkingNumber] = useState(c.parkingNumber || '')
  const [guarantorRelation, setGuarantorRelation] = useState(c.guarantorRelation || '')
  const [guarantorPhone, setGuarantorPhone] = useState(c.guarantorPhone || '')
  const [guarantorEmail, setGuarantorEmail] = useState(c.guarantorEmail || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      if (activeTab === 'voucher') {
        const res = await updateVoucher(voucher.id, {
          receiptNumber,
          invoiceNumber,
          totalRent: parseFloat(totalRent) || 0,
          guaranteeAmount: parseFloat(guaranteeAmount) || 0,
          paymentStatus,
          paymentDate,
          transferAmount: parseFloat(transferAmount) || 0,
          cashAmount: parseFloat(cashAmount) || 0,
          depositAmount: parseFloat(depositAmount) || 0,
          bank,
          comment,
          paymentMethod,
        })
        if (res.error) {
          setError(res.error)
          setIsSaving(false)
          return
        }
      } else {
        const res = await updateContract(c.id, {
          tenantName,
          tenantRut,
          tenantPhone,
          tenantEmail,
          building,
          unitNumber,
          propertyType,
          rol,
          address,
          storageNumber,
          parkingNumber,
          guarantorRelation,
          guarantorPhone,
          guarantorEmail,
          totalRent: parseFloat(totalRent) || 0,
        })
        if (res.error) {
          setError(res.error)
          setIsSaving(false)
          return
        }
      }

      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Editar Liquidación & Arrendatario
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {c.tenantName} &bull; {c.building} {c.unitNumber} ({voucher.month} {voucher.year})
          </p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex border-b border-border mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'voucher'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Datos del Recibo ({voucher.month})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'contract'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Ficha del Arrendatario & Unidad</span>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'voucher' ? (
            /* TAB 1: DATOS DEL VOUCHER DEL MES */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    N° de Recibo
                  </label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="ej: 505"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    N° de Factura (Opcional)
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="ej: 175"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Total Arriendo ($)
                  </label>
                  <input
                    type="number"
                    value={totalRent}
                    onChange={(e) => setTotalRent(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Garantía Cobrada ($)
                  </label>
                  <input
                    type="number"
                    value={guaranteeAmount}
                    onChange={(e) => setGuaranteeAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Estado de Pago
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="Pagado">Pagado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Saldo a Favor">Saldo a Favor</option>
                    <option value="Nulo">Nulo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Fecha de Pago / Ingreso
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Transferencia ($)
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Efectivo ($)
                  </label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Depósito ($)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Banco de Recaudación
                  </label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="ITAU, SANTANDER, etc."
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Medio de Pago en Recibo
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Documento">Documento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Comentario / Observación Interna
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ej: Cancela arriendo con reajuste..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: FICHA DE ARRENDATARIO Y PROPIEDAD */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Nombre del Arrendatario *
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    RUT Arrendatario
                  </label>
                  <input
                    type="text"
                    value={tenantRut}
                    onChange={(e) => setTenantRut(e.target.value)}
                    placeholder="ej: 12.345.678-9"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="+56 9 ..."
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    placeholder="correo@ejemplo.cl"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Edificio
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    N° Unidad / Depto
                  </label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tipo de Inmueble
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  >
                    <option value="Departamento">Departamento</option>
                    <option value="Casas">Casa</option>
                    <option value="Local Comercial">Local Comercial</option>
                    <option value="Estacionamiento">Estacionamiento</option>
                    <option value="Bodega">Bodega</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    ROL Inmueble
                  </label>
                  <input
                    type="text"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    placeholder="ej: 491-022"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Bodega N°
                  </label>
                  <input
                    type="text"
                    value={storageNumber}
                    onChange={(e) => setStorageNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Estacionamiento N°
                  </label>
                  <input
                    type="text"
                    value={parkingNumber}
                    onChange={(e) => setParkingNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Dirección Completa
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ej: 1 Poniente Nº 635 Talca"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Nombre Aval / Contacto
                  </label>
                  <input
                    type="text"
                    value={guarantorRelation}
                    onChange={(e) => setGuarantorRelation(e.target.value)}
                    placeholder="Nombre o parentesco"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Teléfono Aval
                  </label>
                  <input
                    type="text"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Correo Aval
                  </label>
                  <input
                    type="email"
                    value={guarantorEmail}
                    onChange={(e) => setGuarantorEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-70 rounded-xl transition-all shadow-md cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
