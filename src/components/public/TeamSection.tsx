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
  Layers,
  LayoutGrid,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/icons/LinkedinIcon'
import { TeamMember, TeamCompany, TEAM_LEVELS } from '@/lib/team-types'

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
  const [viewMode, setViewMode] = useState<'pyramid' | 'grid'>('pyramid')

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

  // Agrupar por nivel para el organigrama / pirámide
  const membersByLevel = useMemo(() => {
    const groups: Record<number, TeamMember[]> = {}
    filteredMembers.forEach((m) => {
      const lvl = m.level || 3
      if (!groups[lvl]) groups[lvl] = []
      groups[lvl].push(m)
    })
    Object.keys(groups).forEach((key) => {
      groups[Number(key)].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return groups
  }, [filteredMembers])

  // Niveles presentes en la lista filtrada
  const activeLevels = useMemo(() => {
    return Object.keys(membersByLevel)
      .map(Number)
      .sort((a, b) => a - b)
  }, [membersByLevel])

  // Empresas únicas que tienen al menos un integrante asignado
  const availableCompanies = useMemo(() => {
    const set = new Set<string>()
    activeMembers.forEach((m) => {
      m.companies?.forEach((c) => set.add(c))
    })
    return Array.from(set).sort()
  }, [activeMembers])

  // Renderizador individual de tarjeta de integrante
  const renderMemberCard = (member: TeamMember, isSummit: boolean = false) => (
    <div
      key={member.id}
      onClick={() => setSelectedMemberModal(member)}
      className={`group bg-card border rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden cursor-pointer hover:-translate-y-1.5 w-full max-w-xs sm:max-w-[280px] ${
        isSummit
          ? 'border-amber-500/30 hover:border-amber-500/60 ring-1 ring-amber-500/10 hover:shadow-amber-500/10'
          : 'border-border hover:border-primary/50'
      }`}
      title="Haz clic para ver el perfil completo"
    >
      {/* Resplandor decorativo de fondo al hacer hover */}
      <div
        className={`absolute -top-16 -left-16 w-32 h-32 rounded-full blur-2xl transition-colors pointer-events-none ${
          isSummit
            ? 'bg-amber-500/10 group-hover:bg-amber-500/20'
            : 'bg-primary/5 group-hover:bg-primary/10'
        }`}
      />

      {/* FOTOGRAFÍA CON BORDE CIRCULAR ELEGANTE */}
      <div className="relative mb-4">
        <div
          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1.5 bg-background shadow-lg overflow-hidden relative group-hover:scale-105 transition-all duration-300 ${
            isSummit
              ? 'ring-4 ring-amber-500/30 group-hover:ring-amber-500/60'
              : 'ring-4 ring-primary/20 group-hover:ring-primary/60'
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
  )

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

      {/* Barra de Filtros y Switcher de Visualización */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto px-4">
        {/* Filtro por Empresa */}
        {showCompanyFilter && availableCompanies.length > 1 ? (
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
              Todas ({activeMembers.length})
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
        ) : (
          <div />
        )}

        {/* Switcher Vista Pirámide vs Mosaico */}
        <div className="flex items-center p-0.5 bg-muted rounded-xl border border-border shrink-0 self-center sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('pyramid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'pyramid'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Organigrama Piramidal</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-primary" />
            <span>Mosaico</span>
          </button>
        </div>
      </div>

      {/* Contenido: Si no hay integrantes que coincidan con el filtro */}
      {filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            No se encontraron integrantes para el filtro seleccionado.
          </p>
        </div>
      ) : viewMode === 'pyramid' ? (
        /* VISTA 1: ESTRUCTURA PIRAMIDAL / ÁRBOL JERÁRQUICO */
        <div className="space-y-8 sm:space-y-12 max-w-6xl mx-auto px-4">
          {activeLevels.map((lvlNum, lvlIdx) => {
            const levelMembers = membersByLevel[lvlNum] || []
            const levelInfo = TEAM_LEVELS.find((l) => l.level === lvlNum)
            const isSummit = lvlNum === 1
            const hasNextLevel = lvlIdx < activeLevels.length - 1
            const nextLevelMembersCount = hasNextLevel
              ? (membersByLevel[activeLevels[lvlIdx + 1]] || []).length
              : 0

            return (
              <div key={lvlNum} className="relative flex flex-col items-center">
                {/* Cabecera del nivel piramidal */}
                <div className="mb-6 flex flex-col items-center text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs ${
                      isSummit
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : lvlNum === 2
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isSummit && <span>👑</span>}
                    {levelInfo?.badge || `Nivel ${lvlNum}`}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground mt-1.5">
                    {levelInfo?.title}
                  </h3>
                </div>

                {/* Fila / Contenedor de integrantes en este nivel */}
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8 w-full">
                  {levelMembers.map((member) => renderMemberCard(member, isSummit))}
                </div>

                {/* Conector de Árbol / Organigrama Piramidal hacia el siguiente nivel */}
                {hasNextLevel && (
                  <div className="w-full flex flex-col items-center mt-8 sm:mt-12 pointer-events-none">
                    {/* Tronco vertical descendente */}
                    <div className="w-0.5 h-8 sm:h-12 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20 -my-1 z-10" />

                    {/* Si el siguiente nivel tiene más de 1 integrante, ramificamos horizontalmente */}
                    {nextLevelMembersCount > 1 && (
                      <div className="w-3/4 max-w-2xl hidden sm:flex flex-col items-center">
                        <div className="w-full h-0.5 bg-primary/25 rounded-full" />
                        <div className="w-full flex justify-between px-8 sm:px-14">
                          <div className="w-0.5 h-4 sm:h-6 bg-primary/25" />
                          <div className="w-0.5 h-4 sm:h-6 bg-primary/25" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA 2: MOSAICO / CUADRÍCULA CLÁSICA */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto px-4">
          {filteredMembers.map((member) => renderMemberCard(member, member.level === 1))}
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
