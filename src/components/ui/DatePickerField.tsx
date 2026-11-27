'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CalendarCheck,
} from 'lucide-react'

export interface DatePickerFieldProps {
  value: string | null | undefined
  onChange: (isoDateString: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  compact?: boolean
  showStatusIndicator?: boolean
  className?: string
  id?: string
  name?: string
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

/**
 * Parsea fechas en formatos variados:
 * DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DDMMYYYY, ISO strings
 */
export function parseFlexibleDate(str: string | null | undefined): Date | null {
  if (!str || !str.trim() || str === 'null') return null
  const s = str.trim()

  // 1. Formato YYYY-MM-DD (ISO)
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (iso) {
    const y = parseInt(iso[1], 10)
    const m = parseInt(iso[2], 10) - 1
    const d = parseInt(iso[3], 10)
    if (isValidDate(y, m, d)) return new Date(y, m, d)
  }

  // 2. Formato DD/MM/YYYY o DD-MM-YYYY o DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)
  if (dmy) {
    const d = parseInt(dmy[1], 10)
    const m = parseInt(dmy[2], 10) - 1
    let y = parseInt(dmy[3], 10)
    if (y < 100) y = y > 50 ? 1900 + y : 2000 + y
    if (isValidDate(y, m, d)) return new Date(y, m, d)
  }

  // 3. Formato 8 dígitos seguidos DDMMYYYY (ej. 19122019)
  const d8 = s.match(/^(\d{2})(\d{2})(\d{4})$/)
  if (d8) {
    const d = parseInt(d8[1], 10)
    const m = parseInt(d8[2], 10) - 1
    const y = parseInt(d8[3], 10)
    if (isValidDate(y, m, d)) return new Date(y, m, d)
  }

  // Intento estándar
  const fallback = new Date(s)
  return isNaN(fallback.getTime()) ? null : fallback
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (y < 1970 || y > 2100) return false
  if (m < 0 || m > 11) return false
  if (d < 1 || d > 31) return false
  const dt = new Date(y, m, d)
  return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
}

export function toIsoDate(d: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function toDisplayDate(d: Date | null): string {
  if (!d) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const y = d.getFullYear()
  return `${day}/${m}/${y}`
}

export function DatePickerField({
  value,
  onChange,
  label,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  required = false,
  compact = false,
  showStatusIndicator = false,
  className = '',
  id,
  name,
}: DatePickerFieldProps) {
  const [mounted, setMounted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Parsear la fecha actual recibida por props
  const parsedDate = parseFlexibleDate(value)

  // Estado del texto escrito directamente en el input
  const [inputText, setInputText] = useState(parsedDate ? toDisplayDate(parsedDate) : '')

  // Estado del mes y año que se está visualizando en el calendario
  const [viewYear, setViewYear] = useState<number>(() => {
    return parsedDate ? parsedDate.getFullYear() : new Date().getFullYear()
  })
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return parsedDate ? parsedDate.getMonth() : new Date().getMonth()
  })

  // Sincronizar input cuando cambie la prop value externamente
  useEffect(() => {
    const p = parseFlexibleDate(value)
    setInputText(p ? toDisplayDate(p) : '')
    if (p) {
      setViewYear(p.getFullYear())
      setViewMonth(p.getMonth())
    }
  }, [value])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Al abrir el modal, situar el calendario en la fecha del valor o en la fecha actual
  function handleOpenModal() {
    if (disabled) return
    const p = parseFlexibleDate(value)
    if (p) {
      setViewYear(p.getFullYear())
      setViewMonth(p.getMonth())
    } else {
      const now = new Date()
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
    }
    setShowModal(true)
  }

  // Confirmar y aplicar fecha tipeada al salir del campo o presionar Enter
  function handleCommitText() {
    const trimmed = inputText.trim()
    if (!trimmed) {
      if (value) {
        onChange('')
      }
      return
    }

    const parsed = parseFlexibleDate(trimmed)
    if (parsed) {
      const iso = toIsoDate(parsed)
      setInputText(toDisplayDate(parsed))
      if (iso !== value) {
        onChange(iso)
      }
    } else {
      // Si el texto no es fecha válida, revertir a la fecha anterior
      setInputText(parsedDate ? toDisplayDate(parsedDate) : '')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommitText()
      ;(e.target as HTMLInputElement).blur()
    } else if (e.key === 'Escape') {
      setInputText(parsedDate ? toDisplayDate(parsedDate) : '')
      ;(e.target as HTMLInputElement).blur()
    }
  }

  // Navegación de mes en el calendario
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  // Selección de un día específico en el calendario
  function handleSelectDay(day: number) {
    const selected = new Date(viewYear, viewMonth, day)
    const iso = toIsoDate(selected)
    setInputText(toDisplayDate(selected))
    setShowModal(false)
    onChange(iso)
  }

  // Botón "Hoy"
  function handleSelectToday() {
    const today = new Date()
    const iso = toIsoDate(today)
    setInputText(toDisplayDate(today))
    setShowModal(false)
    onChange(iso)
  }

  // Botón "Quitar fecha"
  function handleClearDate() {
    setInputText('')
    setShowModal(false)
    onChange('')
  }

  // Generación de días del mes
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  // Ajuste para que Lunes = 0, ..., Domingo = 6
  const startOffset = (firstDayOfWeek + 6) % 7

  // Rango de años para selector rápido (desde 2005 a 2035)
  const currentYearNumber = new Date().getFullYear()
  const yearOptions: number[] = []
  for (let y = 2005; y <= currentYearNumber + 10; y++) {
    yearOptions.push(y)
  }

  const today = new Date()
  const isCurrentMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth
  const todayDateNumber = today.getDate()

  const isCurrentMonthSelected =
    parsedDate && parsedDate.getFullYear() === viewYear && parsedDate.getMonth() === viewMonth
  const selectedDayNumber = parsedDate ? parsedDate.getDate() : null

  return (
    <div className={`relative ${compact ? '' : 'space-y-1.5'} ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Contenedor del input con icono de calendario */}
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          value={inputText}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setInputText(e.target.value)}
          onBlur={handleCommitText}
          onKeyDown={handleKeyDown}
          title="Escribe una fecha directamente (ej: 19/12/2019) o haz clic en el calendario"
          className={`w-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            compact
              ? `py-1 pl-2.5 pr-8 text-xs rounded-lg border ${
                  showStatusIndicator && !value
                    ? 'border-amber-400 bg-amber-50/80 text-slate-900 placeholder:text-slate-500 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-600'
                    : 'border-border bg-background text-foreground hover:border-primary/50'
                }`
              : `py-2 pl-3 pr-9 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary`
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />

        {/* Botón para abrir el Modal de Calendario */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleOpenModal}
          className={`absolute right-1 p-1 text-muted-foreground hover:text-primary hover:bg-muted/70 rounded-md transition-colors cursor-pointer ${
            compact ? 'p-1' : 'p-1.5'
          }`}
          title="Abrir calendario interactivo"
        >
          <CalendarIcon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-primary`} />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE CALENDARIO FLOTANTE Y CENTRADO CON BACKDROP */}
      {/* ======================================================== */}
      {showModal &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0"
              onClick={() => setShowModal(false)}
              aria-hidden="true"
            />

            {/* Tarjeta del Calendario */}
            <div className="relative z-10 w-full max-w-[340px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150">
              {/* Header del Calendario */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground leading-tight">
                      Seleccionar Fecha
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {label || 'Haz clic en el día deseado'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                  title="Cerrar calendario"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Controles de Navegación de Mes y Año */}
              <div className="flex items-center justify-between gap-1 bg-muted/30 p-1.5 rounded-2xl border border-border/60">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {/* Selector de Mes */}
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                    className="text-xs font-bold bg-card border border-border/80 text-foreground rounded-xl py-1 px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {MONTH_NAMES.map((mName, idx) => (
                      <option key={mName} value={idx} className="bg-card text-foreground">
                        {mName}
                      </option>
                    ))}
                  </select>

                  {/* Selector de Año */}
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                    className="text-xs font-bold bg-card border border-border/80 text-foreground rounded-xl py-1 px-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y} className="bg-card text-foreground">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK_DAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-[10px] font-extrabold uppercase text-muted-foreground py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Cuadrícula de días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {/* Espacios vacíos antes del día 1 */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}

                {/* Días 1 al último día del mes */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1
                  const isSelected = isCurrentMonthSelected && selectedDayNumber === dayNum
                  const isToday = isCurrentMonthToday && todayDateNumber === dayNum

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`h-8 w-8 mx-auto rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-black shadow-md scale-105 ring-2 ring-primary/40'
                          : isToday
                          ? 'border border-primary text-primary font-bold hover:bg-primary/10'
                          : 'text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {dayNum}
                    </button>
                  )
                })}
              </div>

              {/* Acciones Rápidas Inferiores */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <button
                  type="button"
                  onClick={handleClearDate}
                  className="text-muted-foreground hover:text-rose-600 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                >
                  Quitar fecha
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectToday}
                    className="px-3 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold transition-all cursor-pointer"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1 rounded-xl bg-muted text-muted-foreground hover:text-foreground font-semibold transition-all cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
