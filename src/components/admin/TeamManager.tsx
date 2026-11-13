'use client'

import React, { useState, useMemo } from 'react'
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
  Sparkles,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  LayoutGrid,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/icons/LinkedinIcon'
import { TeamMember, TeamCompany, TEAM_LEVELS } from '@/lib/team-types'
import { TeamMemberModal } from './TeamMemberModal'
import {
  saveTeamMember,
  deleteTeamMember,
  addTeamCompany,
  deleteTeamCompany,
  saveCorporateText,
  saveAllTeamMembers,
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
  const [layoutView, setLayoutView] = useState<'pyramid' | 'grid'>('pyramid')

  // Datos
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [companies, setCompanies] = useState<TeamCompany[]>(initialCompanies)
  const [corporateText, setCorporateText] = useState<string>(initialCorporateText)

  // Estado UI
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [isAddingCompany, setIsAddingCompany] = useState(false)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isSavingText, setIsSavingText] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Drag and drop state
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null)
  const [dragOverLevel, setDragOverLevel] = useState<number | null>(null)
  const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null)

  function showFeedback(text: string, type: 'success' | 'error') {
    setFeedback({ text, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  // Agrupación por nivel para la pirámide
  const membersByLevel = useMemo(() => {
    const map: Record<number, TeamMember[]> = { 1: [], 2: [], 3: [], 4: [] }
    members.forEach((m) => {
      const lvl = m.level || 3
      if (!map[lvl]) map[lvl] = []
      map[lvl].push(m)
    })
    Object.keys(map).forEach((lvlStr) => {
      const lvl = Number(lvlStr)
      map[lvl].sort((a, b) => (a.order || 0) - (b.order || 0))
    })
    return map
  }, [members])

  // Persistir orden completo a la BD
  async function persistMembersOrder(rawList: TeamMember[]) {
    // Normalizar orden secuencial por nivel
    const byLvl: Record<number, TeamMember[]> = { 1: [], 2: [], 3: [], 4: [] }
    rawList.forEach((m) => {
      const lvl = m.level || 3
      if (!byLvl[lvl]) byLvl[lvl] = []
      byLvl[lvl].push(m)
    })

    const finalList: TeamMember[] = []
    ;[1, 2, 3, 4].forEach((lvl) => {
      if (byLvl[lvl]) {
        byLvl[lvl].forEach((item, idx) => {
          finalList.push({
            ...item,
            level: lvl,
            order: idx + 1,
          })
        })
      }
    })

    setMembers(finalList)
    setIsSavingOrder(true)
    const res = await saveAllTeamMembers(finalList)
    setIsSavingOrder(false)
    if (res.error) {
      showFeedback(res.error, 'error')
    } else {
      showFeedback('Estructura piramidal y orden actualizados', 'success')
    }
  }

  // Drag and Drop Handlers
  function handleDragStart(e: React.DragEvent, memberId: string) {
    e.dataTransfer.setData('text/plain', memberId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedMemberId(memberId)
  }

  function handleDragEnd() {
    setDraggedMemberId(null)
    setDragOverLevel(null)
    setDragOverMemberId(null)
  }

  function handleDragOverLevel(e: React.DragEvent, levelNum: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverLevel !== levelNum) {
      setDragOverLevel(levelNum)
    }
  }

  function handleDragOverMember(e: React.DragEvent, memberId: string) {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverMemberId !== memberId) {
      setDragOverMemberId(memberId)
    }
  }

  async function handleDropOnLevel(targetLevel: number) {
    if (!draggedMemberId) return
    const dragged = members.find((m) => m.id === draggedMemberId)
    if (!dragged) return

    setDragOverLevel(null)
    setDragOverMemberId(null)

    // Si ya está en ese nivel y se soltó sobre el contenedor vacío
    if (dragged.level === targetLevel) return

    const remaining = members.filter((m) => m.id !== draggedMemberId)
    const updatedDragged = { ...dragged, level: targetLevel }
    const newList = [...remaining, updatedDragged]

    await persistMembersOrder(newList)
    setDraggedMemberId(null)
  }

  async function handleDropOnMember(targetMemberId: string, targetLevel: number) {
    if (!draggedMemberId || draggedMemberId === targetMemberId) {
      setDragOverLevel(null)
      setDragOverMemberId(null)
      return
    }

    const dragged = members.find((m) => m.id === draggedMemberId)
    if (!dragged) return

    setDragOverLevel(null)
    setDragOverMemberId(null)

    const updatedDragged = { ...dragged, level: targetLevel }
    const remaining = members.filter((m) => m.id !== draggedMemberId)
    const targetIdx = remaining.findIndex((m) => m.id === targetMemberId)

    if (targetIdx >= 0) {
      remaining.splice(targetIdx, 0, updatedDragged)
    } else {
      remaining.push(updatedDragged)
    }

    await persistMembersOrder(remaining)
    setDraggedMemberId(null)
  }

  // Mover nivel con botones de accesibilidad (Subir/Bajar)
  async function handleChangeLevel(member: TeamMember, newLevel: number) {
    if (newLevel < 1 || newLevel > 4 || member.level === newLevel) return
    const updated = members.map((m) => (m.id === member.id ? { ...m, level: newLevel } : m))
    await persistMembersOrder(updated)
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
            Estructura piramidal organizable arrastrando integrantes, fotos circulares elegantes y empresas asociadas.
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

          {/* SECCIÓN 2: INTEGRANTES DEL EQUIPO & ORGANIGRAMA PIRAMIDAL */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Organización Jerárquica del Equipo</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {members.length} personas
                  </span>
                  {isSavingOrder && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-primary animate-pulse font-semibold">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Guardando orden...</span>
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Se visualiza como pirámide en <Link href="/nosotros" target="_blank" className="text-primary underline">/nosotros</Link> y <Link href="/equipo" target="_blank" className="text-primary underline">/equipo</Link>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Switcher Vista Pirámide vs Mosaico */}
                <div className="flex items-center p-0.5 bg-muted rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setLayoutView('pyramid')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutView === 'pyramid'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Pirámide (Arrastrar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutView('grid')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      layoutView === 'grid'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                    <span>Mosaico</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingMember(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Persona</span>
                </button>
              </div>
            </div>

            {/* BANNER GUÍA DE ARRASTRAR Y SOLTAR */}
            {layoutView === 'pyramid' && (
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Organización por Pirámide: Arrastra y suelta libremente
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Toma una persona con el cursor y arrástrala entre pisos de la pirámide o sobre otra persona para reordenarla.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-background border border-border text-muted-foreground hidden sm:inline-block">
                  Auto-guardado activo
                </span>
              </div>
            )}

            {/* VISTA 1: ORGANIGRAMA PIRAMIDAL CON ARRASTRAR Y SOLTAR */}
            {layoutView === 'pyramid' ? (
              <div className="space-y-6">
                {TEAM_LEVELS.map((tier, tierIdx) => {
                  const tierMembers = membersByLevel[tier.level] || []
                  const isDropActive = dragOverLevel === tier.level
                  const hasNextTier = tierIdx < TEAM_LEVELS.length - 1

                  return (
                    <div key={tier.level} className="relative">
                      {/* Contenedor del Nivel */}
                      <div
                        onDragOver={(e) => handleDragOverLevel(e, tier.level)}
                        onDrop={() => handleDropOnLevel(tier.level)}
                        className={`rounded-3xl p-5 border transition-all duration-200 ${
                          isDropActive
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-md'
                            : 'bg-card/70 border-border'
                        }`}
                      >
                        {/* Cabecera del Nivel */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 mb-4 border-b border-border/70">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                tier.level === 1
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : tier.level === 2
                                  ? 'bg-primary/15 text-primary border border-primary/30'
                                  : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {tier.level === 1 && <span>👑</span>}
                              {tier.badge}
                            </span>
                            <h3 className="text-sm font-bold text-foreground">
                              {tier.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {tierMembers.length} {tierMembers.length === 1 ? 'persona' : 'personas'}
                            </span>
                          </div>
                        </div>

                        {/* Área de tarjetas / Drop zone */}
                        {tierMembers.length === 0 ? (
                          <div
                            onDragOver={(e) => handleDragOverLevel(e, tier.level)}
                            onDrop={() => handleDropOnLevel(tier.level)}
                            className="py-8 text-center border-2 border-dashed border-border/80 rounded-2xl bg-muted/20"
                          >
                            <p className="text-xs text-muted-foreground font-medium">
                              Arrastra personas aquí para ubicarlas en {tier.title}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-4">
                            {tierMembers.map((member) => {
                              const isDragging = draggedMemberId === member.id
                              const isHoveredTarget = dragOverMemberId === member.id

                              return (
                                <div
                                  key={member.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, member.id)}
                                  onDragEnd={handleDragEnd}
                                  onDragOver={(e) => handleDragOverMember(e, member.id)}
                                  onDrop={(e) => {
                                    e.stopPropagation()
                                    handleDropOnMember(member.id, tier.level)
                                  }}
                                  className={`w-full sm:w-64 bg-background border rounded-2xl p-4 shadow-xs transition-all flex flex-col items-center text-center relative group cursor-grab active:cursor-grabbing select-none ${
                                    isDragging
                                      ? 'opacity-40 scale-95 border-primary border-dashed'
                                      : isHoveredTarget
                                      ? 'border-primary ring-2 ring-primary/40 scale-102 bg-primary/5'
                                      : 'border-border hover:border-primary/40 hover:shadow-md'
                                  }`}
                                >
                                  {/* Barra superior de la tarjeta con Grip y cambio rápido de nivel */}
                                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-border/50 text-muted-foreground">
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-primary/80">
                                      <GripVertical className="w-3.5 h-3.5" />
                                      <span>Nivel {tier.level}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        disabled={tier.level <= 1}
                                        onClick={() => handleChangeLevel(member, tier.level - 1)}
                                        title="Subir de nivel en la pirámide"
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={tier.level >= 4}
                                        onClick={() => handleChangeLevel(member, tier.level + 1)}
                                        title="Bajar de nivel en la pirámide"
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* FOTO CIRCULAR ELEGANTE */}
                                  <div className="relative mb-3">
                                    <div className="w-20 h-20 rounded-full ring-3 ring-primary/25 p-1 bg-background shadow-sm overflow-hidden relative group-hover:ring-primary/50 transition-all duration-300">
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
                                    {!member.isActive && (
                                      <span className="absolute bottom-0 right-0 px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-muted text-muted-foreground border border-border">
                                        Oculto
                                      </span>
                                    )}
                                  </div>

                                  {/* NOMBRE Y CARGO */}
                                  <h4 className="text-sm font-extrabold text-foreground tracking-tight leading-snug line-clamp-1">
                                    {member.name}
                                  </h4>
                                  <p className="text-[11px] font-semibold text-primary mt-0.5 line-clamp-1">
                                    {member.role}
                                  </p>

                                  {/* EMPRESAS ASOCIADAS */}
                                  <div className="flex flex-wrap items-center justify-center gap-1 mt-2 w-full">
                                    {member.companies && member.companies.length > 0 ? (
                                      member.companies.slice(0, 2).map((compName) => (
                                        <span
                                          key={compName}
                                          className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted text-foreground border border-border"
                                        >
                                          {compName}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[9px] text-muted-foreground/60 italic">
                                        Sin empresa asignada
                                      </span>
                                    )}
                                    {member.companies && member.companies.length > 2 && (
                                      <span className="text-[9px] font-bold text-muted-foreground">
                                        +{member.companies.length - 2}
                                      </span>
                                    )}
                                  </div>

                                  {/* BOTONES DE ACCIÓN */}
                                  <div className="flex items-center justify-center gap-2 mt-3 pt-2.5 border-t border-border/60 w-full">
                                    <button
                                      type="button"
                                      onClick={() => setEditingMember(member)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMember(member)}
                                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                      title="Eliminar del equipo"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* CONECTOR VISUAL ENTRE NIVELES DE LA PIRÁMIDE */}
                      {hasNextTier && (
                        <div className="w-full flex flex-col items-center my-3 pointer-events-none">
                          <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-primary/20" />
                          <div className="w-2 h-2 rounded-full bg-primary/70 ring-4 ring-primary/15 -my-1 z-10" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* VISTA 2: MOSAICO CLÁSICO */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center relative group"
                  >
                    <div className="w-24 h-24 rounded-full ring-3 ring-primary/20 p-1 bg-background shadow-md overflow-hidden relative mb-3">
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
                          <Users className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 mb-1">
                      Nivel {member.level || 3}
                    </span>
                    <h3 className="text-base font-extrabold text-foreground tracking-tight leading-snug">
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-primary mt-1 line-clamp-2">
                      {member.role}
                    </p>
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
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TEXTO CORPORATIVO QUIÉNES SOMOS */}
      {activeTab === 'text' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 max-w-4xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Texto Institucional "Quiénes Somos"
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Este texto se presenta en la sección superior de la página pública <Link href="/nosotros" target="_blank" className="text-primary underline">/nosotros</Link>, antecediendo a la pirámide del equipo.
          </p>

          <textarea
            rows={8}
            value={corporateText}
            onChange={(e) => setCorporateText(e.target.value)}
            placeholder="Escribe la historia, valores y misión de NyS Residencial..."
            className="w-full p-4 text-xs bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed font-sans"
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveCorporateText}
              disabled={isSavingText}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-40 transition-all"
            >
              {isSavingText ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSavingText ? 'Guardando en BD...' : 'Guardar Texto Institucional'}</span>
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
          onSaved={(saved) => {
            handleMemberSaved(saved)
            setEditingMember(null)
            setIsCreatingMember(false)
          }}
          onCompanyAdded={(updatedCompanies) => setCompanies(updatedCompanies)}
        />
      )}
    </div>
  )
}
