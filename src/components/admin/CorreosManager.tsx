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
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Save,
  AtSign,
  Copy,
} from 'lucide-react'
import {
  updateTenantContact,
  sendTestEmailAction,
  saveEmailConfig,
} from '@/app/admin/correos/actions'
import {
  EmailConfigData,
  DEFAULT_EMAIL_CONFIG,
} from '@/lib/email-config-types'

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
  initialConfig?: EmailConfigData
}

export function CorreosManager({ initialContracts, initialConfig }: CorreosManagerProps) {
  const [contracts, setContracts] = useState<TenantContractItem[]>(initialContracts)
  const [config, setConfig] = useState<EmailConfigData>(initialConfig || DEFAULT_EMAIL_CONFIG)
  const [activeTab, setActiveTab] = useState<'directorio' | 'plantillas' | 'configuracion'>('directorio')

  // Filtros de directorio
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'sin_correo' | 'con_correo'>('todos')

  // Edición inline de correo en el directorio
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)

  // Guardado de configuración
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isSavingTestEmail, setIsSavingTestEmail] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = contracts.length
    const withEmail = contracts.filter((c) => Boolean(c.tenantEmail && c.tenantEmail.trim() !== '')).length
    const withoutEmail = total - withEmail
    const percentage = total > 0 ? Math.round((withEmail / total) * 100) : 0
    return { total, withEmail, withoutEmail, percentage }
  }, [contracts])

  // Filtrado de contratos en la tabla
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

  // Datos simulados para la vista previa en vivo
  const samplePreview = useMemo(() => {
    const replaceSample = (str: string) => {
      return (str || '')
        .replace(/{RECIBO}/g, '540')
        .replace(/{EDIFICIO}/g, 'LIBERTADOR')
        .replace(/{UNIDAD}/g, 'D-201')
        .replace(/{MES}/g, 'Noviembre')
        .replace(/{ANO}/g, '2026')
        .replace(/{ARRENDATARIO}/g, 'Inés Urrutia Pinto')
        .replace(/{MONTO}/g, '303.773')
        .replace(/{FECHA}/g, new Date().toLocaleDateString('es-CL'))
    }

    return {
      subject: replaceSample(config.subject),
      intro: replaceSample(config.introMessage),
      footerNote: replaceSample(config.footerNote),
    }
  }, [config])

  const availableVariables = [
    { tag: '{ARRENDATARIO}', label: 'Nombre' },
    { tag: '{EDIFICIO}', label: 'Edificio' },
    { tag: '{UNIDAD}', label: 'Unidad' },
    { tag: '{MES}', label: 'Mes' },
    { tag: '{ANO}', label: 'Año' },
    { tag: '{MONTO}', label: 'Monto' },
    { tag: '{RECIBO}', label: 'N° Recibo' },
    { tag: '{FECHA}', label: 'Fecha Pago' },
  ]

  function copyVariableToClipboard(tag: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(tag)
      setCopiedVar(tag)
      setTimeout(() => setCopiedVar(null), 2000)
    }
  }

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
    setIsSavingContact(true)
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
    setIsSavingContact(false)
  }

  // Guardar plantilla de correo
  async function handleSaveTemplate() {
    setIsSavingConfig(true)
    setFeedbackMessage(null)
    const res = await saveEmailConfig({
      subject: config.subject,
      companyHeader: config.companyHeader,
      companySubtitle: config.companySubtitle,
      introMessage: config.introMessage,
      footerNote: config.footerNote,
      companyFooter: config.companyFooter,
    })

    if (res.success && res.config) {
      setConfig(res.config)
      setFeedbackMessage({
        text: 'Plantilla de correo guardada y actualizada exitosamente',
        type: 'success',
      })
    } else {
      setFeedbackMessage({
        text: res.error || 'Error al guardar la plantilla',
        type: 'error',
      })
    }
    setIsSavingConfig(false)
  }

  // Restablecer valores de plantilla por defecto
  function handleResetTemplate() {
    setConfig((prev) => ({
      ...prev,
      subject: DEFAULT_EMAIL_CONFIG.subject,
      companyHeader: DEFAULT_EMAIL_CONFIG.companyHeader,
      companySubtitle: DEFAULT_EMAIL_CONFIG.companySubtitle,
      introMessage: DEFAULT_EMAIL_CONFIG.introMessage,
      footerNote: DEFAULT_EMAIL_CONFIG.footerNote,
      companyFooter: DEFAULT_EMAIL_CONFIG.companyFooter,
    }))
    setFeedbackMessage({
      text: 'Se han cargado los textos por defecto. Presiona "Guardar Plantilla" para confirmar los cambios.',
      type: 'success',
    })
  }

  // Alternar interruptor de modo test
  async function handleToggleTestMode() {
    const nextVal = !config.isTestMode
    setConfig((prev) => ({ ...prev, isTestMode: nextVal }))
    const res = await saveEmailConfig({ isTestMode: nextVal })

    if (res.success && res.config) {
      setConfig(res.config)
      setFeedbackMessage({
        text: nextVal
          ? 'Modo de Prueba activado: todos los correos se enviarán a la casilla de pruebas interna.'
          : 'Modo Clientes Reales activado: los correos se enviarán directamente a la dirección de cada arrendatario.',
        type: 'success',
      })
    } else {
      setConfig((prev) => ({ ...prev, isTestMode: !nextVal }))
      setFeedbackMessage({ text: res.error || 'Error al cambiar modo', type: 'error' })
    }
  }

  // Guardar casilla de prueba
  async function handleSaveTestEmail() {
    setIsSavingTestEmail(true)
    setFeedbackMessage(null)
    const res = await saveEmailConfig({ testEmail: config.testEmail })
    if (res.success && res.config) {
      setConfig(res.config)
      setFeedbackMessage({
        text: `Casilla de pruebas actualizada a: ${config.testEmail}`,
        type: 'success',
      })
    } else {
      setFeedbackMessage({ text: res.error || 'Error al guardar casilla de prueba', type: 'error' })
    }
    setIsSavingTestEmail(false)
  }

  // Enviar correo de prueba
  async function handleSendTestEmail() {
    setIsSendingTest(true)
    setFeedbackMessage(null)
    const res = await sendTestEmailAction(config.testEmail)
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
                Configuración dinámica de plantillas, directorio de arrendatarios y control de envíos
              </p>
            </div>
          </div>
        </div>

        {/* SWITCH Y BADGE DE MODO DE ENVÍO */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleTestMode}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all cursor-pointer ${
              config.isTestMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title="Haga clic para alternar entre Modo de Prueba y Modo Clientes Reales"
          >
            {config.isTestMode ? (
              <>
                <ToggleLeft className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-left text-xs font-bold leading-tight">
                  <div className="flex items-center gap-1">
                    <span>Modo de Prueba (Test)</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <span className="block text-[10px] text-amber-700/80 dark:text-amber-400/80 font-normal">
                    Destino: {config.testEmail}
                  </span>
                </div>
              </>
            ) : (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-left text-xs font-bold leading-tight">
                  <div className="flex items-center gap-1">
                    <span>Modo Clientes Reales</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="block text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">
                    Envíos directos a arrendatarios
                  </span>
                </div>
              </>
            )}
          </button>
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

        <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">Modo de Envío</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-lg inline-block ${
                config.isTestMode
                  ? 'text-amber-700 bg-amber-500/10 dark:text-amber-400'
                  : 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              {config.isTestMode ? '🧪 Modo Test' : '🚀 Clientes Reales'}
            </span>
            <button
              type="button"
              onClick={handleToggleTestMode}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('directorio')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
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
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'plantillas'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Plantillas de Correo (Edición Dinámica)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('configuracion')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'configuracion'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Configuración & Modo de Envío</span>
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
                                  disabled={isSavingContact}
                                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  {isSavingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={isSavingContact}
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

      {/* CONTENIDO TAB 2: PLANTILLAS DE CORREO (EDITOR DINÁMICO + VISTA PREVIA) */}
      {activeTab === 'plantillas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: FORMULARIO DE EDICIÓN DINÁMICA */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Editor de Plantilla Oficial</h3>
                    <p className="text-[11px] text-muted-foreground">Personaliza los textos que reciben los arrendatarios</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                  title="Restablecer textos por defecto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              </div>

              {/* Variables dinámicas para copiar o insertar */}
              <div className="space-y-1.5 bg-muted/40 p-3 rounded-2xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Variables Dinámicas Disponibles (haz clic para copiar):</span>
                  </span>
                  {copiedVar && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ¡{copiedVar} copiado!
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableVariables.map((v) => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => copyVariableToClipboard(v.tag)}
                      className="px-2 py-1 rounded-lg bg-background border border-border hover:border-primary text-foreground font-mono text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 group"
                      title={`Copiar variable: ${v.label}`}
                    >
                      <span>{v.tag}</span>
                      <Copy className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-primary" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Asunto del Correo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Asunto del Correo:</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Soporta variables</span>
                </label>
                <input
                  type="text"
                  value={config.subject}
                  onChange={(e) => setConfig((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Comprobante de Pago Arriendo Nº {RECIBO} - {EDIFICIO} {UNIDAD}"
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Encabezado y Subtítulo de la Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Nombre Empresa (Cabecera):
                  </label>
                  <input
                    type="text"
                    value={config.companyHeader}
                    onChange={(e) => setConfig((prev) => ({ ...prev, companyHeader: e.target.value }))}
                    placeholder="NyS Negocios y Soluciones Inmobiliarias"
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Subtítulo / Bajada:
                  </label>
                  <input
                    type="text"
                    value={config.companySubtitle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, companySubtitle: e.target.value }))}
                    placeholder="Comprobante Oficial de Pago de Arriendo"
                    className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Mensaje Introductorio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Mensaje Introductorio / Saludo:</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Soporta saltos de línea</span>
                </label>
                <textarea
                  rows={4}
                  value={config.introMessage}
                  onChange={(e) => setConfig((prev) => ({ ...prev, introMessage: e.target.value }))}
                  placeholder="Estimado(a) {ARRENDATARIO},\n\nConfirmamos la recepción de tu pago..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-foreground leading-relaxed focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Nota al pie del recibo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Nota al Pie del Recibo (Aclaración de adjunto):
                </label>
                <input
                  type="text"
                  value={config.footerNote}
                  onChange={(e) => setConfig((prev) => ({ ...prev, footerNote: e.target.value }))}
                  placeholder="Se adjunta a este correo el Recibo Oficial de Arriendo timbrado con PAGADO..."
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Firma Corporativa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Firma y Contacto Corporativo (Pie de página):
                </label>
                <textarea
                  rows={2}
                  value={config.companyFooter}
                  onChange={(e) => setConfig((prev) => ({ ...prev, companyFooter: e.target.value }))}
                  placeholder="NyS Negocios y Soluciones Inmobiliarias / Administración Sunrise..."
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Botón Guardar */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={isSavingConfig}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Plantilla Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA EN VIVO */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Vista Previa en Tiempo Real</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                  Se actualiza al escribir
                </span>
              </div>

              {/* Tarjeta simulada de correo recibido */}
              <div className="border border-border rounded-2xl overflow-hidden bg-white text-zinc-950 font-sans shadow-md">
                {/* Cabecera del Cliente de Correo */}
                <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-600 space-y-1">
                  <div>
                    <strong className="text-zinc-800">De:</strong> NyS Notificaciones &lt;administracion@sunrisechile.cl&gt;
                  </div>
                  <div>
                    <strong className="text-zinc-800">Para:</strong> Inés Urrutia Pinto &lt;ines.urrutia@ejemplo.cl&gt;
                  </div>
                  <div>
                    <strong className="text-zinc-800">Asunto:</strong>{' '}
                    <span className="text-zinc-900 font-bold">{samplePreview.subject}</span>
                  </div>
                </div>

                {/* Encabezado Corporativo */}
                <div className="bg-zinc-950 text-white p-6">
                  <h4 className="text-base font-black tracking-tight m-0 text-white">
                    {config.companyHeader || 'NyS Negocios y Soluciones Inmobiliarias'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 m-0">
                    {config.companySubtitle || 'Comprobante Oficial de Pago de Arriendo'}
                  </p>
                </div>

                {/* Cuerpo del Mensaje */}
                <div className="p-6 space-y-4 text-xs">
                  <p className="text-zinc-800 leading-relaxed whitespace-pre-line m-0">
                    {samplePreview.intro}
                  </p>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">N° de Recibo:</span>
                      <span className="font-bold text-zinc-900">#540</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">Propiedad:</span>
                      <span className="font-bold text-zinc-900">LIBERTADOR - D-201</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">Periodo:</span>
                      <span className="font-bold text-zinc-900">Noviembre 2026</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-200 pb-1.5">
                      <span className="text-zinc-500 font-semibold">Fecha de Pago:</span>
                      <span className="font-bold text-zinc-900">{new Date().toLocaleDateString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-semibold">Monto Recaudado:</span>
                      <span className="font-bold text-emerald-600 text-sm">$303.773 CLP</span>
                    </div>
                  </div>

                  <div className="text-center my-3">
                    <span className="inline-block bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black text-xs px-4 py-1.5 rounded-lg tracking-wide">
                      ✓ PAGO REGISTRADO Y ACREDITADO
                    </span>
                  </div>

                  <p className="text-zinc-500 text-[11px] text-center leading-relaxed m-0 pt-2 border-t border-zinc-100">
                    {samplePreview.footerNote}
                  </p>
                </div>

                {/* Pie Corporativo */}
                <div className="bg-zinc-50 border-t border-zinc-200 p-4 text-center text-[11px] text-zinc-500 whitespace-pre-line">
                  {config.companyFooter}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: CONFIGURACIÓN & MODO DE ENVÍO */}
      {activeTab === 'configuracion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta de Control Maestro: Switch Modo Test vs Producción */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Modo de Envío de Notificaciones</span>
            </div>

            {/* Gran Switch Visual */}
            <div
              onClick={handleToggleTestMode}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                config.isTestMode
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
              }`}
            >
              <div className="space-y-1">
                <div className="font-black text-sm flex items-center gap-2">
                  <span>{config.isTestMode ? '🧪 Modo de Prueba Activo (Test)' : '🚀 Modo Clientes Reales Activo (Producción)'}</span>
                </div>
                <p className="text-xs opacity-90 max-w-sm">
                  {config.isTestMode
                    ? 'Todos los correos de comprobantes se desvían a la casilla de pruebas asignada abajo, protegiendo a los arrendatarios reales.'
                    : 'Los comprobantes se enviarán directamente al correo del arrendatario registrado. Si no tiene correo, simplemente no se envía.'}
                </p>
              </div>

              <div>
                {config.isTestMode ? (
                  <ToggleLeft className="w-10 h-10 text-amber-600 shrink-0" />
                ) : (
                  <ToggleRight className="w-10 h-10 text-emerald-600 shrink-0" />
                )}
              </div>
            </div>

            {/* Casilla de Destino de Pruebas */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-bold text-foreground block">
                Casilla Designada para Recepción de Pruebas:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={config.testEmail}
                  onChange={(e) => setConfig((prev) => ({ ...prev, testEmail: e.target.value }))}
                  placeholder="administracion@sunrisechile.cl"
                  className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleSaveTestEmail}
                  disabled={isSavingTestEmail}
                  className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border cursor-pointer transition-colors"
                >
                  {isSavingTestEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Guardar'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cuando el modo de prueba esté encendido, todas las emisiones y comprobantes llegarán a esta dirección.
              </p>
            </div>

            {/* Botón de Envío Inmediato de Prueba */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Disparando Correo de Prueba...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Correo de Prueba a {config.testEmail}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tarjeta Informativa: Reglas de Entrega */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span>Reglas de Entrega y Parámetros SMTP</span>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-1.5">
                <span className="font-bold text-foreground block">
                  1. Regla de Arrendatarios sin Correo (Modo Producción)
                </span>
                <p>
                  Tal como solicitaste, cuando el switch de test está <strong>APAGADO</strong> (Modo Clientes Reales) y un arrendatario <strong>no tiene dirección de correo registrada</strong>, el sistema simplemente <strong>omite el envío sin generar ningún error ni interrumpir el registro del pago</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-1.5">
                <span className="font-bold text-foreground block">
                  2. Parámetros del Servidor de Correo (SMTP Corporativo)
                </span>
                <p>
                  Para despacho real a los buzones de entrada, los correos se envían usando las credenciales SMTP configuradas en el entorno:
                </p>
                <div className="bg-background p-2.5 rounded-xl border border-border font-mono text-[11px] text-foreground space-y-0.5">
                  <div>SMTP_HOST="mail.sunrisechile.cl"</div>
                  <div>SMTP_PORT=465</div>
                  <div>SMTP_USER="administracion@sunrisechile.cl"</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-1.5">
                <span className="font-bold text-foreground block">
                  3. Directorio de Contactos
                </span>
                <p>
                  Actualmente tienes <strong>{stats.withEmail} de {stats.total}</strong> arrendatarios con correo registrado ({stats.percentage}% de cobertura). Puedes agregar los correos faltantes directamente en la pestaña <strong>Directorio</strong> haciendo clic sobre la fila.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
