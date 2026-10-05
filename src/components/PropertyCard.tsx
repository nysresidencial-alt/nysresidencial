"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, ChevronLeft, ChevronRight, ImageIcon, Heart, ChevronRight as ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";

export function PropertyCard({ property }: { property: Property }) {
  const [imageIndex, setImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (property.images && imageIndex < property.images.length - 1) {
      setImageIndex((prev) => prev + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (property.images && imageIndex > 0) {
      setImageIndex((prev) => prev - 1);
    }
  };

  const hasImages = property.images && property.images.length > 0;

  return (
    <Link href={`/propiedades/${property.id}`} className="block group h-full">
      <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        
        {/* Sección de Imagen (Arriba) */}
        <div className="relative w-full aspect-[4/3] shrink-0 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          {hasImages ? (
            <Image
              src={property.images[imageIndex]}
              alt={`${property.title} - Imagen ${imageIndex + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
              Sin foto
            </div>
          )}

          {/* Carrusel Controles */}
          {hasImages && property.images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={prevImage}
                disabled={imageIndex === 0}
                className="bg-white/90 hover:bg-white text-black p-1.5 rounded-full shadow-md disabled:opacity-0 transition-all scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={nextImage}
                disabled={imageIndex === property.images.length - 1}
                className="bg-white/90 hover:bg-white text-black p-1.5 rounded-full shadow-md disabled:opacity-0 transition-all scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Etiquetas Top Left */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap z-10">
            <Badge variant="default" className="bg-[#FF385C] hover:bg-[#FF385C]/90 text-white font-bold text-[10px] px-2.5 py-0.5 shadow-sm border-none rounded-full">
              {property.operation}
            </Badge>
            <Badge variant="secondary" className="bg-white/95 text-black hover:bg-white font-bold backdrop-blur-md text-[10px] px-2.5 py-0.5 shadow-sm border-none rounded-full">
              {property.propertyType}
            </Badge>
          </div>

          {/* Favorito Top Right */}
          <button className="absolute top-3 right-3 bg-white p-1.5 rounded-full shadow-sm hover:scale-110 transition-transform z-10" onClick={(e) => e.preventDefault()}>
            <Heart className="h-4 w-4 text-zinc-700" />
          </button>

          {/* Contador de Fotos */}
          {hasImages && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 z-10">
              <ImageIcon className="h-3 w-3" />
              {imageIndex + 1}/{property.images.length}
            </div>
          )}
        </div>

        {/* Sección de Contenido (Abajo) */}
        <div className="flex-1 p-4 flex flex-col min-w-0">
          
          <div className="mb-3">
            <div className="flex items-center text-muted-foreground mb-1">
              <MapPin className="h-3 w-3 mr-1 shrink-0" />
              <span className="text-[10px] font-bold tracking-wider uppercase truncate">
                {property.sector}, {property.city}
              </span>
            </div>
            
            <h3 className="font-extrabold text-lg text-foreground line-clamp-1 leading-tight">
              {property.title}
            </h3>
          </div>

          {/* Features Row */}
          <div className="flex items-center justify-between text-muted-foreground py-3 border-y border-border/40 mt-auto mb-3">
            {(property.beds ?? 0) > 0 && (
              <div className="flex items-center gap-1.5" title="Dormitorios">
                <Bed className="h-4 w-4 stroke-[1.5]" />
                <span className="text-xs font-bold text-foreground">{property.beds} <span className="font-normal text-[10px] uppercase text-muted-foreground hidden sm:inline-block">Dorm</span></span>
              </div>
            )}
            
            {(property.baths ?? 0) > 0 && (
              <>
                <div className="w-px h-4 bg-border/50 shrink-0" />
                <div className="flex items-center gap-1.5" title="Baños">
                  <Bath className="h-4 w-4 stroke-[1.5]" />
                  <span className="text-xs font-bold text-foreground">{property.baths} <span className="font-normal text-[10px] uppercase text-muted-foreground hidden sm:inline-block">Baños</span></span>
                </div>
              </>
            )}

            {(property.builtArea ?? 0) > 0 && (
              <>
                <div className="w-px h-4 bg-border/50 shrink-0" />
                <div className="flex items-center gap-1.5" title="Superficie">
                  <Square className="h-4 w-4 stroke-[1.5]" />
                  <span className="text-xs font-bold text-foreground">{property.builtArea} <span className="font-normal text-[10px] uppercase text-muted-foreground">m²</span></span>
                </div>
              </>
            )}
          </div>

          {/* Footer (Precio y Botón) */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <div>
              <p className="font-black text-xl tracking-tight text-foreground leading-none mb-1">
                {formatCurrency(property.currency, property.price)}
              </p>
            </div>
            <div className="bg-[#0f172a] dark:bg-primary hover:bg-[#1e293b] dark:hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shrink-0">
              Ver
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
