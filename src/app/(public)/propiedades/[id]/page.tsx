import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Bed, Bath, Square, MapPin, Car, Box, AlertCircle, Ban } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params
  const property = await prisma.property.findUnique({ where: { id } })

  if (!property) {
    return {
      title: 'Propiedad no encontrada',
      description: 'La propiedad que buscas no está disponible en este momento.',
    }
  }

  const title = `${property.title} | ${property.operation} en ${property.city}`
  const description = `${property.propertyType} en ${property.operation} en ${property.city}, sector ${property.sector}. ${property.beds ? `${property.beds} habitaciones, ` : ''}${property.baths ? `${property.baths} baños, ` : ''}por ${formatCurrency(property.currency, property.price)}. Asesoría por NYS Residencial.`
  const mainImage = property.images && property.images.length > 0 ? property.images[0] : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200'

  return {
    title,
    description,
    keywords: [
      `${property.propertyType} en ${property.city}`,
      `${property.operation} ${property.city}`,
      `propiedades ${property.city}`,
      property.sector,
      property.city,
      'NYS Residencial',
    ],
    openGraph: {
      title,
      description,
      url: `https://nysresidencial.cl/propiedades/${property.id}`,
      type: 'article',
      images: [
        {
          url: mainImage,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
  }
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const property = await prisma.property.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!property) {
    notFound()
  }

  const isUnavailable = !property.isAvailable
  const statusLabel = property.availabilityStatus || 'No Disponible'

  const propertyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description?.replace(/<[^>]+>/g, '').trim() || property.title,
    url: `https://nysresidencial.cl/propiedades/${property.id}`,
    image: property.images,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency === 'Pesos' ? 'CLP' : property.currency,
      availability: isUnavailable ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      streetAddress: property.address || property.sector,
      addressCountry: 'CL',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 mt-24">
        
        {/* Aviso si la propiedad no está disponible */}
        {isUnavailable && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 p-4 md:p-5 rounded-3xl mb-8 flex items-start sm:items-center gap-4 shadow-sm animate-in fade-in">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Ban className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base text-rose-600 dark:text-rose-400">
                  Propiedad No Disponible
                </span>
                <span className="text-xs bg-rose-950/90 text-rose-200 px-3 py-1 rounded-full font-black uppercase tracking-wider border border-rose-500/50">
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Esta propiedad se encuentra {statusLabel.toLowerCase()} y se exhibe como parte del catálogo y trayectoria de NyS Residencial. Puedes revisar sus especificaciones y fotografías libremente, o consultar a nuestro equipo comercial por alternativas vigentes similares en {property.city}.
              </p>
            </div>
          </div>
        )}

        {/* Header Info */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">{property.operation}</Badge>
            <Badge variant="outline">{property.propertyType}</Badge>
            {property.status && <Badge variant="secondary">{property.status}</Badge>}
            {isUnavailable && (
              <Badge className="bg-rose-950/90 text-rose-200 border border-rose-500/50 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                {statusLabel}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{property.title}</h1>
          <div className="flex items-center text-muted-foreground text-lg">
            <MapPin className="h-5 w-5 mr-2 shrink-0" />
            {property.address ? `${property.address}, ` : ''}{property.sector}, {property.city}
          </div>
        </div>

        {/* Main Image */}
        <div className="relative h-[400px] md:h-[600px] w-full rounded-2xl overflow-hidden mb-8 bg-muted">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              unoptimized
              className={`object-cover ${isUnavailable ? 'grayscale-[60%] contrast-75 brightness-90' : ''}`}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              Sin imagen disponible
            </div>
          )}

          {/* Badge central sobre la foto si está no disponible */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
              <span className="px-5 py-2.5 text-sm sm:text-base font-black tracking-widest text-white bg-rose-950/95 border-2 border-rose-500/80 rounded-full shadow-2xl uppercase flex items-center gap-2">
                <Ban className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{statusLabel.toUpperCase()}</span>
              </span>
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
                <div className="flex items-center space-x-3">
                  <Bed className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Habitaciones</p>
                    <p className="font-semibold text-lg">{property.beds || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Bath className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Baños</p>
                    <p className="font-semibold text-lg">{property.baths || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Square className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">M² Útiles</p>
                    <p className="font-semibold text-lg">{property.builtArea ? `${property.builtArea} m²` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Square className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">M² Totales</p>
                    <p className="font-semibold text-lg">{property.landArea ? `${property.landArea} m²` : 'N/A'}</p>
                  </div>
                </div>
                {property.parking !== null && property.parking > 0 && (
                  <div className="flex items-center space-x-3">
                    <Car className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estacionamientos</p>
                      <p className="font-semibold text-lg">{property.parking}</p>
                    </div>
                  </div>
                )}
                {property.storage !== null && property.storage > 0 && (
                  <div className="flex items-center space-x-3">
                    <Box className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bodegas</p>
                      <p className="font-semibold text-lg">{property.storage}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Description */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Descripción</h2>
              {property.description ? (
                <div 
                  className="prose prose-zinc dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: property.description }}
                />
              ) : (
                <p className="text-muted-foreground">Sin descripción detallada disponible.</p>
              )}
            </section>

            {/* Location Map */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Ubicación</h2>
              <div className="h-96 w-full rounded-lg overflow-hidden border border-border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={property.googleMapsLink || `https://maps.google.com/maps?q=${encodeURIComponent(
                    (property.address ? property.address + ', ' : '') + 
                    property.sector + ', ' + 
                    property.city + ', Chile'
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                La ubicación en el mapa es una aproximación basada en la dirección de la propiedad.
              </p>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-card border border-border rounded-xl p-6 sticky top-28">
              <h3 className="text-xl font-bold mb-2">
                {isUnavailable ? 'Consultar Opciones Similares' : 'Contacto'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {isUnavailable
                  ? `Esta propiedad se encuentra ${statusLabel.toLowerCase()}. Contáctanos para asesorarte y presentarte opciones vigentes similares en ${property.city}.`
                  : '¿Te interesa esta propiedad? Contáctanos para más información o agendar una visita.'}
              </p>
              
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
                  <textarea 
                    className="w-full bg-background border border-border rounded-md px-3 py-2 min-h-[100px]" 
                    defaultValue={
                      isUnavailable 
                        ? `Hola, vi que la propiedad "${property.title}" figura como ${statusLabel.toLowerCase()}. Quisiera consultar si tienen alternativas similares disponibles en ${property.city}.`
                        : `Hola, me interesa la propiedad "${property.title}" en ${property.city}. Quisiera recibir más información o agendar una visita.`
                    }
                  ></textarea>
                </div>
                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-md transition-colors cursor-pointer">
                  {isUnavailable ? 'Consultar Alternativas' : 'Enviar Mensaje'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
