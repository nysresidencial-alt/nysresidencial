import prisma from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Pencil, Plus, MapPin, Printer, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { AdminSearch } from '@/components/admin/AdminSearch'
import { DeletePropertyModal } from '@/components/admin/DeletePropertyModal'
import { PropertyAvailabilityToggle } from '@/components/admin/PropertyAvailabilityToggle'
import { requireAdminAuth, getFirstAllowedRoute } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; availability?: string }>
}) {
  const session = await requireAdminAuth()

  // Si el usuario no tiene permisos para ver Propiedades (/admin), redirigir a su primera vista disponible (ej: /admin/vouchers para Contabilidad)
  if (!session.isSuperadmin && !session.permissions?.propiedades?.view) {
    const target = getFirstAllowedRoute(session)
    if (target !== '/admin') {
      redirect(target)
    }
  }

  const { q, availability } = await searchParams

  const whereClause: any = {}
  
  if (q && q.trim()) {
    whereClause.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { sector: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (availability === 'disponibles') {
    whereClause.isAvailable = true
  } else if (availability === 'no_disponibles') {
    whereClause.isAvailable = false
  }

  // Cargar propiedades con conteos paralelos para los filtros
  const [properties, totalCount, availableCount, unavailableCount] = await Promise.all([
    prisma.property.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count(),
    prisma.property.count({ where: { isAvailable: true } }),
    prisma.property.count({ where: { isAvailable: false } }),
  ])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propiedades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona la disponibilidad, precios y detalles de tus activos inmobiliarios.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Link href="/admin/portafolio" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full px-5 font-semibold border-border hover:bg-muted shadow-sm">
              <Printer className="w-4 h-4 mr-2 text-primary" />
              Exportar Portafolio PDF
            </Button>
          </Link>
          <Link href="/admin/propiedades/nueva" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar / Search & Filter Tabs */}
      <div className="bg-card border border-border p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex-1 w-full md:w-auto">
          <AdminSearch />
        </div>

        {/* Availability Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border overflow-x-auto w-full md:w-auto">
          <Link
            href={q ? `/admin?q=${encodeURIComponent(q)}` : '/admin'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              !availability
                ? 'bg-card text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas ({totalCount})
          </Link>
          <Link
            href={
              q
                ? `/admin?q=${encodeURIComponent(q)}&availability=disponibles`
                : '/admin?availability=disponibles'
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              availability === 'disponibles'
                ? 'bg-card text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Disponibles ({availableCount})
          </Link>
          <Link
            href={
              q
                ? `/admin?q=${encodeURIComponent(q)}&availability=no_disponibles`
                : '/admin?availability=no_disponibles'
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              availability === 'no_disponibles'
                ? 'bg-card text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            No Disponibles ({unavailableCount})
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">Listadas:</span>
          <div className="text-sm text-foreground whitespace-nowrap bg-muted px-3 py-1 rounded-full font-semibold">
            {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
          </div>
        </div>
      </div>
      
      {/* Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <p className="text-muted-foreground mb-4">No se encontraron propiedades.</p>
          <Link href="/admin/propiedades/nueva">
            <Button variant="outline" className="rounded-full">Crear la primera propiedad</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {properties.map((prop) => {
            const isUnavailable = !prop.isAvailable
            const unavailableLabel = (prop.availabilityStatus || 'No Disponible').toUpperCase()

            return (
              <div 
                key={prop.id} 
                className={`group flex flex-col border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
                  isUnavailable 
                    ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-muted/40 opacity-60 hover:opacity-95' 
                    : 'border-border bg-card'
                }`}
              >
                
                {/* Image Section */}
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                  {prop.images && prop.images[0] ? (
                    <Image
                      src={prop.images[0]}
                      alt={prop.title}
                      fill
                      unoptimized
                      className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                        isUnavailable ? 'grayscale-[60%] contrast-75 brightness-90' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-800 text-xs">
                      Sin foto
                    </div>
                  )}

                  {/* Translucent overlay & prominent banner for unavailable properties */}
                  {isUnavailable && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10 pointer-events-none">
                      <span className="px-3 py-1.5 text-xs font-black tracking-wider text-white bg-rose-950/90 border border-rose-500/70 rounded-full shadow-lg uppercase flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{unavailableLabel}</span>
                      </span>
                    </div>
                  )}
                  
                  {/* Operation & Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <Badge className="bg-background/90 text-foreground backdrop-blur border-none font-medium shadow-sm">
                      {prop.operation}
                    </Badge>
                    {prop.status && (
                      <Badge variant="secondary" className="bg-primary/90 text-primary-foreground backdrop-blur border-none font-medium shadow-sm">
                        {prop.status}
                      </Badge>
                    )}
                  </div>

                  {/* Availability quick switch */}
                  <div className="absolute top-3 right-3 z-20">
                    <PropertyAvailabilityToggle
                      id={prop.id}
                      title={prop.title}
                      operation={prop.operation}
                      isAvailable={prop.isAvailable}
                      availabilityStatus={prop.availabilityStatus}
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center truncate">
                      <MapPin className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{prop.sector}, {prop.city}</span>
                    </div>
                    {isUnavailable && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        {unavailableLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base leading-tight mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                    {prop.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-baseline justify-between">
                    <p className="text-xl font-black text-foreground">
                      {formatCurrency(prop.currency, prop.price)}
                    </p>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {prop.propertyType}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t border-border p-3 bg-muted/20 flex items-center justify-between">
                  <Link href={`/propiedades/${prop.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors pl-2">
                    Ver en sitio
                  </Link>
                  <div className="flex gap-2">
                    <Link href={`/admin/propiedades/${prop.id}/editar`}>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeletePropertyModal 
                      property={{ 
                        id: prop.id, 
                        title: prop.title, 
                        image: prop.images && prop.images[0] ? prop.images[0] : undefined 
                      }} 
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
