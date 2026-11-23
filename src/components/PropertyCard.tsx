"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Ban } from "lucide-react";

const FALLBACK_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

export function PropertyCard({ property }: { property: Property }) {
  const [imgError, setImgError] = useState(false);
  const hasImages = property.images && property.images.length > 0;
  const isUnavailable = property.isAvailable === false;
  const statusLabel = (property.availabilityStatus || "No Disponible").toUpperCase();

  // Formato similar a "UF: 15.000"
  const formattedPrice = formatCurrency(property.currency, property.price)
    .replace('UF', '')
    .replace('CLP', '')
    .trim();

  const displayImageSrc = imgError || !hasImages ? FALLBACK_PROPERTY_IMAGE : property.images[0];

  // Construir línea inferior con características separadas por "|"
  const specs: string[] = [];
  if (property.beds && property.beds > 0) {
    specs.push(`${property.beds} Habitaciones`);
  }
  if (property.baths && property.baths > 0) {
    specs.push(`${property.baths} Baños`);
  }
  if (property.builtArea && property.builtArea > 0) {
    specs.push(`Metros Construido ${property.builtArea}`);
  } else if (property.landArea && property.landArea > 0) {
    specs.push(`Metros Terreno ${property.landArea}`);
  }

  return (
    <Link href={`/propiedades/${property.id}`} className="block h-full group">
      <div 
        className={`flex flex-row h-full bg-card dark:bg-card border transition-all duration-200 ${
          isUnavailable 
            ? 'border-dashed border-rose-300 dark:border-rose-900/50 opacity-60 hover:opacity-85 bg-muted/40' 
            : 'border-border hover:bg-muted dark:hover:bg-muted'
        }`}
      >
        
        {/* Sección de Imagen */}
        <div className="relative w-[130px] sm:w-[160px] xl:w-[180px] shrink-0 bg-muted overflow-hidden">
          <Image
            src={displayImageSrc}
            alt={property.title}
            fill
            unoptimized
            onError={() => setImgError(true)}
            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
              isUnavailable ? 'grayscale-[60%] contrast-75 brightness-90' : ''
            }`}
          />

          {/* Overlay translúcido oscuro si NO está disponible */}
          {isUnavailable ? (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center z-10">
              <span className="px-2 py-1 text-[10px] sm:text-xs font-black tracking-widest text-white bg-rose-950/90 border border-rose-500/60 rounded shadow-lg uppercase flex items-center gap-1">
                <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                <span>{statusLabel}</span>
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
          
          {/* Title Line: Tipo - Sector - Dirección / Título */}
          <div className="text-foreground text-[13px] sm:text-sm mb-1 sm:mb-2 line-clamp-2">
            <strong className="font-bold">{property.propertyType}</strong>
            {property.sector ? ` - Sector ${property.sector}` : ''}
            {property.title ? ` - ${property.title}` : ''}
          </div>

          {/* Bottom Line: Habitaciones | Baños | Metros */}
          {specs.length > 0 && (
            <div className="text-muted-foreground text-[11px] sm:text-xs truncate">
              {specs.join(' | ')}
            </div>
          )}
          
        </div>
      </div>
    </Link>
  );
}
