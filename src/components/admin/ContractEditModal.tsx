'use client'

import React, { useState } from 'react'
import {
  X,
  Save,
  Building,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  Pencil,
  Phone,
  Mail,
  Home,
  FileText,
  CheckCircle2,
  Tag,
  Warehouse,
  Car,
  Receipt,
  Users,
  ShieldCheck,
  ChevronRight,
  Clock,
  Info,
} from 'lucide-react'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { ComboboxCustom } from '@/components/ui/ComboboxCustom'
import {
  updateContractRecord,
  createContractRecord,
  ContractFormData,
} from '@/app/admin/arriendos/actions'

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
  autoRenewal?: boolean
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
    receiptNumber?: string | null
    invoiceNumber?: string | null
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
  initialMode?: 'view' | 'edit'
  initialTab?: 'inmueble' | 'arrendatario' | 'valores'
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
  initialMode,
  initialTab,
  onClose,
  onSaved,
}: ContractEditModalProps) {
  const isEditing = Boolean(contract)
  const [mode, setMode] = useState<'view' | 'edit'>(
    initialMode || (isEditing ? 'view' : 'edit')
  )

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
  const [autoRenewal, setAutoRenewal] = useState(contract?.autoRenewal ?? true)
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

  const [activeTab, setActiveTab] = useState<'inmueble' | 'arrendatario' | 'valores'>(
    initialTab || 'inmueble'
  )
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

    const isVacantOrSold = status === 'Disponible' || status === 'Vendido'

    if (status === 'Ocupado') {
      const isPlaceholder =
        !tenantName.trim() ||
        ['disponible', 'vendido', 'por asignar', 'sin arrendatario'].includes(
          tenantName.toLowerCase().trim()
        )
      if (isPlaceholder) {
        setError(
          'Para marcar una propiedad como Ocupada, debes registrar el nombre del nuevo arrendatario en la pestaña Arrendatario.'
        )
        setActiveTab('arrendatario')
        setIsSaving(false)
        return
      }
    }

    let finalTenantName = tenantName.trim()
    if (isVacantOrSold && (!finalTenantName || ['disponible', 'vendido', 'por asignar', ''].includes(finalTenantName.toLowerCase()))) {
      finalTenantName = status === 'Vendido' ? 'VENDIDO' : 'DISPONIBLE'
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
      autoRenewal,
      status: status.trim(),
      newAssignee: newAssignee.trim() || null,
      tenantName: finalTenantName,
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
      if (isEditing) {
        setMode('view')
      } else {
        onClose()
      }
    }
  }

  const isVacant =
    contract?.status === 'Disponible' ||
    !contract?.tenantName ||
    contract.tenantName.toLowerCase().includes('disponible') ||
    contract.tenantName.toLowerCase().includes('sin arrendatario')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* ======================================================== */}
        {/* HEADER */}
        {/* ======================================================== */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground leading-tight">
                  {contract
                    ? `${contract.building} ${contract.unitNumber ? `— N° ${contract.unitNumber}` : ''}`
                    : 'Nueva Propiedad / Contrato'}
                </h2>
                {contract && (
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      isVacant
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {contract.status || (isVacant ? 'Disponible' : 'Ocupado')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {contract?.company?.name || 'Inversiones NyS'} • Tipo: {contract?.propertyType || propertyType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de alternar a modo Edición / Vista */}
            {contract && mode === 'view' && (
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs border border-primary/20 transition-all cursor-pointer shadow-xs"
                title="Editar datos de la propiedad"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Ficha</span>
              </button>
            )}

            {contract && mode === 'edit' && (
              <button
                type="button"
                onClick={() => setMode('view')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs border border-border transition-all cursor-pointer"
                title="Volver a la vista de ficha"
              >
                <span>Ver Ficha</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MODO VISTA: FICHA ELEGANTE DE LA PROPIEDAD */}
        {/* ======================================================== */}
        {mode === 'view' && contract && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Banner Superior de Resumen Económico */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-muted/40 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Valor Arriendo Mensual (Valor T)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">
                  ${Math.round(contract.totalRent || 0).toLocaleString('es-CL')}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <span>Base: ${Math.round(contract.baseRent || 0).toLocaleString('es-CL')}</span>
                  {contract.adjustmentAmount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +${Math.round(contract.adjustmentAmount).toLocaleString('es-CL')} (
                        {contract.adjustmentPercentage > 1
                          ? `${contract.adjustmentPercentage.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`
                          : `${(contract.adjustmentPercentage * 100).toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`}{' '}
                        reajuste)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
                <div className="text-xs text-muted-foreground">
                  Mes: <strong className="text-foreground">{contract.latestVoucher?.month || 'Actual'}</strong>
                </div>
                {contract.latestVoucher?.receiptNumber && (
                  <div className="text-xs text-muted-foreground">
                    N° Recibo: <strong className="text-foreground">{contract.latestVoucher.receiptNumber}</strong>
                  </div>
                )}
                {contract.latestVoucher?.invoiceNumber && (
                  <div className="text-xs text-muted-foreground">
                    Factura: <strong className="text-foreground">{contract.latestVoucher.invoiceNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Cuadrícula de Secciones de la Ficha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* SECCIÓN 1: DATOS DEL INMUEBLE */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
                  <Home className="w-4 h-4 shrink-0" />
                  <span>1. Inmueble y Ubicación</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Edificio:</span>
                    <strong className="text-foreground text-sm font-semibold">{contract.building}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">N° Unidad / Depto:</span>
                    <strong className="text-foreground text-sm font-semibold">{contract.unitNumber || 'S/N'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Tipo Inmueble:</span>
                    <span className="text-foreground font-medium">{contract.propertyType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">ROL:</span>
                    <span className="text-foreground font-mono font-medium">{contract.rol || 'Sin ROL'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Bodega N°:</span>
                    <span className="text-foreground font-medium">{contract.storageNumber || 'Sin bodega'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estacionamiento N°:</span>
                    <span className="text-foreground font-medium">{contract.parkingNumber || 'Sin estacionamiento'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground block text-[11px]">Empresa Propietaria:</span>
                    <span className="text-foreground font-semibold">
                      {contract.company?.name || 'Inversiones NyS'} {contract.company?.code ? `(${contract.company.code})` : ''}
                    </span>
                  </div>
                  {contract.address && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[11px]">Dirección:</span>
                      <span className="text-foreground">{contract.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: CONTRATO Y PERÍODO */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>2. Contrato y Vigencia</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Fecha Contrato:</span>
                    <span className="text-foreground font-semibold">{contract.contractDate || 'No registrada'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Período Renovación:</span>
                    <span className="text-foreground font-semibold">{contract.renewalPeriod || '1 AÑO'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estado Propiedad:</span>
                    <span className="text-foreground font-medium">{contract.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nuevo Asignatario:</span>
                    <span className="text-foreground font-medium">{contract.newAssignee || 'No asignado'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">N° Recibo Vigente:</span>
                    <span className="text-foreground font-mono font-medium">{contract.latestVoucher?.receiptNumber || 'Sin recibo'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Factura Vigente:</span>
                    <span className="text-foreground font-mono font-medium">{contract.latestVoucher?.invoiceNumber || 'Sin factura'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground block text-[11px]">Mes Vigente:</span>
                    <span className="text-foreground font-semibold">{contract.latestVoucher?.month || 'No liquidado'}</span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: VALORES FINANCIEROS Y REAJUSTES */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>3. Valores y Reajustes</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Arriendo 2026 (Base):</span>
                    <span className="text-foreground font-semibold">${contract.baseRent.toLocaleString('es-CL')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">% Reajuste:</span>
                    <span className="text-foreground font-semibold">
                      {contract.adjustmentPercentage > 1
                        ? `${contract.adjustmentPercentage.toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`
                        : `${(contract.adjustmentPercentage * 100).toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reajuste ($):</span>
                    <span className="text-foreground font-semibold">
                      ${Math.round(contract.adjustmentAmount || 0).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Valor T (Reajustado):</span>
                    <span className="text-primary font-black text-sm">
                      ${Math.round(contract.totalRent || 0).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Arriendo 20252 (Anterior):</span>
                    <span className="text-foreground">{contract.previousRent ? `$${contract.previousRent.toLocaleString('es-CL')}` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Garantía:</span>
                    <span className="text-foreground">{contract.guaranteeAmount ? `$${contract.guaranteeAmount.toLocaleString('es-CL')}` : '-'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground block text-[11px]">Gastos Comunes:</span>
                    <span className="text-foreground">
                      {contract.expensesCharge || contract.expensesPayment
                        ? `Cargo: $${contract.expensesCharge || 0} / Abono: $${contract.expensesPayment || 0}`
                        : 'No aplica'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: ARRENDATARIO Y CONTACTOS */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-border">
                  <User className="w-4 h-4 shrink-0" />
                  <span>4. Arrendatario y Contactos</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Arrendatario / Titular:</span>
                    <strong className="text-foreground text-sm font-semibold block">{contract.tenantName}</strong>
                    {contract.tenantRut && (
                      <span className="text-[11px] text-muted-foreground font-mono">RUT: {contract.tenantRut}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Teléfono Arrendatario:</span>
                      {contract.tenantPhone ? (
                        <a
                          href={`tel:${contract.tenantPhone}`}
                          className="text-primary font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{contract.tenantPhone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sin teléfono</span>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground block text-[11px]">Correo Arrendatario:</span>
                      {contract.tenantEmail ? (
                        <a
                          href={`mailto:${contract.tenantEmail}`}
                          className="text-primary font-semibold hover:underline truncate block"
                          title={contract.tenantEmail}
                        >
                          {contract.tenantEmail}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sin correo</span>
                      )}
                    </div>
                  </div>

                  {contract.otherContactInfo && (
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <span className="text-muted-foreground block text-[11px]">Otros Datos de Contacto / Notas:</span>
                      <p className="text-foreground">
                        {contract.otherContactInfo
                          .split('\n')
                          .filter((l) => !l.includes('Historial previo'))
                          .join('\n') || 'Sin notas adicionales'}
                      </p>

                      {/* Historial de arrendatarios anteriores */}
                      {contract.otherContactInfo.includes('Historial previo') && (
                        <div className="mt-2 p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Historial de Arrendatarios Anteriores</span>
                          </div>
                          <div className="space-y-1">
                            {contract.otherContactInfo
                              .split('\n')
                              .filter((l) => l.includes('Historial previo'))
                              .map((line, idx) => (
                                <div key={idx} className="p-2 rounded-lg bg-card border border-border/60 text-xs text-foreground">
                                  {line.replace(/^\[|\]$/g, '')}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Datos de Aval / Contacto Adicional */}
                  <div className="pt-2 border-t border-border/50 bg-muted/20 p-2.5 rounded-xl">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Contacto Adicional / Aval
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Relación:</span>
                        <span className="font-semibold text-foreground">{contract.guarantorRelation || 'No especificada'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Teléfono:</span>
                        <span className="font-semibold text-foreground">{contract.guarantorPhone || 'Sin teléfono'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground block">Correo:</span>
                        <span className="text-foreground">{contract.guarantorEmail || 'Sin correo'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer de Ficha */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ID de registro: <code className="font-mono text-[10px]">{contract.id}</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Modificar Datos (Lápiz)</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* MODO EDICIÓN: FORMULARIO INTERACTIVO */}
        {/* ======================================================== */}
        {mode === 'edit' && (
          <>
            {/* Pestañas de Edición */}
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

              {/* Selector Principal y Prominente de Estado de la Propiedad */}
              <div className="p-4 rounded-2xl bg-muted/25 border border-border space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Estado de la Propiedad</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Define la disponibilidad del inmueble y el flujo de cobro
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Ocupado', label: 'Ocupado', desc: 'Contrato y arrendatario activo', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                    { id: 'Disponible', label: 'Disponible', desc: 'Vacante / Lista para arriendo', color: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                    { id: 'Vendido', label: 'Vendido', desc: 'Propiedad enajenada / vendida', color: 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                    { id: 'En Retiro', label: 'En Retiro', desc: 'En mantención o término', color: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setStatus(item.id)
                        if (item.id === 'Ocupado') {
                          if (['disponible', 'vendido', 'por asignar', ''].includes(tenantName.toLowerCase().trim())) {
                            setTenantName('')
                            setActiveTab('arrendatario')
                          }
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        status === item.id
                          ? `${item.color} ring-2 ring-primary/40 font-bold shadow-xs`
                          : 'border-border bg-card hover:bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="text-[10px] opacity-75 leading-tight mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Avisos dinámicos */}
                {(status === 'Disponible' || status === 'Vendido') && (
                  <div className="text-xs p-2.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      La propiedad quedará guardada como <strong>{status.toUpperCase()}</strong>. Si tenía un arrendatario activo ({tenantName || 'registrado'}), este se archivará automáticamente en el historial de la ficha para mantener los registros limpios.
                    </span>
                  </div>
                )}

                {status === 'Ocupado' && (!tenantName.trim() || ['disponible', 'vendido', 'por asignar'].includes(tenantName.toLowerCase().trim())) && (
                  <div className="text-xs p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Para una propiedad <strong>OCUPADA</strong>, recuerda ingresar el nombre, RUT y contacto del nuevo arrendatario en la pestaña <strong>2. Arrendatario</strong>.
                    </span>
                  </div>
                )}
              </div>

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
                      placeholder="Ej: 402, 101, Local 3"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Tipo de Inmueble</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">ROL</label>
                    <input
                      type="text"
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      placeholder="Ej: 1193-213"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground font-mono focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Bodega N°</label>
                    <input
                      type="text"
                      value={storageNumber}
                      onChange={(e) => setStorageNumber(e.target.value)}
                      placeholder="Ej: B-12"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Estacionamiento N°</label>
                    <input
                      type="text"
                      value={parkingNumber}
                      onChange={(e) => setParkingNumber(e.target.value)}
                      placeholder="Ej: E-45"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Dirección Específica</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: 1 Norte Nº 925, Talca"
                      className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ARRENDATARIO Y CONTACTOS */}
              {activeTab === 'arrendatario' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground">Nombre Arrendatario / Titular *</label>
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Ej: Juan Pérez González (o Disponible)"
                        required
                        className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground font-semibold focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">RUT Arrendatario</label>
                      <input
                        type="text"
                        value={tenantRut}
                        onChange={(e) => setTenantRut(e.target.value)}
                        placeholder="Ej: 12.345.678-9"
                        className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground font-mono focus:ring-2 focus:ring-primary/20"
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

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground">Correo Arrendatario</label>
                      <input
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="arrendatario@correo.cl"
                        className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-foreground">Otros Datos de Contacto / Notas</label>
                      <textarea
                        value={otherContactInfo}
                        onChange={(e) => setOtherContactInfo(e.target.value)}
                        placeholder="Dirección laboral, referencias, notas adicionales..."
                        rows={2}
                        className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Tarjeta de Historial de Arrendatarios Anteriores */}
                    {otherContactInfo && otherContactInfo.includes('Historial previo') && (
                      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2 md:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>Historial de Arrendatarios Anteriores (Archivado Automático)</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {otherContactInfo
                            .split('\n')
                            .filter((l) => l.includes('Historial previo'))
                            .map((line, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/70 text-foreground">
                                {line.replace(/^\[|\]$/g, '')}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sección Aval */}
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Aval / Contacto Adicional
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Relación con Arrendatario</label>
                        <input
                          type="text"
                          value={guarantorRelation}
                          onChange={(e) => setGuarantorRelation(e.target.value)}
                          placeholder="Ej: Aval, Cónyuge, Padre..."
                          className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Teléfono Contacto</label>
                        <input
                          type="text"
                          value={guarantorPhone}
                          onChange={(e) => setGuarantorPhone(e.target.value)}
                          placeholder="+56 9 8765 4321"
                          className="w-full py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Correo Contacto</label>
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

                  {/* Checkbox Prórroga Automática */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border">
                    <input
                      type="checkbox"
                      id="autoRenewalCheckbox"
                      checked={autoRenewal}
                      onChange={(e) => setAutoRenewal(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="autoRenewalCheckbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                      <span>Renovación Automática / Prórroga Tácita Sucesiva</span>
                      <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">
                        Si está activo, el contrato se prorroga automáticamente por cada período cumplido y entra en alerta &ldquo;Por Vencer&rdquo; solo durante los 30 días previos al término de cada ciclo.
                      </span>
                    </label>
                  </div>

                  {/* Valores Financieros */}
                  <div className="bg-muted/20 p-4 rounded-2xl border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Valores de Arriendo y Reajustes
                      </span>
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
                        <label className="text-xs font-semibold text-foreground">Arriendo 2026 / Base ($)</label>
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

              {/* Footer del Modal en Edición */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) setMode('view')
                    else onClose()
                  }}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {isEditing ? 'Cancelar y Volver a Ficha' : 'Cancelar'}
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
          </>
        )}

      </div>
    </div>
  )
}
