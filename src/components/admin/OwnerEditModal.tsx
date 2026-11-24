'use client'

import React, { useState } from 'react'
import { X, ShieldCheck, User, Building, Phone, Mail, MapPin, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { PropietarioDetail, updatePropietario } from '@/app/admin/propietarios/actions'

interface OwnerEditModalProps {
  owner: PropietarioDetail
  onClose: () => void
  onSaved: (updated: any) => void
}

/**
 * Formatea automáticamente una cadena a formato RUT chileno: 12.345.678-K
 */
export function formatChileanRut(value: string): string {
  // Limpiar caracteres extraños
  const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (!cleaned) return ''
  if (cleaned.length === 1) return cleaned

  const dv = cleaned.slice(-1)
  const numbers = cleaned.slice(0, -1)

  // Separar en miles
  let formattedNumbers = ''
  for (let i = numbers.length - 1, j = 1; i >= 0; i--, j++) {
    formattedNumbers = numbers[i] + formattedNumbers
    if (j % 3 === 0 && i !== 0) {
      formattedNumbers = '.' + formattedNumbers
    }
  }

  return `${formattedNumbers}-${dv}`
}

export function OwnerEditModal({ owner, onClose, onSaved }: OwnerEditModalProps) {
  const [rut, setRut] = useState(owner.rut || '')
  const [phone, setPhone] = useState(owner.phone || '')
  const [email, setEmail] = useState(owner.email || '')
  const [address, setAddress] = useState(owner.address || '')
  const [notes, setNotes] = useState(owner.notes || '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatChileanRut(e.target.value)
    setRut(formatted)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await updatePropietario(owner.id, {
        rut: rut.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      })

      if (res.error) {
        setError(res.error)
        setIsSubmitting(false)
        return
      }

      if (res.owner) {
        onSaved({
          ...owner,
          rut: res.owner.rut,
          phone: res.owner.phone,
          email: res.owner.email,
          address: res.owner.address,
          notes: res.owner.notes,
        })
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al guardar')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base leading-tight">
                Editar Datos de Propietario
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {owner.name} • {owner.propertiesCount} {owner.propertiesCount === 1 ? 'inmueble' : 'inmuebles'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nombre y Tipo (Solo lectura) */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Propietario / Asignatario
                </span>
                <span className="text-sm font-black text-foreground">{owner.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                owner.isCompany ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {owner.isCompany ? 'Empresa' : 'Nuevo Asignatario'}
              </span>
            </div>
            {owner.companyName && (
              <p className="text-xs text-muted-foreground mt-1">
                Empresa asociada en planilla: <strong className="text-foreground">{owner.companyName}</strong> {owner.companyCode && `(${owner.companyCode})`}
              </p>
            )}
          </div>

          {/* RUT OFICIAL (Campo principal) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              RUT Oficial del Propietario *
            </label>
            <div className="relative">
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                placeholder="Ej: 12.345.678-9"
                className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs font-semibold"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Este RUT se imprimirá automáticamente en el encabezado oficial de todos los recibos y vouchers de este propietario.
            </p>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Teléfono de Contacto</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +56 9 1234 5678"
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej: propietario@sunrisechile.cl"
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Dirección</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: 1 Sur Nº 885, Talca"
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Observaciones / Notas Internas</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas contables, apoderado, etc."
              className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs resize-none"
            />
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-[11px] text-muted-foreground leading-relaxed">
            💡 <strong>Sincronización en tiempo real:</strong> Al guardar este RUT, el cambio se refleja inmediatamente en el full de datos de la base de datos (tabla maestra de contratos) y en las exportaciones oficiales.
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guardar RUT y Datos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
