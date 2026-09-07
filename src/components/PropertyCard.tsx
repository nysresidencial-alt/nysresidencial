import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@prisma/client";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/propiedades/${property.id}`} className="block group h-full">
      <Card className="overflow-hidden h-full flex flex-col group-hover:shadow-xl transition-all duration-300 border-border/50 bg-card cursor-pointer">
        <div className="relative h-48 md:h-64 w-full shrink-0 overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
              Sin foto
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs md:text-sm">
              {property.operation}
            </Badge>
            <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white font-semibold backdrop-blur-sm text-xs md:text-sm">
              {property.propertyType}
            </Badge>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4">
            <p className="text-white font-bold text-lg md:text-2xl tracking-tight drop-shadow-sm">
              {property.currency} {property.price}
            </p>
          </div>
        </div>
        <CardContent className="p-4 md:p-6 flex-1 flex flex-col">
          <h3 className="font-bold text-base md:text-xl mb-2 text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center text-muted-foreground mb-4 mt-auto">
            <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 shrink-0" />
            <span className="text-xs md:text-sm truncate">
              {property.address ? `${property.address}, ` : ''}{property.sector}, {property.city}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground pt-3 md:pt-4 border-t border-border/50">
            {(property.beds ?? 0) > 0 && (
              <div className="flex items-center gap-1" title="Habitaciones">
                <Bed className="h-3 w-3 md:h-4 md:w-4" />
                <span>{property.beds}</span>
              </div>
            )}
            {(property.baths ?? 0) > 0 && (
              <div className="flex items-center gap-1" title="Baños">
                <Bath className="h-3 w-3 md:h-4 md:w-4" />
                <span>{property.baths}</span>
              </div>
            )}
            <div className="flex items-center gap-1" title="Metros útiles">
              <Square className="h-3 w-3 md:h-4 md:w-4" />
              <span>{property.builtArea || 0} m²</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
