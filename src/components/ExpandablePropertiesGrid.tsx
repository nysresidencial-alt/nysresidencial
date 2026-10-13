"use client";

import { useState } from "react";
import Link from "next/link";
import { Property } from "@prisma/client";
import { PropertyCard } from "./PropertyCard";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

interface ExpandablePropertiesGridProps {
  title: string;
  description?: string;
  properties: Property[];
  linkHref?: string;
  bgColor?: string;
  initialCount?: number;
}

export function ExpandablePropertiesGrid({
  title,
  description,
  properties,
  linkHref,
  bgColor = "bg-white",
  initialCount = 6,
}: ExpandablePropertiesGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (properties.length === 0) return null;

  const visibleProperties = properties.slice(0, initialCount);
  const extraProperties = properties.slice(initialCount);
  const hasExtra = extraProperties.length > 0;

  return (
    <section className={`py-8 ${bgColor}`}>
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        
        {/* Cabecera sin el botón de 'Ver más' en la esquina */}
        <div className="border-b border-border mb-4 pb-2 flex justify-between items-end">
          <h2 className="text-primary text-xl sm:text-2xl font-normal">
            {title}
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {properties.length} {properties.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        </div>

        {description && (
          <p className="text-muted-foreground text-sm mb-6">
            {description}
          </p>
        )}

        {/* Primera tanda de propiedades (visible inicialmente) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
          {visibleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        {/* Tanda adicional con transición suave hacia abajo (Accordion Smooth Effect) */}
        {hasExtra && (
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
              isExpanded 
                ? "grid-rows-[1fr] opacity-100 mt-4" 
                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 pt-1">
                {extraProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botón 'Ver más' centrado abajo con animación hacia abajo */}
        <div className="mt-8 flex flex-col items-center justify-center gap-2">
          {hasExtra ? (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-semibold text-primary hover:text-white bg-primary/10 hover:bg-primary border border-primary/30 hover:border-primary rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>{isExpanded ? "Ver menos" : "Ver más"}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 transition-transform duration-300" />
              ) : (
                <ChevronDown className="w-4 h-4 transition-transform duration-300 animate-bounce" />
              )}
            </button>
          ) : linkHref ? (
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Ver todas en el catálogo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}

          {hasExtra && isExpanded && linkHref && (
            <Link
              href={linkHref}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 flex items-center gap-1 mt-1"
            >
              Explorar todo el catálogo con filtros avanzados <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

      </div>
    </section>
  );
}
