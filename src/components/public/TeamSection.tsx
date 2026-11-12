'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { Users, ExternalLink, Briefcase } from 'lucide-react'
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
              className="group bg-card border border-border hover:border-primary/40 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Resplandor decorativo de fondo al hacer hover */}
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

              {/* FOTOGRAFÍA CON BORDE CIRCULAR ELEGANTE */}
              <div className="relative mb-4">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full ring-4 ring-primary/20 group-hover:ring-primary/50 p-1.5 bg-background shadow-lg overflow-hidden relative group-hover:scale-105 transition-all duration-300">
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

              {/* BIO / RESEÑA (OPCIONAL) */}
              {member.bio && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                  {member.bio}
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

              {/* LINKEDIN */}
              {member.linkedinUrl && (
                <div className="mt-4 pt-3 border-t border-border/60 w-full flex justify-center">
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0A66C2]/10 hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white transition-all shadow-xs group/btn cursor-pointer"
                    title={`Ver perfil de LinkedIn de ${member.name}`}
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover/btn:opacity-100" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
