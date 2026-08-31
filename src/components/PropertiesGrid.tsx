import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/db";

export async function PropertiesGrid() {
  const properties = await prisma.property.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <section className="py-20 bg-background" id="propiedades">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Propiedades Destacadas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Explora nuestra selección de propiedades exclusivas disponibles para ti.
            </p>
          </div>
          <Link href="/propiedades" className="text-primary font-medium hover:underline mt-4 md:mt-0">
            Ver todas las propiedades &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Link key={property.id} href={`/propiedades/${property.id}`} className="block group">
              <Card className="overflow-hidden h-full group-hover:shadow-xl transition-all duration-300 border-border/50 bg-card cursor-pointer">
                <div className="relative h-64 w-full overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                    <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      {property.operation}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white font-semibold backdrop-blur-sm">
                      {property.propertyType}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <p className="text-white font-bold text-2xl tracking-tight drop-shadow-sm">
                      {property.currency} {property.price}
                    </p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2 text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {property.title}
                  </h3>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4 mr-1 shrink-0" />
                    <span className="text-sm truncate">
                      {property.address ? `${property.address}, ` : ''}{property.sector}, {property.city}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                    {(property.beds ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5" title="Habitaciones">
                        <Bed className="h-4 w-4" />
                        <span>{property.beds}</span>
                      </div>
                    )}
                    {(property.baths ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5" title="Baños">
                        <Bath className="h-4 w-4" />
                        <span>{property.baths}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5" title="Metros útiles">
                      <Square className="h-4 w-4" />
                      <span>{property.builtArea || 0} m²</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
