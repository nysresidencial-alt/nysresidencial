'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { 
  Printer, 
  ArrowLeft, 
  FileText, 
  Image as ImageIcon, 
  Filter, 
  Check, 
  Building2, 
  Sparkles,
  Info
} from 'lucide-react'

interface PortfolioViewProps {
  properties: Property[]
  currentDateText?: string
}

export function PortfolioView({ properties, currentDateText }: PortfolioViewProps) {
  // Current month and year in Spanish uppercase (e.g., "OCTUBRE 2026")
  const defaultDate = useMemo(() => {
    if (currentDateText) return currentDateText
    const now = new Date()
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ]
    return `${months[now.getMonth()]} ${now.getFullYear()}`
  }, [currentDateText])

  // Admin filter states
  const [operationFilter, setOperationFilter] = useState<'TODAS' | 'Venta' | 'Arriendo'>('TODAS')
  const [availabilityFilter, setAvailabilityFilter] = useState<'TODAS' | 'DISPONIBLES' | 'NO_DISPONIBLES'>('TODAS')
  const [cityFilter, setCityFilter] = useState<string>('TODAS')
  const [viewMode, setViewMode] = useState<'compact' | 'visual'>('compact') // 'compact' is identical to reference PDF, 'visual' has photo
  const [includeCover, setIncludeCover] = useState<boolean>(true)
  const [includeIndex, setIncludeIndex] = useState<boolean>(true)
  const [reportTitle, setReportTitle] = useState<string>('PORTAFOLIO DE ACTIVOS')
  const [reportSubtitle, setReportSubtitle] = useState<string>('INFORME INTERNO PARA ALIADOS')

  // Get distinct cities
  const cities = useMemo(() => {
    const set = new Set<string>()
    properties.forEach((p) => {
      if (p.city) set.add(p.city)
    })
    return Array.from(set).sort()
  }, [properties])

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (operationFilter !== 'TODAS' && p.operation !== operationFilter) return false
      if (availabilityFilter === 'DISPONIBLES' && !p.isAvailable) return false
      if (availabilityFilter === 'NO_DISPONIBLES' && p.isAvailable) return false
      if (cityFilter !== 'TODAS' && p.city !== cityFilter) return false
      return true
    })
  }, [properties, operationFilter, availabilityFilter, cityFilter])

  // Group properties logically by: City + Category
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: { title: string; subtitle: string; items: Property[] } } = {}

    filteredProperties.forEach((p) => {
      const city = p.city || 'Talca'
      const type = p.propertyType || 'Otros'
      const op = p.operation || 'Venta'

      // Clean group key
      let sectionTitle = `${city} · Área residencial`
      let sectionSubtitle = type.toUpperCase()

      if (op === 'Arriendo') {
        sectionTitle = `${city} · Área arriendos`
        sectionSubtitle = type.toUpperCase()
      } else if (type.toLowerCase().includes('comercial') || type.toLowerCase().includes('oficina')) {
        sectionTitle = `${city} · Comercial y Oficinas`
        sectionSubtitle = type.toUpperCase()
      } else if (type.toLowerCase().includes('terreno') || type.toLowerCase().includes('parcela')) {
        sectionTitle = `${city} · Loteos, Parcelas y Terrenos`
        sectionSubtitle = type.toUpperCase()
      } else if (type.toLowerCase().includes('agricola') || type.toLowerCase().includes('forestal')) {
        sectionTitle = `Región del Maule · Predios`
        sectionSubtitle = type.toUpperCase()
      }

      const key = `${sectionTitle}___${sectionSubtitle}`

      if (!groups[key]) {
        groups[key] = {
          title: sectionTitle,
          subtitle: sectionSubtitle,
          items: [],
        }
      }
      groups[key].items.push(p)
    })

    return Object.values(groups)
  }, [filteredProperties])

  function handlePrint() {
    window.print()
  }

  // Formatter for description text without HTML tags
  function formatDescription(desc: string | null, prop: Property) {
    if (!desc) {
      const parts: string[] = []
      if (prop.builtArea) parts.push(`${prop.builtArea} m² construidos`)
      if (prop.landArea) parts.push(`${prop.landArea} m² de terreno`)
      if (prop.beds) parts.push(`${prop.beds} dormitorios`)
      if (prop.baths) parts.push(`${prop.baths} baños`)
      if (prop.parking) parts.push(`${prop.parking} estacionamientos`)
      return parts.join(', ') + '.'
    }
    // Strip HTML tags
    const text = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return text
  }

  return (
    <div className="portfolio-container min-h-screen bg-neutral-100 dark:bg-neutral-900 pb-16">
      
      {/* Print-specific style overrides */}
      <style jsx global>{`
        @media print {
          /* Hide all admin layout chrome */
          header, nav, footer, .print-hide {
            display: none !important;
          }

          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .portfolio-container {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }

          .cover-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh !important;
            height: 100vh !important;
          }

          .content-page {
            page-break-after: auto !important;
          }

          .section-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .property-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      {/* ADMIN CONTROLS HEADER (Hidden when printing) */}
      <div className="print-hide sticky top-0 z-40 bg-card border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>Generador de Portafolio PDF</span>
                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                  NyS Inmobiliaria
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Configura los filtros y haz clic en &ldquo;Guardar como PDF&rdquo; o &ldquo;Imprimir&rdquo;.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center bg-muted p-1 rounded-full border text-xs font-medium">
              <button
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
                  viewMode === 'compact' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Texto estructurado clásico (como el PDF original)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Informe Clásico</span>
              </button>
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 ${
                  viewMode === 'visual' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Incluye fotos de cada propiedad"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Con Fotos</span>
              </button>
            </div>

            <Button
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-lg shadow-primary/25 cursor-pointer ml-auto md:ml-0"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Guardar como PDF
            </Button>
          </div>

        </div>

        {/* Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-3 text-xs">
          
          {/* Operación */}
          <div className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
            <span className="text-muted-foreground font-medium mr-1">Operación:</span>
            {(['TODAS', 'Venta', 'Arriendo'] as const).map((op) => (
              <button
                key={op}
                onClick={() => setOperationFilter(op)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                  operationFilter === op ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Disponibilidad */}
          <div className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
            <span className="text-muted-foreground font-medium mr-1">Disponibilidad:</span>
            <button
              onClick={() => setAvailabilityFilter('TODAS')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                availabilityFilter === 'TODAS' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setAvailabilityFilter('DISPONIBLES')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                availabilityFilter === 'DISPONIBLES' ? 'bg-emerald-600 text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Solo Disponibles
            </button>
            <button
              onClick={() => setAvailabilityFilter('NO_DISPONIBLES')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                availabilityFilter === 'NO_DISPONIBLES' ? 'bg-amber-600 text-white font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Solo No Disponibles
            </button>
          </div>

          {/* Ciudad */}
          {cities.length > 1 && (
            <div className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
              <span className="text-muted-foreground font-medium mr-1">Ciudad:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-transparent border-none text-foreground font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas las ciudades</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Opciones de Impresión */}
          <div className="flex items-center gap-4 ml-auto">
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="rounded accent-primary cursor-pointer"
              />
              <span>Incluir Portada</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
              <input
                type="checkbox"
                checked={includeIndex}
                onChange={(e) => setIncludeIndex(e.target.checked)}
                className="rounded accent-primary cursor-pointer"
              />
              <span>Incluir Resumen / Índice</span>
            </label>
          </div>

        </div>

        {/* Tip for printing */}
        <div className="bg-primary/5 border-t border-primary/10 px-4 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              <strong>Consejo para PDF perfecto:</strong> En la ventana de impresión del navegador, elige destino <em>&ldquo;Guardar como PDF&rdquo;</em> y en <em>&ldquo;Más opciones&rdquo;</em> activa <strong>&ldquo;Gráficos de segundo plano&rdquo;</strong> para que se exporte la portada oscura y los tonos de acento.
            </span>
            <span className="font-semibold text-foreground ml-auto whitespace-nowrap">
              {filteredProperties.length} propiedades seleccionadas
            </span>
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW WRAPPER */}
      <div className="max-w-[210mm] mx-auto my-6 print:my-0 print:max-w-none">
        
        {/* ======================================================== */}
        {/* 1. PORTADA EJECUTIVA (COVER PAGE) */}
        {/* ======================================================== */}
        {includeCover && (
          <div className="cover-page print-sheet bg-[#141721] text-white p-12 md:p-16 mb-8 rounded-2xl print:rounded-none shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[297mm] border-l-[14px] border-[#ce1156]">
            
            {/* Top brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-16 shrink-0">
                  <Image
                    src="/logo-nys.png"
                    alt="NyS"
                    fill
                    priority
                    className="object-contain"
                  />
                </div>
                <span className="text-white font-bold text-xs md:text-sm tracking-widest uppercase">
                  NEGOCIOS Y SOLUCIONES INMOBILIARIAS
                </span>
              </div>
            </div>

            {/* Center titles */}
            <div className="my-auto py-16">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-none mb-6">
                {reportTitle}
              </h1>
              
              <div className="w-16 h-1 bg-[#ce1156] mb-8" />
              
              <p className="text-zinc-300 font-semibold tracking-wider text-sm md:text-base uppercase mb-2">
                {reportSubtitle}
              </p>
              
              <p className="text-white font-black tracking-widest text-lg md:text-xl uppercase">
                {defaultDate}
              </p>
            </div>

            {/* Bottom footer */}
            <div className="border-t border-zinc-800/80 pt-6">
              <p className="text-[11px] text-zinc-400 font-medium tracking-widest uppercase mb-1">
                ATACAMA · SANTIAGO · TALCA · CURICÓ · MAULE · CONCEPCIÓN · OSORNO
              </p>
              <p className="text-xs text-[#ce1156] font-bold tracking-wider">
                www.nys.cl
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ÍNDICE / RESUMEN (TABLE OF CONTENTS) */}
        {/* ======================================================== */}
        {includeIndex && groupedSections.length > 0 && (
          <div className="content-page print-sheet bg-white text-zinc-900 p-10 md:p-14 mb-8 rounded-2xl print:rounded-none shadow-xl border border-zinc-200">
            
            {/* Standard Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-8">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                <div className="relative h-5 w-7 shrink-0">
                  <Image
                    src="/logo-nys.png"
                    alt="NyS"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>NEGOCIOS Y SOLUCIONES INMOBILIARIAS</span>
              </div>
              <div className="text-[11px] text-zinc-500 font-medium">
                www.nys.cl | Portafolio de Propiedades | {defaultDate}
              </div>
            </div>

            {/* Table of contents title */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">
                Contenido
              </h2>
              <p className="text-sm text-zinc-600">
                Portafolio organizado por tipo de activo, operación y ubicación ({filteredProperties.length} propiedades).
              </p>
            </div>

            {/* Index list */}
            <div className="space-y-3 mb-12">
              {groupedSections.map((sec, idx) => (
                <div key={idx} className="flex items-baseline justify-between border-b border-zinc-100 pb-2 text-sm">
                  <div className="font-semibold text-zinc-800">
                    <span className="text-zinc-400 font-mono mr-3">{String(idx + 1).padStart(2, '0')}</span>
                    <span>{sec.title}</span>
                    <span className="text-zinc-400 mx-2">·</span>
                    <span className="text-[#ce1156] font-bold">{sec.subtitle}</span>
                  </div>
                  <div className="text-xs text-zinc-500 font-medium bg-zinc-100 px-2.5 py-0.5 rounded-full">
                    {sec.items.length} {sec.items.length === 1 ? 'activo' : 'activos'}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 text-[11px] text-zinc-400 border-t border-zinc-100">
              Documento comercial elaborado por NyS Propiedades. Todos los valores y disponibilidades reflejados corresponden a la fecha de emisión ({defaultDate}).
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. SECCIONES DE PROPIEDADES */}
        {/* ======================================================== */}
        {groupedSections.map((sec, secIdx) => (
          <div 
            key={secIdx} 
            className="content-page print-sheet bg-white text-zinc-900 p-8 md:p-12 mb-8 rounded-2xl print:rounded-none shadow-xl border border-zinc-200 section-block"
          >
            
            {/* Standard Running Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5 mb-6">
              <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-800 uppercase tracking-wider">
                <div className="relative h-4 w-6 shrink-0">
                  <Image
                    src="/logo-nys.png"
                    alt="NyS"
                    fill
                    className="object-contain"
                  />
                </div>
                <span>NEGOCIOS Y SOLUCIONES INMOBILIARIAS</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-medium">
                www.nys.cl | Portafolio | {defaultDate}
              </div>
            </div>

            {/* Section Headline (exact like PDF original) */}
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-zinc-900 leading-tight">
                {sec.title}
              </h3>
              <h4 className="text-base font-black text-[#ce1156] uppercase tracking-wider">
                {sec.subtitle}
              </h4>
            </div>

            {/* Properties Rows */}
            <div className="space-y-4">
              {sec.items.map((prop) => {
                const formattedPrice = formatCurrency(prop.currency, prop.price)
                const isUnavailable = !prop.isAvailable
                const hasImages = prop.images && prop.images.length > 0

                return (
                  <div 
                    key={prop.id} 
                    className={`property-row border rounded-xl p-4 transition-all ${
                      isUnavailable 
                        ? 'border-zinc-200 bg-zinc-50/70 opacity-90' 
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    
                    {/* Compact Mode (Exact original PDF layout) */}
                    {viewMode === 'compact' ? (
                      <div>
                        {/* Top line: Title & Price */}
                        <div className="flex items-start justify-between gap-4 mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-sm md:text-base text-zinc-900 leading-snug">
                              {prop.title}
                            </h5>
                            {isUnavailable && (
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-white tracking-wider">
                                {prop.availabilityStatus || 'NO DISPONIBLE'}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="font-black text-sm md:text-base text-[#ce1156]">
                              {prop.operation === 'Arriendo' ? `Arriendo ${formattedPrice}` : formattedPrice}
                            </span>
                          </div>
                        </div>

                        {/* Description & specs */}
                        <p className="text-xs text-zinc-700 leading-relaxed">
                          {formatDescription(prop.description, prop)}
                        </p>

                        {/* Key attributes pills */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-zinc-500 font-medium">
                          {prop.sector && <span>Sector {prop.sector}</span>}
                          {prop.builtArea ? <span>{prop.builtArea} m² constr.</span> : null}
                          {prop.landArea ? <span>{prop.landArea} m² terreno</span> : null}
                          {prop.beds ? <span>{prop.beds} dorm.</span> : null}
                          {prop.baths ? <span>{prop.baths} baños</span> : null}
                          {prop.parking ? <span>{prop.parking} estac.</span> : null}
                        </div>
                      </div>
                    ) : (
                      /* Visual Mode (With Thumbnail Photo) */
                      <div className="flex gap-4 items-start">
                        {/* Thumbnail */}
                        <div className="relative w-28 h-24 shrink-0 bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200">
                          {hasImages ? (
                            <Image
                              src={prop.images[0]}
                              alt={prop.title}
                              fill
                              className={`object-cover ${isUnavailable ? 'grayscale-[30%]' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-[10px]">
                              Sin foto
                            </div>
                          )}
                          {isUnavailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                              <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                {prop.availabilityStatus || 'NO DISPONIBLE'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h5 className="font-bold text-sm md:text-base text-zinc-900 truncate">
                              {prop.title}
                            </h5>
                            <span className="font-black text-sm md:text-base text-[#ce1156] shrink-0">
                              {prop.operation === 'Arriendo' ? `Arriendo ${formattedPrice}` : formattedPrice}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-700 line-clamp-2 leading-relaxed mb-2">
                            {formatDescription(prop.description, prop)}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-medium">
                            <span className="text-zinc-700 font-semibold">{prop.city} ({prop.sector})</span>
                            {prop.builtArea ? <span>{prop.builtArea} m² constr.</span> : null}
                            {prop.landArea ? <span>{prop.landArea} m² terr.</span> : null}
                            {prop.beds ? <span>{prop.beds}D</span> : null}
                            {prop.baths ? <span>{prop.baths}B</span> : null}
                            {prop.parking ? <span>{prop.parking}E</span> : null}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>

            {/* Running Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
              <div>NyS · Negocios y Soluciones Inmobiliarias</div>
              <div>{sec.title} · {sec.subtitle}</div>
            </div>

          </div>
        ))}

        {filteredProperties.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-zinc-200">
            <p className="text-zinc-500 mb-2">No hay propiedades que coincidan con los filtros seleccionados.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setOperationFilter('TODAS')
                setAvailabilityFilter('TODAS')
                setCityFilter('TODAS')
              }}
              className="rounded-full text-xs"
            >
              Restablecer filtros
            </Button>
          </div>
        )}

      </div>

    </div>
  )
}
