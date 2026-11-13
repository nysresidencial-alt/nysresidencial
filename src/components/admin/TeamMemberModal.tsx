'use client'

import React, { useState, useRef } from 'react'
import {
  X,
  Save,
  User,
  Upload,
  Link as LinkIcon,
  Check,
  Plus,
  Briefcase,
  AlertCircle,
  Loader2,
  Crop,
  Sparkles,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/icons/LinkedinIcon'
import Image from 'next/image'
import { TeamMember, TeamCompany, TEAM_LEVELS } from '@/lib/team-types'
import { saveTeamMember, addTeamCompany } from '@/app/admin/contenido/equipo-actions'
import { ImageCropperModal } from './ImageCropperModal'

interface TeamMemberModalProps {
  member: TeamMember | null // null para crear nuevo
  companies: TeamCompany[]
  onClose: () => void
  onSaved: (member: TeamMember) => void
  onCompanyAdded: (newCompanies: TeamCompany[]) => void
}

export function TeamMemberModal({
  member,
  companies,
  onClose,
  onSaved,
  onCompanyAdded,
}: TeamMemberModalProps) {
  const [formData, setFormData] = useState<TeamMember>({
    id: member?.id || `member_${Date.now()}`,
    name: member?.name || '',
    role: member?.role || '',
    photoUrl:
      member?.photoUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    companies: member?.companies || [],
    linkedinUrl: member?.linkedinUrl || '',
    bio: member?.bio || '',
    order: member?.order || 1,
    level: member?.level || 3,
    isActive: member?.isActive !== undefined ? member.isActive : true,
  })

  const [newCompanyInput, setNewCompanyInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estado para el modal de recorte/ajuste de foto
  const [cropperSrc, setCropperSrc] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Manejo de tags de empresas
  function toggleCompanyTag(companyName: string) {
    setFormData((prev) => {
      const exists = prev.companies.includes(companyName)
      if (exists) {
        return {
          ...prev,
          companies: prev.companies.filter((c) => c !== companyName),
        }
      } else {
        return {
          ...prev,
          companies: [...prev.companies, companyName],
        }
      }
    })
  }

  // Agregar nueva empresa a la lista desde el modal
  async function handleQuickAddCompany() {
    const clean = newCompanyInput.trim()
    if (!clean) return

    const res = await addTeamCompany(clean)
    if (res.companies) {
      onCompanyAdded(res.companies)
      // Auto-seleccionar la empresa recién agregada
      if (!formData.companies.includes(clean)) {
        setFormData((prev) => ({
          ...prev,
          companies: [...prev.companies, clean],
        }))
      }
      setNewCompanyInput('')
    }
  }

  // Selección de archivo local -> abre el cropper para recortar y acomodar
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropperSrc(reader.result)
        setShowCropper(true)
      }
    }
    reader.onerror = () => {
      setError('Error al leer el archivo seleccionado.')
    }
    reader.readAsDataURL(file)

    // Reset input para permitir volver a elegir el mismo archivo si se desea
    e.target.value = ''
  }

  // Abrir cropper con la imagen actual si ya tiene una
  function handleOpenCropperCurrent() {
    if (formData.photoUrl) {
      setCropperSrc(formData.photoUrl)
      setShowCropper(true)
    }
  }

  // Al completar el recorte, se guarda la imagen base64 comprimida directamente en el estado
  function handleCropComplete(base64Image: string) {
    setFormData((prev) => ({ ...prev, photoUrl: base64Image }))
    setShowCropper(false)
    setCropperSrc(null)
    setError(null)
  }

  // Guardar integrante en la base de datos
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('El nombre de la persona es obligatorio.')
      return
    }
    if (!formData.role.trim()) {
      setError('El cargo o función es obligatorio.')
      return
    }

    setIsSaving(true)
    setError(null)

    const res = await saveTeamMember(formData)
    if (res.error) {
      setError(res.error)
      setIsSaving(false)
    } else if (res.member) {
      onSaved(res.member)
      onClose()
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {member ? 'Editar Integrante del Equipo' : 'Agregar Nuevo Integrante'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Configura la fotografía circular, cargo, empresas y enlace de LinkedIn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* FOTO CON BORDE CIRCULAR ELEGANTE + AJUSTE Y RECORTE */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-muted/20 border border-border">
              {/* Foto circular con preview */}
              <div className="relative group shrink-0 flex flex-col items-center">
                <div className="w-28 h-28 rounded-full ring-4 ring-primary/20 p-1 bg-background shadow-md overflow-hidden relative">
                  {formData.photoUrl ? (
                    <Image
                      src={formData.photoUrl}
                      alt={formData.name || 'Foto'}
                      fill
                      unoptimized
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>

                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={handleOpenCropperCurrent}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    <Crop className="w-3 h-3" />
                    <span>Acomodar foto</span>
                  </button>
                )}
              </div>

              {/* Opciones de carga */}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground">
                      Fotografía de Perfil
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Guardada directo en la BD</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir y recortar foto</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelected}
                      className="hidden"
                    />

                    <span className="text-[11px] text-muted-foreground">o ingresa URL:</span>
                  </div>
                </div>

                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <p className="text-[10px] text-muted-foreground">
                  Al subir tu foto podrás recortarla con zoom y rotación para centrar el rostro. La imagen se comprime y se almacena en la base de datos de forma permanente.
                </p>
              </div>
            </div>

            {/* DATOS PERSONALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Patricia Retamal Bustos"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Cargo o Función *
                </label>
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ej. Directora Comercial & Gestión Inmobiliaria"
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* EMPRESAS ASOCIADAS (TAGS) */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-muted/20 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  <span>Empresas del Grupo a las que pertenece (Tags)</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {formData.companies.length} seleccionada(s)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Haz clic en una empresa para asignarla o quitarla como etiqueta debajo de esta persona:
              </p>

              {/* Chips de selección */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {companies.map((comp) => {
                  const isSelected = formData.companies.includes(comp.name)
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => toggleCompanyTag(comp.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30'
                          : 'bg-background text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-60" />}
                      <span>{comp.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Agregar empresa rápida */}
              <div className="flex items-center gap-2 pt-2 border-t border-border mt-3">
                <input
                  type="text"
                  value={newCompanyInput}
                  onChange={(e) => setNewCompanyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleQuickAddCompany()
                    }
                  }}
                  placeholder="¿Falta una empresa? Escribe el nombre aquí..."
                  className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={handleQuickAddCompany}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-lg border border-border transition-colors cursor-pointer"
                >
                  + Añadir
                </button>
              </div>
            </div>

            {/* LINKEDIN Y CONTACTO */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1">
                  <LinkedinIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>Perfil de LinkedIn (Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://www.linkedin.com/in/usuario"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <LinkedinIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Nivel Jerárquico en la Pirámide */}
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Nivel Jerárquico en la Pirámide / Organigrama
                </label>
                <select
                  value={formData.level || 3}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TEAM_LEVELS.map((lvl) => (
                    <option key={lvl.level} value={lvl.level}>
                      {lvl.badge} — {lvl.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Define en qué piso de la pirámide se mostrará (también puedes arrastrarlo libremente en el panel).
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Breve Reseña Profesional / Bio (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Breve trayectoria, experiencia o especialidad en el sector..."
                  className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Mostrar visible en la página pública
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Orden:</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-16 px-2 py-1 text-xs bg-background border border-border rounded-lg text-foreground text-center"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-border flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md cursor-pointer transition-all"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Guardando en BD...' : 'Guardar Integrante'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Cropper Interactivo */}
      {showCropper && cropperSrc && (
        <ImageCropperModal
          imageSrc={cropperSrc}
          onClose={() => {
            setShowCropper(false)
            setCropperSrc(null)
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  )
}
