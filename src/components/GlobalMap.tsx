"use client";

import dynamic from "next/dynamic";
import { Property } from "@prisma/client";
import { Loader2 } from "lucide-react";

// Dynamic import of the map component to disable SSR
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-2xl border border-border">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p>Cargando mapa interactivo...</p>
      </div>
    </div>
  ),
});

interface GlobalMapProps {
  properties: Property[];
}

export function GlobalMap({ properties }: GlobalMapProps) {
  return (
    <div className="w-full h-[500px] md:h-[600px] z-0">
      <MapComponent properties={properties} />
    </div>
  );
}
