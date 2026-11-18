"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Ban, MapPin, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FALLBACK_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

export function PropertyCard({ property }: { property: Property }) {
  const [imgError, setImgError] = useState(false);
  const hasImages = property.images && property.images.length > 0;
  const isUnavailable = property.isAvailable === false;
  const statusLabel = (property.availabilityStatus || "No Disponible").toUpperCase();

  const displayImageSrc = imgError || !hasImages ? FALLBACK_PROPERTY_IMAGE : property.images[0];

  return (
    <Link href={`/propiedades/${property.id}`} className="block h-full group">
      <div 
        className={`flex flex-col h-full border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
          isUnavailable 
            ? 'border-dashed border-rose-300 dark:border-rose-900/60 bg-muted/40 opacity-60 hover:opacity-95' 
            : 'border-border bg-card hover:border-primary/40'
        }`}
      >
        
        {/* Sección de Imagen */}
        <div className="relative h-48 sm:h-52 w-full bg-muted overflow-hidden">
          <Image
            src={displayImageSrc}
            alt={property.title}
            fill
            unoptimized
            onError={() => setImgError(true)}
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
              isUnavailable ? 'grayscale-[60%] contrast-75 brightness-90' : ''
            }`}
          />

          {/* Badges de Operación y Estado (Top Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
            <Badge className="bg-background/90 text-foreground backdrop-blur border-none font-semibold text-xs shadow-sm">
              {property.operation}
            </Badge>
            {property.status && (
              <Badge variant="secondary" className="bg-primary/90 text-primary-foreground backdrop-blur border-none font-semibold text-xs shadow-sm">
                {property.status}
              </Badge>
            )}
          </div>

          {/* Sello de agua NYS (Top Right cuando está disponible) */}
          {!isUnavailable && (
            <div className="absolute top-3 right-3 bg-background/90 dark:bg-background/80 px-2 py-1 rounded-md shadow-sm z-10 flex items-center justify-center">
              <div className="relative h-3.5 w-6">
                <Image
                  src="/logo-nys.png"
                  alt="NyS"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Banner central prominente cuando NO está disponible */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center z-10 pointer-events-none">
              <span className="px-3.5 py-1.5 text-xs font-black tracking-wider text-white bg-rose-950/95 border border-rose-500/70 rounded-full shadow-lg uppercase flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{statusLabel}</span>
              </span>
            </div>
          )}
        </div>

        {/* Sección de Contenido */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            {/* Ubicación y Badge de Estado */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
              <div className="flex items-center truncate">
                <MapPin className="h-3 w-3 mr-1 shrink-0 text-primary" />
                <span className="truncate">{property.sector}, {property.city}</span>
              </div>
              {isUnavailable && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  {statusLabel}
                </span>
              )}
            </div>

            {/* Título de la propiedad */}
            <h3 className="font-bold text-base leading-tight mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {property.title}
            </h3>

            {/* Características (Habitaciones, Baños, Metros) */}
            <div className="text-muted-foreground text-xs mb-3 flex items-center gap-2 flex-wrap">
              {Boolean(property.beds && property.beds > 0) && <span>{property.beds} Hab.</span>}
              {Boolean(property.beds && property.beds > 0 && property.baths && property.baths > 0) && <span>•</span>}
              {Boolean(property.baths && property.baths > 0) && <span>{property.baths} Baños</span>}
              {Boolean(((property.builtArea && property.builtArea > 0) || (property.landArea && property.landArea > 0)) && (property.beds || property.baths)) && <span>•</span>}
              {property.builtArea && property.builtArea > 0 ? (
                <span>{property.builtArea} m² constr.</span>
              ) : property.landArea && property.landArea > 0 ? (
                <span>{property.landArea} m² terr.</span>
              ) : null}
            </div>
          </div>

          {/* Precio y Tipo */}
          <div className="pt-3 border-t border-border flex items-baseline justify-between mt-auto">
            <div>
              <p className="text-lg sm:text-xl font-black text-foreground">
                {formatCurrency(property.currency, property.price)}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">
                {property.propertyType}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
