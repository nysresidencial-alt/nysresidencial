'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

interface ImageCropperModalProps {
  imageSrc: string
  onClose: () => void
  onCropComplete: (base64Image: string) => void
}

export function ImageCropperModal({
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Cargar imagen
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      // Centrar y ajustar escala inicial
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [imageSrc])

  // Dibujar preview en el canvas interactivo
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width // 360x360
    ctx.clearRect(0, 0, size, size)

    // Guardar contexto
    ctx.save()

    // Mover al centro del canvas
    ctx.translate(size / 2 + position.x, size / 2 + position.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)

    // Dibujar imagen centrada
    const aspect = img.width / img.height
    let drawW = size
    let drawH = size
    if (aspect > 1) {
      drawW = size * aspect
    } else {
      drawH = size / aspect
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }, [position, rotation, scale, imageLoaded])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  // Manejo de arrastrar (Pan / Mover)
  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  // Manejo touch para móviles
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging || e.touches.length !== 1) return
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    })
  }

  function handleTouchEnd() {
    setIsDragging(false)
  }

  // Generar imagen final recortada y comprimida en Base64
  function handleApplyCrop() {
    const img = imageRef.current
    if (!img) return

    const exportSize = 400 // 400x400 px, resolución ideal para web y retina
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = exportSize
    exportCanvas.height = exportSize
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // Factor de escala relativo al canvas de preview (360 -> 400)
    const factor = exportSize / 360

    ctx.save()
    ctx.translate(exportSize / 2 + position.x * factor, exportSize / 2 + position.y * factor)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale * factor, scale * factor)

    const aspect = img.width / img.height
    let drawW = 360
    let drawH = 360
    if (aspect > 1) {
      drawW = 360 * aspect
    } else {
      drawH = 360 / aspect
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    // Exportar comprimido a WebP (con fallback a JPEG)
    let base64 = exportCanvas.toDataURL('image/webp', 0.85)
    if (!base64.startsWith('data:image/webp')) {
      base64 = exportCanvas.toDataURL('image/jpeg', 0.85)
    }

    onCropComplete(base64)
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Acomodar y Recortar Fotografía
              </h3>
              <p className="text-xs text-muted-foreground">
                Arrastra y ajusta el zoom para que el rostro quede perfectamente centrado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Interactivo con Máscara Circular */}
        <div className="p-6 flex flex-col items-center select-none bg-zinc-950/60">
          <div
            className="relative w-[320px] h-[320px] rounded-full overflow-hidden border-4 border-primary shadow-2xl cursor-grab active:cursor-grabbing bg-zinc-900"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              width={360}
              height={360}
              className="w-full h-full pointer-events-none"
            />

            {/* Guía de encuadre */}
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/10 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
            <Move className="w-3.5 h-3.5" />
            <span>Haz clic y arrastra para mover la posición</span>
          </div>
        </div>

        {/* Controles de Zoom y Rotación */}
        <div className="p-6 border-t border-border space-y-4 bg-muted/10 text-xs">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-primary" />
                <span>Zoom / Acercamiento</span>
              </span>
              <span className="text-muted-foreground">{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground cursor-pointer"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.6"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 accent-primary cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground cursor-pointer"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botones de acción rápida: Rotar y Centrar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar 90°</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPosition({ x: 0, y: 0 })
                  setScale(1)
                  setRotation(0)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Centrar</span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground">
              Comprime a WebP para guardado en BD
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Recortar y Guardar Foto</span>
          </button>
        </div>
      </div>
    </div>
  )
}
