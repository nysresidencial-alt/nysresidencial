'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatVoucherHeaderDate } from '@/lib/voucher-pdf'

interface VoucherDatePickerProps {
  value: string // Formato DD/MM/AAAA
  onChange: (newDate: string) => void
  label?: string
  fallbackMonth?: string
  fallbackYear?: number
  defaultCartolaDate?: string | null
}

const SPANISH_MONTHS = [
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

const DAYS_OF_WEEK = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export function VoucherDatePicker({
  value,
  onChange,
  label = 'Fecha de Emisión / Pago en Comprobante',
  fallbackMonth = 'NOVIEMBRE',
  fallbackYear = 2026,
  defaultCartolaDate,
}: VoucherDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Extraer mes y año actuales para navegación del calendario
  const parsedParts = (value || '').split('/')
  const initialMonthIdx =
    parsedParts.length === 3 && Number(parsedParts[1]) >= 1 && Number(parsedParts[1]) <= 12
      ? Number(parsedParts[1]) - 1
      : new Date().getMonth()
  const initialYearNum =
    parsedParts.length === 3 && Number(parsedParts[2]) >= 2000
      ? Number(parsedParts[2])
      : fallbackYear || new Date().getFullYear()

  const [calendarMonth, setCalendarMonth] = useState<number>(initialMonthIdx)
  const [calendarYear, setCalendarYear] = useState<number>(initialYearNum)

  // Sincronizar mes/año cuando cambie value externamente
  useEffect(() => {
    if (value && value.includes('/')) {
      const parts = value.split('/')
      if (parts.length === 3) {
        const m = Number(parts[1]) - 1
        const y = Number(parts[2])
        if (!isNaN(m) && m >= 0 && m <= 11) setCalendarMonth(m)
        if (!isNaN(y) && y >= 2000) setCalendarYear(y)
      }
    }
  }, [value])

  // Cerrar calendario si hace clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Escritura manual con auto-slashes
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw.includes('/')) {
      const sanitized = raw.replace(/[^\d/]/g, '').slice(0, 10)
      onChange(sanitized)
      return
    }

    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) {
      onChange(digits)
    } else if (digits.length <= 4) {
      onChange(`${digits.slice(0, 2)}/${digits.slice(2)}`)
    } else {
      onChange(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`)
    }
  }

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((y) => y - 1)
    } else {
      setCalendarMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((y) => y + 1)
    } else {
      setCalendarMonth((m) => m + 1)
    }
  }

  function selectDay(day: number) {
    const dStr = String(day).padStart(2, '0')
    const mStr = String(calendarMonth + 1).padStart(2, '0')
    const yStr = String(calendarYear)
    onChange(`${dStr}/${mStr}/${yStr}`)
    setShowCalendar(false)
  }

  function setQuick(type: 'today' | 'day5' | 'cartola') {
    const now = new Date()
    if (type === 'today') {
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = String(now.getFullYear())
      onChange(`${d}/${m}/${y}`)
      setCalendarMonth(now.getMonth())
      setCalendarYear(now.getFullYear())
    } else if (type === 'day5') {
      const mStr = String(calendarMonth + 1).padStart(2, '0')
      onChange(`05/${mStr}/${calendarYear}`)
    } else if (type === 'cartola' && defaultCartolaDate) {
      onChange(defaultCartolaDate)
    }
    setShowCalendar(false)
  }

  // Días del mes y offset
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const previewHeader = formatVoucherHeaderDate(value, fallbackMonth, fallbackYear)

  return (
    <div className="space-y-1.5 relative text-xs" ref={calendarRef}>
      <label className="font-bold text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{label}</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold border border-border/80">
          DD/MM/AAAA
        </span>
      </label>

      {/* Input de Fecha con botón de Calendario */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder="DD/MM/AAAA (ej: 05/11/2026)"
          maxLength={10}
          className="w-full pl-3.5 pr-11 py-2 text-xs font-bold font-mono bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs"
        />
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
          title="Abrir calendario para elegir fecha"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Vista previa en tiempo real de cómo se leerá en el voucher */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>En el documento: <strong className="text-foreground">{previewHeader}</strong></span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuick('today')}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-semibold cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setQuick('day5')}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground font-semibold cursor-pointer"
          >
            Día 5
          </button>
          {defaultCartolaDate && (
            <button
              type="button"
              onClick={() => setQuick('cartola')}
              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold hover:bg-primary/20 cursor-pointer"
              title="Restaurar fecha original registrada"
            >
              Cartola
            </button>
          )}
        </div>
      </div>

      {/* Popover / Calendario Interactivo */}
      {showCalendar && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 p-3 bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-foreground uppercase tracking-wider">
              {SPANISH_MONTHS[calendarMonth]} {calendarYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 pt-2 pb-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] font-bold text-muted-foreground uppercase">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dStr = String(dayNum).padStart(2, '0')
              const mStr = String(calendarMonth + 1).padStart(2, '0')
              const formatted = `${dStr}/${mStr}/${calendarYear}`
              const isSelected = value === formatted

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => selectDay(dayNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-black shadow-xs scale-105'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-border text-[11px]">
            <button
              type="button"
              onClick={() => setQuick('today')}
              className="text-primary hover:underline font-bold cursor-pointer"
            >
              Fijar Hoy
            </button>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
