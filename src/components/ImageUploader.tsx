"use client";

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/utils/supabase/client';
import imageCompression from 'browser-image-compression';
import { X, UploadCloud, GripHorizontal, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      className={`relative group aspect-[4/3] rounded-xl overflow-hidden border-2 ${index === 0 ? 'border-primary' : 'border-border'} bg-muted shadow-sm`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing hover:bg-black/10 transition-colors"
      />
      
      <Image src={url} alt="Vista previa" fill unoptimized className="object-cover" />
      
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
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fileName?: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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
    onChange(images.filter((url) => url !== urlToRemove));
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    const totalFiles = files.length;
    const newUrls: string[] = [];
    const failedFiles: string[] = [];

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];

        setUploadProgress({
          current: i + 1,
          total: totalFiles,
          fileName: file.name,
        });

        // 1. Optimización de la imagen
        let fileToUpload: File | Blob = file;
        let fileExt = 'webp';

        try {
          const options = {
            maxSizeMB: 1, // Max 1MB
            maxWidthOrHeight: 1920, // Max Full HD
            useWebWorker: true,
            fileType: 'image/webp' as const,
            initialQuality: 0.85,
          };
          fileToUpload = await imageCompression(file, options);
          fileExt = 'webp';
        } catch (compressionErr) {
          console.warn(`Compresión omitida para ${file.name}, subiendo original:`, compressionErr);
          fileToUpload = file;
          const extMatch = file.name.split('.').pop()?.toLowerCase();
          fileExt = extMatch && ['jpg', 'jpeg', 'png', 'webp'].includes(extMatch) ? extMatch : 'jpg';
        }

        // 2. Generar nombre único
        const randomHash = Math.random().toString(36).substring(2, 12);
        const fileName = `${randomHash}_${Date.now()}.${fileExt}`;
        const filePath = `properties/${fileName}`;

        // 3. Subir a Supabase
        try {
          const { error } = await supabase.storage
            .from('properties')
            .upload(filePath, fileToUpload, {
              cacheControl: '31536000',
              upsert: true,
              contentType: fileExt === 'webp' ? 'image/webp' : file.type || 'image/jpeg',
            });

          if (error) {
            console.error(`Error al subir ${file.name}:`, error);
            failedFiles.push(file.name);
            continue;
          }

          // 4. Obtener URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('properties')
            .getPublicUrl(filePath);

          if (publicUrl) {
            newUrls.push(publicUrl);
          }
        } catch (subErr) {
          console.error(`Error inesperado con ${file.name}:`, subErr);
          failedFiles.push(file.name);
        }
      }

      // Añadir las fotos que se subieron con éxito
      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }

      // Mensajes de resultado
      if (failedFiles.length > 0) {
        if (newUrls.length > 0) {
          setUploadError(`Se subieron ${newUrls.length} de ${totalFiles} imágenes. No se pudieron subir: ${failedFiles.join(', ')}.`);
        } else {
          setUploadError(`No se pudieron subir las imágenes seleccionadas. Por favor verifica tu conexión.`);
        }
      } else {
        setUploadSuccessMessage(
          totalFiles === 1
            ? '¡1 imagen optimizada y subida correctamente!'
            : `¡${totalFiles} imágenes optimizadas y subidas correctamente!`
        );
        setTimeout(() => setUploadSuccessMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error general al subir imágenes:', error);
      setUploadError(error?.message || 'Hubo un error al procesar las imágenes.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerta de Error */}
      {uploadError && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Atención al subir imágenes</p>
            <p className="text-xs mt-0.5 opacity-90">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-destructive/70 hover:text-destructive text-xs underline font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Alerta de Éxito */}
      {uploadSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-semibold text-xs">{uploadSuccessMessage}</p>
        </div>
      )}

      {/* Zona de subida */}
      <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-card hover:bg-accent/50 transition-colors">
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={uploadImages}
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center text-primary w-full max-w-sm px-4">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="font-bold text-sm">
              {uploadProgress
                ? `Optimizando y subiendo foto ${uploadProgress.current} de ${uploadProgress.total}...`
                : 'Optimizando y subiendo imágenes...'}
            </p>
            {uploadProgress && (
              <div className="w-full bg-muted border border-border rounded-full h-2.5 overflow-hidden my-2.5">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Por favor espera, no cierres esta ventana. Convirtiendo a WebP ligero de alta calidad.
            </p>
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
