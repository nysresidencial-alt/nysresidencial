"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
      <Card className="overflow-hidden h-full flex flex-col group-hover:shadow-2xl transition-all duration-300 border-border/40 shadow-sm bg-card rounded-2xl">
        
        {/* Sección de Imagen */}
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {hasImages ? (
            <Image
              src={property.images[imageIndex]}
              alt={`${property.title} - Imagen ${imageIndex + 1}`}
              fill
              className="object-cover transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">
              Sin foto
            </div>
          )}

          {/* Carrusel Controles (Solo visibles si hay más de 1 imagen y al hacer hover) */}
          {hasImages && property.images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={prevImage}
                disabled={imageIndex === 0}
                className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={nextImage}
                disabled={imageIndex === property.images.length - 1}
                className="bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm disabled:opacity-0 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Etiquetas Superiores */}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[11px] px-2.5 py-0.5 shadow-md">
              {property.operation}
            </Badge>
            <Badge variant="secondary" className="bg-white/95 text-black hover:bg-white font-bold backdrop-blur-md text-[11px] px-2.5 py-0.5 shadow-md">
              {property.propertyType}
            </Badge>
          </div>

          {/* Contador de Fotos */}
          {hasImages && (
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2 py-1 rounded-md flex items-center gap-1.5 shadow-md">
              <ImageIcon className="h-3 w-3" />
              {imageIndex + 1} / {property.images.length}
            </div>
          )}
        </div>

        {/* Sección de Contenido */}
        <CardContent className="p-4 md:p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="font-extrabold text-base md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">
              {property.title}
            </h3>
          </div>
          
          <div className="flex items-center text-muted-foreground mb-4">
            <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-foreground" />
            <span className="text-xs md:text-sm truncate">
              {property.address ? `${property.address}, ` : ''}{property.sector}, {property.city}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-foreground mb-5">
            {(property.beds ?? 0) > 0 && (
              <div className="flex items-center gap-1.5" title="Habitaciones">
                <Bed className="h-4 w-4" />
                <span>{property.beds} Hab</span>
              </div>
            )}
            {(property.baths ?? 0) > 0 && (
              <div className="flex items-center gap-1.5" title="Baños">
                <Bath className="h-4 w-4" />
                <span>{property.baths} Baños</span>
              </div>
            )}
          </div>

          {/* Footer (Precio y Botón) */}
          <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between">
            <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-4">
              Detalles
            </Button>
            <p className="font-black text-lg md:text-xl text-foreground">
              {formatCurrency(property.currency, property.price)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
