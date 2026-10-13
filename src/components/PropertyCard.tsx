"use client";

import Image from "next/image";
import Link from "next/link";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

export function PropertyCard({ property }: { property: Property }) {
  const hasImages = property.images && property.images.length > 0;
  const isUnavailable = property.isAvailable === false;
  const statusLabel = (property.availabilityStatus || "No Disponible").toUpperCase();

  // Formato similar a "UF: 15.000"
  const formattedPrice = formatCurrency(property.currency, property.price)
    .replace('UF', '')
    .replace('CLP', '')
    .trim();

  return (
    <Link href={`/propiedades/${property.id}`} className="block h-full group">
      <div 
        className={`flex flex-row h-full bg-card dark:bg-card border transition-all duration-200 ${
          isUnavailable 
            ? 'border-border/70 opacity-85 hover:opacity-100 bg-muted/30' 
            : 'border-border hover:bg-muted dark:hover:bg-muted'
        }`}
      >
        
        {/* Sección de Imagen */}
        <div className="relative w-[130px] sm:w-[160px] xl:w-[180px] shrink-0 bg-muted overflow-hidden">
          {hasImages ? (
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                isUnavailable ? 'grayscale-[35%]' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              Sin foto
            </div>
          )}

          {/* Overlay translúcido oscuro si NO está disponible */}
          {isUnavailable ? (
            <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center z-10">
              <span className="px-2 py-1 text-[11px] sm:text-xs font-black tracking-widest text-white bg-red-950/80 border border-red-500/40 rounded shadow-lg uppercase">
                {statusLabel}
              </span>
            </div>
          ) : (
            /* Sello de agua NYS oficial */
            <div className="absolute top-2 left-2 bg-background/90 dark:bg-background/80 px-1 py-0.5 rounded shadow-sm z-10 flex items-center justify-center">
              <div className="relative h-3 w-5">
                <Image
                  src="/logo-nys.png"
                  alt="NyS"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sección de Contenido */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
          
          {/* Top Line: Ubicación | Operación | Precio */}
          <div className="flex items-center gap-1.5 text-[13px] sm:text-sm font-medium mb-1 truncate">
            {isUnavailable && (
              <span className="inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-amber-400/30 shrink-0">
                {statusLabel}
              </span>
            )}
            <span className="text-primary truncate">
              {property.city} | {property.operation} | {property.currency}: {formattedPrice}
            </span>
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
