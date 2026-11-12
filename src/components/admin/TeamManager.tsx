'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Briefcase,
  BookOpen,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Building,
  Save,
  Loader2,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/icons/LinkedinIcon'
import { TeamMember, TeamCompany } from '@/lib/team-types'
import { TeamMemberModal } from './TeamMemberModal'
import {
  saveTeamMember,
  deleteTeamMember,
  addTeamCompany,
  deleteTeamCompany,
  saveCorporateText,
} from '@/app/admin/contenido/equipo-actions'

interface TeamManagerProps {
  initialMembers: TeamMember[]
  initialCompanies: TeamCompany[]
  initialCorporateText: string
}

export function TeamManager({
  initialMembers,
  initialCompanies,
  initialCorporateText,
}: TeamManagerProps) {
  const [activeTab, setActiveTab] = useState<'team' | 'text'>('team')

  // Datos
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [companies, setCompanies] = useState<TeamCompany[]>(initialCompanies)
  const [corporateText, setCorporateText] = useState<string>(initialCorporateText)

  // Estado UI
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [isAddingCompany, setIsAddingCompany] = useState(false)
  const [isSavingText, setIsSavingText] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showFeedback(text: string, type: 'success' | 'error') {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Handlers Integrantes
  function handleMemberSaved(savedMember: TeamMember) {
    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === savedMember.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = savedMember
        return copy
      } else {
        return [...prev, savedMember]
      }
    })
    showFeedback('Integrante guardado exitosamente', 'success')
  }

  async function handleDeleteMember(member: TeamMember) {
    if (!confirm(`¿Estás seguro de eliminar a ${member.name} del equipo?`)) return

    const res = await deleteTeamMember(member.id)
    if (res.error) {
      showFeedback(res.error, 'error')
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== member.id))
      showFeedback('Integrante eliminado del equipo', 'success')
    }
  }

  async function handleMoveOrder(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= members.length) return

    const copy = [...members]
    const temp = copy[idx]
    copy[idx] = copy[targetIdx]
    copy[targetIdx] = temp

    // Actualizar orden numérico
    copy.forEach((m, i) => (m.order = i + 1))
    setMembers(copy)

    // Guardar en backend
    await Promise.all([
      saveTeamMember(copy[idx]),
      saveTeamMember(copy[targetIdx]),
    ])
  }

  // Handlers Empresas
  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault()
    const clean = newCompanyName.trim()
    if (!clean) return

    setIsAddingCompany(true)
    const res = await addTeamCompany(clean)
    if (res.error) {
      showFeedback(res.error, 'error')
    } else if (res.companies) {
      setCompanies(res.companies)
      setNewCompanyName('')
      showFeedback(`Empresa "${clean}" agregada a la lista de tags`, 'success')
    }
    setIsAddingCompany(false)
  }

  async function handleDeleteCompany(comp: TeamCompany) {
    if (
      !confirm(
        `¿Eliminar "${comp.name}" de la lista de empresas? También se removerá como tag de los integrantes que la tengan.`
      )
    )
      return

    const res = await deleteTeamCompany(comp.id)
    if (res.error) {
      showFeedback(res.error, 'error')
    } else if (res.companies) {
      setCompanies(res.companies)
      // Remover tag de estado local de miembros
      setMembers((prev) =>
        prev.map((m) => ({
          ...m,
          companies: m.companies.filter((c) => c !== comp.name),
        }))
      )
      showFeedback(`Empresa "${comp.name}" eliminada`, 'success')
    }
  }

  // Handler Texto Corporativo
  async function handleSaveCorporateText() {
    setIsSavingText(true)
    const res = await saveCorporateText(corporateText)
    if (res.error) {
      showFeedback(res.error, 'error')
    } else {
      showFeedback('Texto corporativo de "Quiénes Somos" actualizado', 'success')
    }
    setIsSavingText(false)
  }

  return (
    <div className="space-y-6">
      {/* Alerta Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            <span>Quiénes Somos y Nuestro Equipo</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra a las personas con fotos circulares elegantes, cargos, enlaces de LinkedIn y las empresas del grupo como tags.
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex items-center p-1 bg-muted rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Equipo ({members.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Texto Quiénes Somos</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: EQUIPO HUMANO & EMPRESAS */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* SECCIÓN 1: LISTA MAESTRA DE EMPRESAS (TAGS) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">
                  Empresas del Grupo (Lista de Tags)
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({companies.length} registradas)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Estas empresas aparecen como etiquetas disponibles al crear o editar a cada persona.
              </p>
            </div>

            {/* Tags actuales con botón para eliminar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {companies.map((comp) => (
                <span
                  key={comp.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-2xs group"
                >
                  <span>{comp.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCompany(comp)}
                    title={`Eliminar ${comp.name} de las empresas`}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-primary/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Input para agregar nueva empresa */}
            <form onSubmit={handleAddCompany} className="flex items-center gap-2 pt-3 border-t border-border max-w-md">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Nombre de nueva empresa o marca..."
                className="flex-1 px-3 py-2 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={isAddingCompany || !newCompanyName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-40 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Empresa</span>
              </button>
            </form>
          </div>

          {/* SECCIÓN 2: INTEGRANTES DEL EQUIPO */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Integrantes del Equipo</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {members.length} personas
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Se exhiben en las secciones públicas de <Link href="/nosotros" target="_blank" className="text-primary underline">/nosotros</Link> y <Link href="/equipo" target="_blank" className="text-primary underline">/equipo</Link>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingMember(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Persona al Equipo</span>
              </button>
            </div>

            {/* Grid de Personas con Fotografía Circular Elegante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-card border border-border rounded-2xl p-6">
                  <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Aún no hay integrantes registrados en el equipo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingMember(true)}
                    className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold"
                  >
                    + Agregar el primer integrante
                  </button>
                </div>
              ) : (
                members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center relative group"
                  >
                    {/* Botones de orden y visibilidad */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                        title="Mover antes"
                        className="p-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === members.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                        title="Mover después"
                        className="p-1 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* FOTO CIRCULAR ELEGANTE */}
                    <div className="relative mt-2 mb-4">
                      <div className="w-28 h-28 rounded-full ring-4 ring-primary/20 p-1 bg-background shadow-md overflow-hidden relative group-hover:ring-primary/40 transition-all duration-300">
                        {member.photoUrl ? (
                          <Image
                            src={member.photoUrl}
                            alt={member.name}
                            fill
                            unoptimized
                            className="rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <Users className="w-10 h-10" />
                          </div>
                        )}
                      </div>
                      {!member.isActive && (
                        <span className="absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-muted text-muted-foreground border border-border">
                          Oculto
                        </span>
                      )}
                    </div>

                    {/* NOMBRE Y CARGO */}
                    <h3 className="text-base font-extrabold text-foreground tracking-tight leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-1 line-clamp-2">
                      {member.role}
                    </p>

                    {/* BIO SI TIENE */}
                    {member.bio && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic">
                        "{member.bio}"
                      </p>
                    )}

                    {/* EMPRESAS ASOCIADAS (TAGS) */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 w-full">
                      {member.companies && member.companies.length > 0 ? (
                        member.companies.map((compName) => (
                          <span
                            key={compName}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border"
                          >
                            {compName}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground/60 italic">
                          Sin empresas asignadas
                        </span>
                      )}
                    </div>

                    {/* LINKEDIN */}
                    {member.linkedinUrl && (
                      <div className="mt-3">
                        <a
                          href={member.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors"
                        >
                          <LinkedinIcon className="w-3.5 h-3.5" />
                          <span>LinkedIn</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </div>
                    )}

                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border w-full">
                      <button
                        type="button"
                        onClick={() => setEditingMember(member)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Eliminar del equipo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TEXTO CORPORATIVO QUIÉNES SOMOS */}
      {activeTab === 'text' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">
                Texto Corporativo "Quiénes Somos"
              </h2>
              <p className="text-xs text-muted-foreground">
                Historia, valores y misión institucional que encabeza la página /nosotros.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Contenido (admite texto plano o formato HTML)
            </label>
            <textarea
              rows={10}
              value={corporateText}
              onChange={(e) => setCorporateText(e.target.value)}
              placeholder="Escribe la historia y propuesta de valor de la empresa..."
              className="w-full p-4 text-xs font-mono bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
            />
          </div>

          {/* Vista previa rápida */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Vista Previa en Vivo:
            </span>
            <div
              className="prose prose-zinc dark:prose-invert max-w-none text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: corporateText || '<em>(Sin texto)</em>' }}
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={isSavingText}
              onClick={handleSaveCorporateText}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              {isSavingText ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingText ? 'Guardando...' : 'Guardar Texto Corporativo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para Crear o Editar Integrante */}
      {(editingMember || isCreatingMember) && (
        <TeamMemberModal
          member={editingMember}
          companies={companies}
          onClose={() => {
            setEditingMember(null)
            setIsCreatingMember(false)
          }}
          onSaved={handleMemberSaved}
          onCompanyAdded={(newComps) => setCompanies(newComps)}
        />
      )}
    </div>
  )
}
