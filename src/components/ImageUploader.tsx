"use client";

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/utils/supabase/client';
import imageCompression from 'browser-image-compression';
import { X, UploadCloud, GripHorizontal, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SortableImageProps {
  url: string;
  index: number;
  onRemove: () => void;
}

function SortableImage({ url, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group aspect-video rounded-xl overflow-hidden border-2 ${index === 0 ? 'border-primary' : 'border-border'} bg-muted shadow-sm`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing hover:bg-black/10 transition-colors"
      />
      
      <Image src={url} alt="Vista previa" fill className="object-cover" />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {index === 0 && (
        <Badge className="absolute top-2 left-2 z-20 pointer-events-none bg-primary hover:bg-primary text-primary-foreground font-bold shadow-md">
          Portada
        </Badge>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 z-30 bg-black/60 hover:bg-destructive text-white rounded-full p-1.5 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        title="Eliminar imagen"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none flex items-center gap-1 text-xs backdrop-blur-sm">
        <GripHorizontal className="w-3 h-3" />
        Mover
      </div>
    </div>
  );
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const removeImage = (urlToRemove: string) => {
    // Optionally delete from Supabase storage here, but for safety usually best to just remove from DB array
    // and let a cron job clean up orphans, or explicit delete.
    onChange(images.filter((url) => url !== urlToRemove));
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Optimización de la imagen
        const options = {
          maxSizeMB: 1, // Max 1MB
          maxWidthOrHeight: 1920, // Max Full HD
          useWebWorker: true,
          fileType: 'image/webp' // Convertir a WebP para mayor compresión sin perder calidad
        };
        
        const compressedFile = await imageCompression(file, options);
        
        // Generar nombre único
        const fileExt = 'webp';
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        // Subir a Supabase
        const { data, error } = await supabase.storage
          .from('properties')
          .upload(filePath, compressedFile, {
            cacheControl: '31536000',
            upsert: false
          });

        if (error) throw error;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('properties')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      onChange([...images, ...newUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Hubo un error al subir las imágenes.');
    } finally {
      setIsUploading(false);
      // Limpiar input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Zona de subida */}
      <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={uploadImages}
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center text-primary">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-medium">Optimizando y subiendo imágenes...</p>
            <p className="text-sm text-muted-foreground mt-1">Por favor espera, no cierres esta ventana.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <UploadCloud className="w-10 h-10 mb-4 text-primary/80" />
            <p className="font-semibold text-foreground">Haz clic o arrastra imágenes aquí</p>
            <p className="text-sm mt-2">Soporta JPG, PNG, WEBP (Se optimizarán automáticamente a WebP)</p>
          </div>
        )}
      </div>

      {/* Galería ordenable */}
      {images.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Arrastra las imágenes para reordenarlas. La primera será la <strong>Portada</strong>.</span>
            <span className="font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{images.length} fotos</span>
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((url, index) => (
                  <SortableImage
                    key={url}
                    url={url}
                    index={index}
                    onRemove={() => removeImage(url)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
