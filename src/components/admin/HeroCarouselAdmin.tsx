"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { saveHeroCarousel } from "@/app/admin/carrusel/actions";

interface HeroImage {
  id: string;
  url: string;
  order: number;
}

export function HeroCarouselAdmin({ initialImages }: { initialImages: HeroImage[] }) {
  const [images, setImages] = useState<string[]>(initialImages.map((img) => img.url));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveHeroCarousel(images);
      window.alert("Carrusel actualizado. Las imágenes de inicio se han guardado correctamente.");
    } catch (error) {
      console.error(error);
      window.alert("Error al guardar: Hubo un problema al actualizar el carrusel.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Imágenes del Carrusel</h2>
          <p className="text-sm text-muted-foreground">La primera imagen será la que cargue inicialmente.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </Button>
      </div>

      <ImageUploader images={images} onChange={setImages} />
      
      <div className="bg-blue-500/10 text-blue-500 p-4 rounded-lg text-sm flex gap-3">
        <div className="font-bold">💡 Tip:</div>
        <div>
          Te recomendamos usar imágenes horizontales (panorámicas) de alta calidad. 
          El sistema las optimizará automáticamente para que carguen rápido, pero el formato apaisado es ideal para la portada.
        </div>
      </div>
    </div>
  );
}
