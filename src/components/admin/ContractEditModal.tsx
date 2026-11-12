'use client'

import React, { useState } from 'react'
import { X, Save, Building, User, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { ComboboxCustom } from '@/components/ui/ComboboxCustom'
import { updateContractRecord, createContractRecord, ContractFormData } from '@/app/admin/arriendos/actions'

export interface ContractItem {
  id: string
  companyId: string | null
  newAssignee: string | null
  building: string
  unitNumber: string
  propertyType: string
  rol: string | null
  address: string | null
  storageNumber: string | null
  parkingNumber: string | null
  contractDate: string | null
  renewalPeriod: string | null
  status: string
  tenantName: string
  tenantRut: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  otherContactInfo: string | null
  guarantorRelation: string | null
  guarantorPhone: string | null
  guarantorEmail: string | null
  baseRent: number
  adjustmentPercentage: number
  adjustmentAmount: number
  totalRent: number
  guaranteeAmount: number | null
  expensesCharge: number | null
  expensesPayment: number | null
  previousRent: number | null
  company?: {
    id: string
    code: string
    name: string
  } | null
  latestVoucher?: {
    totalMonth: number
    pendingBalance: number
    paymentStatus: string
    month: string
    year: number
    paymentDate: string | null
  } | null
}

interface ContractEditModalProps {
  contract: ContractItem | null // null para crear nuevo
  companies: { id: string; code: string; name: string }[]
  buildings: string[]
  onClose: () => void
  onSaved: (contract: any) => void
}

const PROPERTY_TYPES = [
  'Departamento',
  'Local Comercial',
  'Oficina',
  'Bodega',
  'Estacionamiento',
  'Casas',
]

const STATUS_OPTIONS = [
  'Ocupado',
  'Disponible',
  'Vendido',
  'En Retiro',
]

const RENEWAL_OPTIONS = [
  '6 MESES',
  '1 AÑO',
  '1 AÑO Y 10 DÍAS',
  '1 AÑO Y 15 DÍAS',
  '1 AÑO Y 22 DÍAS',
  '2 AÑOS',
  'INDEFINIDO',
]

export function ContractEditModal({
  contract,
  companies,
  buildings,
  onClose,
  onSaved,
}: ContractEditModalProps) {
  const isEditing = Boolean(contract)

  // Inmueble
  const [companyId, setCompanyId] = useState(contract?.companyId || companies[0]?.id || '')
  const [building, setBuilding] = useState(contract?.building || buildings[0] || 'AMALFI')
  const [unitNumber, setUnitNumber] = useState(contract?.unitNumber || '')
  const [propertyType, setPropertyType] = useState(contract?.propertyType || 'Departamento')
  const [rol, setRol] = useState(contract?.rol || '')
  const [address, setAddress] = useState(contract?.address || '')
  const [storageNumber, setStorageNumber] = useState(contract?.storageNumber || '')
  const [parkingNumber, setParkingNumber] = useState(contract?.parkingNumber || '')

  // Arrendatario
  const [tenantName, setTenantName] = useState(contract?.tenantName || '')
  const [tenantRut, setTenantRut] = useState(contract?.tenantRut || '')
  const [tenantPhone, setTenantPhone] = useState(contract?.tenantPhone || '')
  const [tenantEmail, setTenantEmail] = useState(contract?.tenantEmail || '')
  const [otherContactInfo, setOtherContactInfo] = useState(contract?.otherContactInfo || '')

  // Aval / Garantía
  const [guarantorRelation, setGuarantorRelation] = useState(contract?.guarantorRelation || '')
  const [guarantorPhone, setGuarantorPhone] = useState(contract?.guarantorPhone || '')
  const [guarantorEmail, setGuarantorEmail] = useState(contract?.guarantorEmail || '')

  // Contrato
  const [contractDate, setContractDate] = useState(contract?.contractDate || '')
  const [renewalPeriod, setRenewalPeriod] = useState(contract?.renewalPeriod || '1 AÑO')
  const [status, setStatus] = useState(contract?.status || 'Ocupado')
  const [newAssignee, setNewAssignee] = useState(contract?.newAssignee || '')

  // Valores
  const [baseRent, setBaseRent] = useState(contract?.baseRent?.toString() || '0')
  const [adjustmentPercent, setAdjustmentPercent] = useState(
    contract?.adjustmentPercentage !== undefined ? contract.adjustmentPercentage.toString() : '0'
  )
  const [adjustmentAmount, setAdjustmentAmount] = useState(
    contract?.adjustmentAmount !== undefined ? contract.adjustmentAmount.toString() : '0'
  )
  const [totalRent, setTotalRent] = useState(contract?.totalRent?.toString() || '0')
  const [guaranteeAmount, setGuaranteeAmount] = useState(contract?.guaranteeAmount?.toString() || '')
  const [expensesCharge, setExpensesCharge] = useState(contract?.expensesCharge?.toString() || '')
  const [expensesPayment, setExpensesPayment] = useState(contract?.expensesPayment?.toString() || '')
  const [previousRent, setPreviousRent] = useState(contract?.previousRent?.toString() || '')

  const [activeTab, setActiveTab] = useState<'inmueble' | 'arrendatario' | 'valores'>('inmueble')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Recalcular reajuste y total
  function handleRecalculate() {
    const base = parseFloat(baseRent) || 0
    const pct = parseFloat(adjustmentPercent) || 0
    let adj = parseFloat(adjustmentAmount) || 0

    if (pct > 0) {
      adj = Math.round(base * pct)
      setAdjustmentAmount(adj.toString())
    }

    const tot = base + adj
    setTotalRent(tot.toString())
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    if (!building.trim()) {
      setError('El edificio o denominación del inmueble es obligatorio.')
      setIsSaving(false)
      return
    }

    if (!tenantName.trim()) {
      setError('El nombre del arrendatario es obligatorio (puedes colocar Disponible si está vacante).')
      setIsSaving(false)
      return
    }

    const payload: ContractFormData = {
      companyId: companyId || null,
      building: building.trim(),
      unitNumber: unitNumber.trim(),
      propertyType: propertyType.trim(),
      rol: rol.trim() || null,
      address: address.trim() || null,
      storageNumber: storageNumber.trim() || null,
      parkingNumber: parkingNumber.trim() || null,
      contractDate: contractDate.trim() || null,
      renewalPeriod: renewalPeriod.trim() || null,
      status: status.trim(),
      newAssignee: newAssignee.trim() || null,
      tenantName: tenantName.trim(),
      tenantRut: tenantRut.trim() || null,
      tenantPhone: tenantPhone.trim() || null,
      tenantEmail: tenantEmail.trim() || null,
      otherContactInfo: otherContactInfo.trim() || null,
      guarantorRelation: guarantorRelation.trim() || null,
      guarantorPhone: guarantorPhone.trim() || null,
      guarantorEmail: guarantorEmail.trim() || null,
      baseRent: parseFloat(baseRent) || 0,
      adjustmentPercentage: parseFloat(adjustmentPercent) || 0,
      adjustmentAmount: parseFloat(adjustmentAmount) || 0,
      totalRent: parseFloat(totalRent) || 0,
      guaranteeAmount: guaranteeAmount ? parseFloat(guaranteeAmount) : null,
      expensesCharge: expensesCharge ? parseFloat(expensesCharge) : null,
      expensesPayment: expensesPayment ? parseFloat(expensesPayment) : null,
      previousRent: previousRent ? parseFloat(previousRent) : null,
    }

    let res: any
    if (isEditing && contract) {
      res = await updateContractRecord(contract.id, payload)
    } else {
      res = await createContractRecord(payload)
    }

    setIsSaving(false)

    if (res?.error) {
      setError(res.error)
    } else {
      onSaved(res.contract)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? `Editar Propiedad: ${contract?.building} ${contract?.unitNumber}` : 'Nueva Propiedad / Contrato'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Administra los datos maestros del inmueble, arrendatario, contactos y valores contractuales.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-border bg-muted/10 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('inmueble')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'inmueble'
                ? 'border-primary text-primary bg-background rounded-t-xl shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>1. Inmueble y Ubicación</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('arrendatario')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'arrendatario'
                ? 'border-primary text-primary bg-background rounded-t-xl shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>2. Arrendatario y Contactos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('valores')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'valores'
                ? 'border-primary text-primary bg-background rounded-t-xl shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Valores y Condiciones</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: INMUEBLE */}
          {activeTab === 'inmueble' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Empresa Propietaria</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <ComboboxCustom
                label="Edificio / Inmueble"
                value={building}
                onChange={setBuilding}
                options={buildings}
                placeholder="Selecciona o escribe edificio..."
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Unidad / N° Depto / Local</label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="Ej: 1001, A-503, Local 1..."
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <ComboboxCustom
                label="Tipo de Inmueble"
                value={propertyType}
                onChange={setPropertyType}
                options={PROPERTY_TYPES}
                placeholder="Selecciona tipo de inmueble..."
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">ROL Propiedad</label>
                <input
                  type="text"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  placeholder="Ej: 491-022"
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Dirección Específica</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: 1 Poniente Nº 635, Talca"
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Bodega N°</label>
                <input
                  type="text"
                  value={storageNumber}
                  onChange={(e) => setStorageNumber(e.target.value)}
                  placeholder="Ej: 74, 12 sub..."
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Estacionamiento N°</label>
                <input
                  type="text"
                  value={parkingNumber}
                  onChange={(e) => setParkingNumber(e.target.value)}
                  placeholder="Ej: 179, 15 ext..."
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-foreground">Nuevo Asignatario / Administrador</label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Ej: Patricia Retamal, Jose Manuel Retamal..."
                  className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

            </div>
          )}

          {/* TAB 2: ARRENDATARIO Y CONTACTOS */}
          {activeTab === 'arrendatario' && (
            <div className="space-y-6">
              
              <div className="bg-muted/20 p-4 rounded-2xl border border-border space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Titular del Arriendo</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nombre Arrendatario *</label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      required
                      placeholder="Nombre completo o Razón Social"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">RUT Arrendatario</label>
                    <input
                      type="text"
                      value={tenantRut}
                      onChange={(e) => setTenantRut(e.target.value)}
                      placeholder="Ej: 12.345.678-9"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Teléfono Arrendatario</label>
                    <input
                      type="text"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      placeholder="Ej: +56 9 1234 5678"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Correo Electrónico</label>
                    <input
                      type="email"
                      value={tenantEmail}
                      onChange={(e) => setTenantEmail(e.target.value)}
                      placeholder="arrendatario@correo.cl"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Otros Datos de Contacto</label>
                    <input
                      type="text"
                      value={otherContactInfo}
                      onChange={(e) => setOtherContactInfo(e.target.value)}
                      placeholder="Notas adicionales de contacto o dirección alternativa..."
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Aval / Contacto Secundario */}
              <div className="bg-muted/20 p-4 rounded-2xl border border-border space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aval / Codeudor / Contacto Secundario</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Relación con Arrendatario</label>
                    <input
                      type="text"
                      value={guarantorRelation}
                      onChange={(e) => setGuarantorRelation(e.target.value)}
                      placeholder="Ej: Aval, Esposa, Hermano, Hija..."
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Teléfono Contacto</label>
                    <input
                      type="text"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      placeholder="Ej: +56 9 8765 4321"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Correo Aval</label>
                    <input
                      type="email"
                      value={guarantorEmail}
                      onChange={(e) => setGuarantorEmail(e.target.value)}
                      placeholder="aval@correo.cl"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: VALORES Y CONDICIONES */}
          {activeTab === 'valores' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DatePickerField
                  label="Fecha de Contrato"
                  value={contractDate}
                  onChange={setContractDate}
                  placeholder="YYYY-MM-DD o DD-MM-YYYY"
                />

                <ComboboxCustom
                  label="Período de Renovación"
                  value={renewalPeriod}
                  onChange={setRenewalPeriod}
                  options={RENEWAL_OPTIONS}
                  placeholder="Selecciona período..."
                />

                <ComboboxCustom
                  label="Estado de la Propiedad"
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS}
                  placeholder="Selecciona estado..."
                />
              </div>

              {/* Valores Financieros */}
              <div className="bg-muted/20 p-4 rounded-2xl border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Valores de Arriendo y Reajustes</span>
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    ⚡ Calcular Reajuste y Total
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Arriendo Base ($)</label>
                    <input
                      type="number"
                      value={baseRent}
                      onChange={(e) => setBaseRent(e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">% Reajuste (ej: 0.03 = 3%)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={adjustmentPercent}
                      onChange={(e) => setAdjustmentPercent(e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Monto Reajuste ($)</label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Total Arriendo / Valor T ($)</label>
                    <input
                      type="number"
                      value={totalRent}
                      onChange={(e) => setTotalRent(e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-primary/10 border border-primary/30 rounded-xl text-primary font-black focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Monto Garantía ($)</label>
                    <input
                      type="number"
                      value={guaranteeAmount}
                      onChange={(e) => setGuaranteeAmount(e.target.value)}
                      placeholder="Opcional"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Gastos Comunes Cargo ($)</label>
                    <input
                      type="number"
                      value={expensesCharge}
                      onChange={(e) => setExpensesCharge(e.target.value)}
                      placeholder="Opcional"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Gastos Comunes Abono ($)</label>
                    <input
                      type="number"
                      value={expensesPayment}
                      onChange={(e) => setExpensesPayment(e.target.value)}
                      placeholder="Opcional"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Arriendo Anterior / 20252 ($)</label>
                    <input
                      type="number"
                      value={previousRent}
                      onChange={(e) => setPreviousRent(e.target.value)}
                      placeholder="Opcional"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Propiedad')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
