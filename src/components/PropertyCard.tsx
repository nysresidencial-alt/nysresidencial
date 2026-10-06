"use client";

import Image from "next/image";
import Link from "next/link";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

export function PropertyCard({ property }: { property: Property }) {
  const hasImages = property.images && property.images.length > 0;

  // Formato similar a "UF: 15.000"
  const formattedPrice = formatCurrency(property.currency, property.price)
    .replace('UF', '')
    .replace('CLP', '')
    .trim();

  return (
    <Link href={`/propiedades/${property.id}`} className="block h-full group">
      <div className="flex flex-row h-full bg-card dark:bg-card border border-border hover:bg-muted dark:hover:bg-muted transition-colors">
        
        {/* Sección de Imagen */}
        <div className="relative w-[130px] sm:w-[160px] xl:w-[180px] shrink-0 bg-muted overflow-hidden">
          {hasImages ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sin foto
            </div>
          )}
          
          {/* Sello de agua NYS (como en la foto) */}
          <div className="absolute top-2 left-2 bg-background/90 dark:bg-background/80 p-1">
            <span className="text-primary font-bold text-[10px] leading-none block">NyS</span>
          </div>
        </div>

        {/* Sección de Contenido */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
          
          {/* Top Line: Ubicación | Operación | Precio */}
          <div className="text-primary text-[13px] sm:text-sm font-medium mb-1 truncate">
            {property.city} | {property.operation} | {property.currency}: {formattedPrice}
          </div>
          
          {/* Title Line: Tipo - Sector - Dirección */}
          <div className="text-foreground text-[13px] sm:text-sm mb-1 sm:mb-2 line-clamp-2">
            <strong className="font-bold">{property.propertyType}</strong> - Sector {property.sector} - {property.title}
          </div>

          {/* Bottom Line: Habitaciones | Baños | Metros */}
          <div className="text-muted-foreground text-[11px] sm:text-xs">
            {property.beds} Habitaciones | {property.baths} Ba&ntilde;os 
            {property.builtArea ? ` | Metros Construido ${property.builtArea}` : (property.landArea ? ` | Metros Terreno ${property.landArea}` : '')}
          </div>
          
        </div>
      </div>
    </Link>
  );
}
