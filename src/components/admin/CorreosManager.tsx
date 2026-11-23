'use client'

import React, { useState, useMemo } from 'react'
import {
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Check,
  X,
  FileText,
  Send,
  Loader2,
  Building,
  User,
  Phone,
  ShieldCheck,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react'
import { updateTenantContact, sendTestEmailAction } from '@/app/admin/correos/actions'

export interface TenantContractItem {
  id: string
  building: string
  unitNumber: string
  propertyType: string
  status: string
  tenantName: string
  tenantRut: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  company: {
    id: string
    code: string
    name: string
  } | null
}

interface CorreosManagerProps {
  initialContracts: TenantContractItem[]
}

export function CorreosManager({ initialContracts }: CorreosManagerProps) {
  const [contracts, setContracts] = useState<TenantContractItem[]>(initialContracts)
  const [activeTab, setActiveTab] = useState<'directorio' | 'plantillas' | 'configuracion'>('directorio')

  // Filtros de directorio
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'sin_correo' | 'con_correo'>('todos')

  // Edición inline de correo
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Envío de prueba
  const [testEmailAddress, setTestEmailAddress] = useState('administracion@sunrisechile.cl')
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Plantillas
  const [selectedTemplate, setSelectedTemplate] = useState<'voucher_pagado' | 'aviso_fin_mes'>('voucher_pagado')

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = contracts.length
    const withEmail = contracts.filter((c) => Boolean(c.tenantEmail && c.tenantEmail.trim() !== '')).length
    const withoutEmail = total - withEmail
    const percentage = total > 0 ? Math.round((withEmail / total) * 100) : 0
    return { total, withEmail, withoutEmail, percentage }
  }, [contracts])

  // Filtrado de contratos
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const hasEmail = Boolean(c.tenantEmail && c.tenantEmail.trim() !== '')
      if (filterType === 'sin_correo' && hasEmail) return false
      if (filterType === 'con_correo' && !hasEmail) return false

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchName = c.tenantName.toLowerCase().includes(query)
        const matchRut = (c.tenantRut || '').toLowerCase().includes(query)
        const matchProp = `${c.building} ${c.unitNumber}`.toLowerCase().includes(query)
        const matchEmail = (c.tenantEmail || '').toLowerCase().includes(query)
        const matchComp = (c.company?.name || c.company?.code || '').toLowerCase().includes(query)
        if (!matchName && !matchRut && !matchProp && !matchEmail && !matchComp) return false
      }
      return true
    })
  }, [contracts, filterType, searchTerm])

  function startEditing(c: TenantContractItem) {
    setEditingId(c.id)
    setEditEmail(c.tenantEmail || '')
    setEditPhone(c.tenantPhone || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditEmail('')
    setEditPhone('')
  }

  async function saveContact(contractId: string) {
    setIsSaving(true)
    const res = await updateTenantContact(contractId, {
      tenantEmail: editEmail,
      tenantPhone: editPhone,
    })

    if (res.success && res.contract) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? { ...c, tenantEmail: res.contract.tenantEmail, tenantPhone: res.contract.tenantPhone }
            : c
        )
      )
      setFeedbackMessage({
        text: `Contacto de ${res.contract.tenantName} actualizado correctamente`,
        type: 'success',
      })
      cancelEditing()
    } else {
      setFeedbackMessage({
        text: res.error || 'No se pudo actualizar el contacto',
        type: 'error',
      })
    }
    setIsSaving(false)
  }

  async function handleSendTestEmail() {
    setIsSendingTest(true)
    setFeedbackMessage(null)
    const res = await sendTestEmailAction(testEmailAddress)
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' })
    } else {
      setFeedbackMessage({ text: res.error || 'Error al enviar prueba', type: 'error' })
    }
    setIsSendingTest(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ENCABEZADO Y TÍTULO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Correos y Notificaciones
              </h1>
              <p className="text-xs text-muted-foreground">
                Directorio ágil de correos de arrendatarios, plantillas y control de marcha blanca
              </p>
            </div>
          </div>
        </div>

        {/* BADGE MARCHA BLANCA ACTIVA */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-xs font-bold leading-tight">
            <span>Marcha Blanca Activa</span>
            <span className="block text-[10px] text-amber-700/80 dark:text-amber-400/80 font-normal">
              Destino actual: administracion@sunrisechile.cl
            </span>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="cursor-pointer text-muted-foreground hover:text-foreground">
            &times;
          </button>
        </div>
      )}

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Total Arriendos</span>
          <span className="text-2xl font-black text-foreground">{stats.total}</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">Con Correo</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.withEmail}</span>
            <span className="text-xs text-muted-foreground font-semibold">({stats.percentage}%)</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase block mb-1">Sin Correo</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.withoutEmail}</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Modo de Envío</span>
          <span className="text-xs font-black text-primary px-2.5 py-1 rounded-lg bg-primary/10 inline-block">
            Marcha Blanca
          </span>
        </div>
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('directorio')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'directorio'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Directorio de Arrendatarios</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plantillas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'plantillas'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Plantillas de Correo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('configuracion')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'configuracion'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Marcha Blanca & Pruebas</span>
        </button>
      </div>

      {/* CONTENIDO TAB 1: DIRECTORIO DE ARRENDATARIOS */}
      {activeTab === 'directorio' && (
        <div className="space-y-4">
          {/* BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS */}
          <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              {/* Buscador */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar arrendatario, RUT, edificio, N° unidad, correo o empresa..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Botones de filtro rápido */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterType('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'todos'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos ({stats.total})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('sin_correo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'sin_correo'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sin Correo ({stats.withoutEmail})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('con_correo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'con_correo'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Con Correo ({stats.withEmail})</span>
                </button>
              </div>
            </div>
          </div>

          {/* TABLA DE ARRENDATARIOS */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Arrendatario / RUT</th>
                    <th className="py-3 px-4">Propiedad</th>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Correo Electrónico (Edición Inmediata)</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No se encontraron arrendatarios con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => {
                      const isEditing = editingId === c.id
                      const hasEmail = Boolean(c.tenantEmail && c.tenantEmail.trim() !== '')

                      return (
                        <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                          {/* Arrendatario */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground text-xs">{c.tenantName}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{c.tenantRut || 'Sin RUT'}</div>
                          </td>

                          {/* Propiedad */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">
                              {c.building} - {c.unitNumber}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{c.propertyType}</div>
                          </td>

                          {/* Empresa */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-bold text-foreground">
                              {c.company?.code || 'S/E'}
                            </span>
                          </td>

                          {/* Teléfono */}
                          <td className="py-3 px-4 text-muted-foreground font-mono">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="+56 9..."
                                className="w-28 px-2 py-1 bg-background border border-border rounded-lg text-xs"
                              />
                            ) : (
                              c.tenantPhone || '-'
                            )}
                          </td>

                          {/* Correo Electrónico (Inline Edit) */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveContact(c.id)
                                    if (e.key === 'Escape') cancelEditing()
                                  }}
                                  autoFocus
                                  placeholder="arrendatario@correo.com"
                                  className="w-64 px-2.5 py-1.5 bg-background border border-primary rounded-xl text-xs font-mono text-foreground focus:outline-none shadow-2xs"
                                />
                              </div>
                            ) : hasEmail ? (
                              <span
                                onClick={() => startEditing(c)}
                                className="font-mono text-foreground font-medium hover:text-primary hover:underline cursor-pointer flex items-center gap-1.5 group"
                                title="Haga clic para editar correo"
                              >
                                <span>{c.tenantEmail}</span>
                                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(c)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 text-[11px] font-bold transition-all cursor-pointer"
                                title="Haga clic para ingresar el correo de este arrendatario"
                              >
                                <span>+ Agregar correo</span>
                              </button>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-4 text-center">
                            {hasEmail ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                <span>Listo</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                <span>Falta</span>
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => saveContact(c.id)}
                                  disabled={isSaving}
                                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={isSaving}
                                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(c)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 2: PLANTILLAS DE CORREO */}
      {activeTab === 'plantillas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector de Plantilla */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Seleccionar Notificación
            </h3>

            <div
              onClick={() => setSelectedTemplate('voucher_pagado')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                selectedTemplate === 'voucher_pagado'
                  ? 'bg-primary/5 border-primary shadow-xs'
                  : 'bg-card border-border hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Comprobante de Pago Timbrado</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                  Activo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Se envía automáticamente cuando la encargada registra el pago con su fecha. Adjunta el PDF con timbre PAGADO.
              </p>
            </div>

            <div
              onClick={() => setSelectedTemplate('aviso_fin_mes')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                selectedTemplate === 'aviso_fin_mes'
                  ? 'bg-primary/5 border-primary shadow-xs'
                  : 'bg-card border-border hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground">Aviso Previo de Fin de Mes</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                  Próxima Etapa
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Notifica los últimos días del mes informando que la liquidación del siguiente mes ya está emitida y disponible para pago.
              </p>
            </div>

            {/* Variables Dinámicas */}
            <div className="bg-card border border-border p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-foreground block">Variables dinámicas disponibles:</span>
              <div className="flex flex-wrap gap-1.5">
                {['{ARRENDATARIO}', '{EDIFICIO}', '{UNIDAD}', '{MES}', '{ANO}', '{MONTO}', '{RECIBO}'].map((v) => (
                  <span key={v} className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-bold">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Vista Previa del Correo */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Vista Previa del Correo (Lo que recibe el destinatario)</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Formato HTML Responsivo</span>
            </div>

            {selectedTemplate === 'voucher_pagado' ? (
              <div className="border border-border rounded-2xl overflow-hidden bg-white text-zinc-950 font-sans shadow-xs">
                {/* Header del email */}
                <div className="bg-zinc-950 text-white p-6">
                  <h4 className="text-base font-black tracking-tight m-0">NyS Negocios y Soluciones Inmobiliarias</h4>
                  <p className="text-xs text-zinc-400 mt-1 m-0">Comprobante Oficial de Pago de Arriendo</p>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                    <strong>🛠️ MARCHA BLANCA:</strong> En producción este correo llegará al arrendatario: <strong>Juan Pérez &lt;juan@ejemplo.cl&gt;</strong>.
                  </div>

                  <p className="text-zinc-800 leading-relaxed">
                    Estimado(a) <strong>Juan Pérez</strong>,<br />
                    Confirmamos la recepción de tu pago correspondiente al arriendo del periodo de <strong>Noviembre 2026</strong>. A continuación detallamos los datos de la operación:
                  </p>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">N° de Recibo:</span>
                      <span className="font-bold text-zinc-900">#2266</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">Propiedad:</span>
                      <span className="font-bold text-zinc-900">AMALFI - Depto 1708</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">Monto Recaudado:</span>
                      <span className="font-bold text-emerald-600 text-sm">$303.773 CLP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-semibold">Fecha de Pago:</span>
                      <span className="font-bold text-zinc-900">05/11/2026</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-emerald-800 font-bold text-xs">
                    ✓ Se adjunta a este correo el Recibo Oficial timbrado con PAGADO en formato PDF (1 plana).
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden bg-white text-zinc-950 font-sans shadow-xs p-6 space-y-4 text-xs">
                <div className="bg-zinc-950 text-white p-6 -m-6 mb-4">
                  <h4 className="text-base font-black tracking-tight m-0">NyS Negocios y Soluciones Inmobiliarias</h4>
                  <p className="text-xs text-zinc-400 mt-1 m-0">Aviso de Liquidación Próxima a Vencer</p>
                </div>
                <p className="text-zinc-800 leading-relaxed">
                  Estimado(a) <strong>Juan Pérez</strong>,<br />
                  Te informamos que ya se encuentra emitida la liquidación de arriendo correspondiente al mes de <strong>Diciembre 2026</strong> por un total de <strong>$303.773 CLP</strong> para tu propiedad en <strong>Edificio Amalfi</strong>.
                </p>
                <p className="text-zinc-600">
                  Agradecemos gestionar tu transferencia antes del día 05 del mes para mantener tu cuenta al día.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: MARCHA BLANCA & CONFIGURACIÓN */}
      {activeTab === 'configuracion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta de Prueba de Envío */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Send className="w-4 h-4 text-primary" />
              <span>Disparar Correo de Prueba Interno</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingresa la casilla de correo interna donde deseas recibir los comprobantes y alertas durante este periodo de marcha blanca antes de habilitar el envío real a clientes.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Casilla de Destino de Pruebas:
              </label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="administracion@sunrisechile.cl"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando Mensaje de Prueba...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Correo de Prueba Ahora</span>
                </>
              )}
            </button>
          </div>

          {/* Tarjeta Informativa: Requisitos para Entrega Real */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span>¿Qué falta para enviar correos reales a los arrendatarios?</span>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
                <span className="font-bold text-foreground block">1. Datos del Servidor de Correo (SMTP o Resend)</span>
                <p>
                  Para que los correos salgan desde la casilla corporativa (ej: <span className="font-mono text-foreground font-semibold">administracion@sunrisechile.cl</span>), se deben configurar en el archivo <span className="font-mono text-foreground">.env</span>:
                </p>
                <div className="bg-background p-2 rounded font-mono text-[11px] text-foreground mt-1 space-y-0.5">
                  <div>SMTP_HOST="mail.sunrisechile.cl"</div>
                  <div>SMTP_PORT=465</div>
                  <div>SMTP_USER="administracion@sunrisechile.cl"</div>
                  <div>SMTP_PASS="tu_contraseña_aqui"</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
                <span className="font-bold text-foreground block">2. Completar los correos de los arrendatarios</span>
                <p>
                  En la pestaña <strong>Directorio</strong> podrás ir agregando los correos que faltan (actualmente hay <strong className="text-amber-600 dark:text-amber-400">{stats.withoutEmail} arrendatarios sin correo</strong>).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-1">
                <span className="font-bold text-foreground block">3. Cambio a Producción</span>
                <p>
                  Cuando des la señal de que las pruebas en marcha blanca están conformes, cambiamos la variable <span className="font-mono text-foreground">EMAIL_ENV="production"</span> para que los comprobantes salgan directamente a la casilla de cada arrendatario.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
