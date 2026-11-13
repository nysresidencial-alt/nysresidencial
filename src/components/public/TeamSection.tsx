'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import {
  Users,
  ExternalLink,
  Briefcase,
  X,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/icons/LinkedinIcon'
import { TeamMember, TeamCompany } from '@/lib/team-types'

interface TeamSectionProps {
  members: TeamMember[]
  companies?: TeamCompany[]
  showCompanyFilter?: boolean
  title?: string
  subtitle?: string
}

export function TeamSection({
  members,
  companies = [],
  showCompanyFilter = false,
  title = 'Nuestro Equipo',
  subtitle = 'Profesionales comprometidos con brindarte la mejor asesoría, transparencia y respaldo en cada operación inmobiliaria.',
}: TeamSectionProps) {
  const [selectedCompany, setSelectedCompany] = useState<string>('TODAS')
  const [selectedMemberModal, setSelectedMemberModal] = useState<TeamMember | null>(null)

  // Cerrar modal con tecla Escape y bloquear scroll del body
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedMemberModal(null)
      }
    }

    if (selectedMemberModal) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedMemberModal])

  // Filtrar solo miembros activos
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.isActive)
  }, [members])

  // Filtrado reactivo por empresa
  const filteredMembers = useMemo(() => {
    if (selectedCompany === 'TODAS') return activeMembers
    return activeMembers.filter((m) => m.companies?.includes(selectedCompany))
  }, [activeMembers, selectedCompany])

  // Empresas únicas que tienen al menos un integrante asignado
  const availableCompanies = useMemo(() => {
    const set = new Set<string>()
    activeMembers.forEach((m) => {
      m.companies?.forEach((c) => set.add(c))
    })
    return Array.from(set).sort()
  }, [activeMembers])

  return (
    <div className="space-y-10">
      {/* Encabezado de Sección */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Users className="w-3.5 h-3.5" />
          <span>Equipo NyS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Filtro por Empresa (opcional) */}
      {showCompanyFilter && availableCompanies.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCompany('TODAS')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedCompany === 'TODAS'
                ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas las Empresas ({activeMembers.length})
          </button>
          {availableCompanies.map((comp) => {
            const count = activeMembers.filter((m) => m.companies?.includes(comp)).length
            const isSelected = selectedCompany === comp

            return (
              <button
                key={comp}
                type="button"
                onClick={() => setSelectedCompany(comp)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {comp} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Grid de Integrantes con Fotografía Circular Elegante */}
      {filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            No se encontraron integrantes para el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMemberModal(member)}
              className="group bg-card border border-border hover:border-primary/50 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-pointer hover:-translate-y-1"
              title="Haz clic para ver el perfil completo"
            >
              {/* Resplandor decorativo de fondo al hacer hover */}
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

              {/* FOTOGRAFÍA CON BORDE CIRCULAR ELEGANTE */}
              <div className="relative mb-4">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full ring-4 ring-primary/20 group-hover:ring-primary/60 p-1.5 bg-background shadow-lg overflow-hidden relative group-hover:scale-105 transition-all duration-300">
                  {member.photoUrl ? (
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      unoptimized
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Users className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>

              {/* TÍTULO CON NOMBRE */}
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                {member.name}
              </h3>

              {/* CARGO / FUNCIÓN */}
              <p className="text-xs sm:text-sm font-semibold text-primary mt-1 line-clamp-2">
                {member.role}
              </p>

              {/* RESEÑA CORTA PREVIA */}
              {member.bio && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed italic">
                  "{member.bio}"
                </p>
              )}

              {/* EMPRESAS A LAS QUE PERTENECE (TAGS) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 w-full">
                {member.companies && member.companies.length > 0 ? (
                  member.companies.map((compName) => (
                    <span
                      key={compName}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted/90 text-foreground border border-border shadow-2xs"
                    >
                      <span>{compName}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">
                    NyS Residencial
                  </span>
                )}
              </div>

              {/* BOTÓN VER PERFIL & LINKEDIN */}
              <div className="mt-4 pt-3 border-t border-border/60 w-full flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                  <span>Ver perfil</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>

                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white transition-all shadow-xs cursor-pointer"
                    title={`Abrir perfil de LinkedIn de ${member.name}`}
                  >
                    <LinkedinIcon className="w-3 h-3" />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE PERFIL COMPLETO DEL INTEGRANTE */}
      {selectedMemberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMemberModal(null)}
        >
          <div
            className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner de Cabecera con Degradado Corporativo */}
            <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 relative border-b border-border">
              <button
                type="button"
                onClick={() => setSelectedMemberModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-background text-foreground transition-all shadow-sm cursor-pointer z-10"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Perfil */}
            <div className="px-6 pb-6 pt-0 text-center relative -mt-16 sm:-mt-20">
              {/* Fotografía Circular Grande con Borde Elegante */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full ring-4 ring-primary/30 p-1.5 bg-background shadow-xl overflow-hidden relative mx-auto mb-4">
                {selectedMemberModal.photoUrl ? (
                  <Image
                    src={selectedMemberModal.photoUrl}
                    alt={selectedMemberModal.name}
                    fill
                    unoptimized
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Users className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Nombre y Cargo */}
              <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-tight">
                {selectedMemberModal.name}
              </h3>
              <p className="text-sm font-semibold text-primary mt-1">
                {selectedMemberModal.role}
              </p>

              {/* Tags de Empresas Asociadas */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {selectedMemberModal.companies && selectedMemberModal.companies.length > 0 ? (
                  selectedMemberModal.companies.map((compName) => (
                    <span
                      key={compName}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20"
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>{compName}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">NyS Residencial</span>
                )}
              </div>

              {/* Descripción / Biografía Completa */}
              <div className="mt-6 p-4 rounded-2xl bg-muted/30 border border-border text-left space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Trayectoria y Perfil</span>
                </span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {selectedMemberModal.bio ||
                    'Profesional comprometido con la excelencia, transparencia y acompañamiento integral en operaciones inmobiliarias y administración de activos para NyS Residencial y sus empresas colaboradoras.'}
                </p>
              </div>

              {/* Botón de LinkedIn o Acción */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {selectedMemberModal.linkedinUrl && (
                  <a
                    href={selectedMemberModal.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white transition-all shadow-md cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                    <span>Conectar en LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedMemberModal(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
