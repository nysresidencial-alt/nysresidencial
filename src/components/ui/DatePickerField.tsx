'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, X } from 'lucide-react'

interface DatePickerFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
}

export function DatePickerField({
  value,
  onChange,
  label,
  placeholder = 'YYYY-MM-DD o DD-MM-YYYY',
  disabled = false,
  required = false,
  name,
  id,
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  // Normalizar valor para el input nativo de tipo date si tiene formato válido
  const nativeDateValue = (() => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    // Si viene como DD-MM-YYYY
    const parts = value.split(/[-/]/)
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
    return ''
  })()

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Input manual de texto */}
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-16 py-2 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
        />

        {/* Botón de limpiar si hay texto */}
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-9 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            title="Limpiar fecha"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Botón disparador de calendario visual */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPicker(!showPicker)}
          className="absolute right-1.5 p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors cursor-pointer"
          title="Abrir calendario"
        >
          <CalendarIcon className="w-4 h-4 text-primary" />
        </button>

        {/* Modal / Popover flotante del calendario */}
        {showPicker && (
          <div className="absolute top-full mt-1.5 right-0 z-50 p-3 bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 min-w-[280px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground">Seleccionar Fecha</span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input nativo de fecha moderno */}
            <div className="space-y-3">
              <input
                type="date"
                value={nativeDateValue}
                onChange={(e) => {
                  onChange(e.target.value)
                  setShowPicker(false)
                }}
                className="w-full p-2.5 text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    onChange(today)
                    setShowPicker(false)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  className="px-3 py-1 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
