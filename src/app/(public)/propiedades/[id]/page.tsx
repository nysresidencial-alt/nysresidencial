import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Square, MapPin, Car, Box } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const property = await prisma.property.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!property) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Header Info */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">{property.operation}</Badge>
          <Badge variant="outline">{property.propertyType}</Badge>
          {property.status && <Badge variant="secondary">{property.status}</Badge>}
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-2">{property.title}</h1>
        <div className="flex items-center text-muted-foreground text-lg">
          <MapPin className="h-5 w-5 mr-2" />
          {property.address ? `${property.address}, ` : ''}{property.sector}, {property.city}
        </div>
      </div>

      {/* Main Image */}
      <div className="relative h-[400px] md:h-[600px] w-full rounded-2xl overflow-hidden mb-8">
        {property.images && property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
            Sin imagen disponible
          </div>
        )}
        <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md px-6 py-3 rounded-xl shadow-lg border border-border">
          <p className="text-3xl font-bold">{formatCurrency(property.currency, property.price)}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Características Principales</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                <Bed className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{property.beds}</span>
                <span className="text-sm text-muted-foreground">Habitaciones</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                <Bath className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{property.baths}</span>
                <span className="text-sm text-muted-foreground">Baños</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                <Square className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{property.builtArea || 0}</span>
                <span className="text-sm text-muted-foreground">m² útiles</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
                <Car className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{property.parking || 0}</span>
                <span className="text-sm text-muted-foreground">Estacionamientos</span>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Descripción</h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              {property.description ? (
                <div dangerouslySetInnerHTML={{ __html: property.description }} />
              ) : (
                <p className="text-muted-foreground">No hay descripción disponible para esta propiedad.</p>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-card border border-border rounded-xl p-6 sticky top-28">
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <p className="text-muted-foreground mb-6">¿Te interesa esta propiedad? Contáctanos para más información o agendar una visita.</p>
            
            <form className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <input type="text" className="w-full bg-background border border-border rounded-md px-3 py-2" placeholder="Tu nombre" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="w-full bg-background border border-border rounded-md px-3 py-2" placeholder="tu@email.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <textarea className="w-full bg-background border border-border rounded-md px-3 py-2 min-h-[100px]" placeholder="Me interesa esta propiedad..."></textarea>
              </div>
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-md transition-colors">
                Enviar Mensaje
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
