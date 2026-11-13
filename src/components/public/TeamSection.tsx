'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import {
  Users,
  Briefcase,
  X,
  Info,
  ChevronRight,
  ExternalLink,
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
  title = 'Nuestro Equipo',
  subtitle = 'Profesionales comprometidos con brindarte la mejor asesoría, transparencia y respaldo en cada operación inmobiliaria.',
}: TeamSectionProps) {
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

  // Agrupar por piso jerárquico para formar la pirámide (sin mostrar textos de niveles)
  const membersByLevel = useMemo(() => {
    const groups: Record<number, TeamMember[]> = {}
    activeMembers.forEach((m) => {
      const lvl = m.level || 3
      if (!groups[lvl]) groups[lvl] = []
      groups[lvl].push(m)
    })
    Object.keys(groups).forEach((key) => {
      groups[Number(key)].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return groups
  }, [activeMembers])

  // Pisos presentes
  const activeLevels = useMemo(() => {
    return Object.keys(membersByLevel)
      .map(Number)
      .sort((a, b) => a - b)
  }, [membersByLevel])

  // Render individual de tarjeta de integrante (compacta y elegante)
  const renderMemberCard = (member: TeamMember, isSummit: boolean = false) => (
    <div
      key={member.id}
      onClick={() => setSelectedMemberModal(member)}
      className={`group bg-card border rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-pointer hover:-translate-y-1 w-full max-w-[200px] sm:max-w-[220px] ${
        isSummit
          ? 'border-amber-500/35 hover:border-amber-500/70 ring-1 ring-amber-500/10 hover:shadow-amber-500/10'
          : 'border-border hover:border-primary/50'
      }`}
      title="Haz clic para ver el perfil completo"
    >
      {/* Resplandor decorativo sutil al hacer hover */}
      <div
        className={`absolute -top-10 -left-10 w-24 h-24 rounded-full blur-xl transition-colors pointer-events-none ${
          isSummit
            ? 'bg-amber-500/10 group-hover:bg-amber-500/20'
            : 'bg-primary/5 group-hover:bg-primary/10'
        }`}
      />

      {/* FOTOGRAFÍA CON BORDE CIRCULAR ELEGANTE */}
      <div className="relative mb-2.5">
        <div
          className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-background shadow-md overflow-hidden relative group-hover:scale-105 transition-all duration-300 ${
            isSummit
              ? 'ring-3 ring-amber-500/40 group-hover:ring-amber-500/70'
              : 'ring-3 ring-primary/25 group-hover:ring-primary/60'
          }`}
        >
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
              <Users className="w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* TÍTULO CON NOMBRE */}
      <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-1">
        {member.name}
      </h3>

      {/* CARGO / FUNCIÓN */}
      <p className="text-[11px] sm:text-xs font-semibold text-primary mt-0.5 line-clamp-1">
        {member.role}
      </p>

      {/* EMPRESAS A LAS QUE PERTENECE (TAGS COMPACTOS) */}
      <div className="flex flex-wrap items-center justify-center gap-1 mt-2.5 w-full">
        {member.companies && member.companies.length > 0 ? (
          member.companies.slice(0, 2).map((compName) => (
            <span
              key={compName}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted/90 text-foreground border border-border shadow-2xs"
            >
              <span>{compName}</span>
            </span>
          ))
        ) : (
          <span className="text-[10px] text-muted-foreground/60 italic">
            NyS Residencial
          </span>
        )}
        {member.companies && member.companies.length > 2 && (
          <span className="text-[9px] font-bold text-muted-foreground px-1 py-0.5 rounded bg-muted">
            +{member.companies.length - 2}
          </span>
        )}
      </div>

      {/* BOTÓN VER PERFIL & LINKEDIN COMPACTO */}
      <div className="mt-2.5 pt-2 border-t border-border/60 w-full flex items-center justify-between gap-1 text-[10px]">
        <span className="font-bold text-primary group-hover:underline flex items-center gap-0.5">
          <span>Ver perfil</span>
          <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </span>

        {member.linkedinUrl && (
          <a
            href={member.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white transition-all shadow-xs cursor-pointer"
            title={`Abrir perfil de LinkedIn de ${member.name}`}
          >
            <LinkedinIcon className="w-2.5 h-2.5" />
            <span>LinkedIn</span>
          </a>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Encabezado de Sección Limpio */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          <Users className="w-3 h-3" />
          <span>Equipo NyS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* ESTRUCTURA PIRAMIDAL LIMPIA (SIN ETIQUETAS DE NIVEL NI FILTROS) */}
      {activeMembers.length === 0 ? (
        <div className="py-12 text-center bg-card border border-border rounded-2xl p-6 max-w-sm mx-auto">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">
            No hay integrantes registrados en el equipo.
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 max-w-5xl mx-auto px-4">
          {activeLevels.map((lvlNum, lvlIdx) => {
            const levelMembers = membersByLevel[lvlNum] || []
            const isSummit = lvlNum === 1
            const hasNextLevel = lvlIdx < activeLevels.length - 1
            const nextLevelMembersCount = hasNextLevel
              ? (membersByLevel[activeLevels[lvlIdx + 1]] || []).length
              : 0

            return (
              <div key={lvlNum} className="relative flex flex-col items-center">
                {/* Fila / Contenedor de integrantes en este piso de la pirámide */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 w-full">
                  {levelMembers.map((member) => renderMemberCard(member, isSummit))}
                </div>

                {/* Conector de Árbol / Tronco entre pisos */}
                {hasNextLevel && (
                  <div className="w-full flex flex-col items-center my-2 sm:my-3 pointer-events-none">
                    {/* Tronco vertical descendente */}
                    <div className="w-0.5 h-3.5 sm:h-5 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20" />
                    <div className="w-2 h-2 rounded-full bg-primary ring-3 ring-primary/20 -my-0.5 z-10" />

                    {/* Si el siguiente nivel tiene más de 1 integrante, ramificamos horizontalmente */}
                    {nextLevelMembersCount > 1 && (
                      <div className="w-3/4 max-w-xl hidden sm:flex flex-col items-center">
                        <div className="w-full h-0.5 bg-primary/25 rounded-full" />
                        <div className="w-full flex justify-between px-6 sm:px-12">
                          <div className="w-0.5 h-2.5 sm:h-3.5 bg-primary/25" />
                          <div className="w-0.5 h-2.5 sm:h-3.5 bg-primary/25" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-primary/30 p-1.5 bg-background shadow-xl overflow-hidden relative mx-auto mb-4">
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
                    <Users className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Nombre y Cargo */}
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-tight">
                {selectedMemberModal.name}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
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
              <div className="mt-5 p-4 rounded-2xl bg-muted/30 border border-border text-left space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span>Trayectoria y Perfil</span>
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {selectedMemberModal.bio ||
                    'Profesional comprometido con la excelencia, transparencia y acompañamiento integral en operaciones inmobiliarias y administración de activos para NyS Residencial y sus empresas colaboradoras.'}
                </p>
              </div>

              {/* Botón de LinkedIn o Acción */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
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
