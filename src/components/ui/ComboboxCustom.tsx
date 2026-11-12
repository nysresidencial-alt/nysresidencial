'use client'

import React, { useState } from 'react'
import { Edit2, Check } from 'lucide-react'

interface ComboboxCustomProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  customPlaceholder?: string
  required?: boolean
  disabled?: boolean
  id?: string
}

export function ComboboxCustom({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  customPlaceholder = 'Escribe un valor personalizado...',
  required = false,
  disabled = false,
  id,
}: ComboboxCustomProps) {
  // Determinar si el valor actual coincide con una de las opciones predefinidas
  const isPredefined = options.includes(value)
  const [isCustomMode, setIsCustomMode] = useState(!isPredefined && value.trim() !== '')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-foreground flex items-center justify-between">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {!isCustomMode ? (
        <div className="flex gap-2">
          <select
            id={id}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value === '__CUSTOM__') {
                setIsCustomMode(true)
                onChange('')
              } else {
                onChange(e.target.value)
              }
            }}
            className="flex-1 py-2 px-3 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__CUSTOM__" className="font-semibold text-primary">
              ✏️ Otro / Personalizado...
            </option>
          </select>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsCustomMode(true)}
            className="px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted border border-border rounded-xl transition-colors cursor-pointer shrink-0"
            title="Escribir texto personalizado"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2 animate-in fade-in duration-150">
          <input
            id={id}
            type="text"
            value={value}
            disabled={disabled}
            placeholder={customPlaceholder}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            className="flex-1 py-2 px-3 text-sm bg-background border border-primary/40 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsCustomMode(false)
              if (!options.includes(value)) {
                onChange(options[0] || '')
              }
            }}
            className="px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Volver a lista desplegable"
          >
            Lista
          </button>
        </div>
      )}
    </div>
  )
}
