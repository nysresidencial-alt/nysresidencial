/**
 * Utilidades para cálculo de vencimientos, prórrogas y estados de renovación de contratos de arriendo.
 */

export interface RenewalAnalysis {
  status: 'VENCIDO' | 'POR_VENCER' | 'VIGENTE' | 'INCOMPLETO' | 'INDEFINIDO'
  statusLabel: string
  expirationDate: Date | null
  expirationDateFormatted: string
  contractDateFormatted: string
  daysRemaining: number | null
  daysText: string
  urgency: 'critical' | 'warning' | 'normal' | 'incomplete' | 'indefinite'
  normalizedPeriod: string
}

/**
 * Normaliza y analiza un período de renovación (ej: "1 AÑO", "6 MESES", "1 AÑO Y 10 DÍAS")
 */
export function parseRenewalPeriod(periodStr: string | null | undefined): {
  years: number
  months: number
  days: number
  isIndefinite: boolean
  label: string
} {
  if (!periodStr || periodStr.trim() === '') {
    return { years: 0, months: 0, days: 0, isIndefinite: false, label: 'Sin período' }
  }

  const str = periodStr.trim().toUpperCase()
  if (str.includes('INDEFIN')) {
    return { years: 0, months: 0, days: 0, isIndefinite: true, label: 'INDEFINIDO' }
  }

  let years = 0
  let months = 0
  let days = 0

  // Coincidencias de años
  const yearMatch = str.match(/(\d+)\s*(?:AÑO|ANO)/i)
  if (yearMatch) {
    years = parseInt(yearMatch[1], 10)
  }

  // Coincidencias de meses
  const monthMatch = str.match(/(\d+)\s*(?:MES|MESE)/i)
  if (monthMatch) {
    months = parseInt(monthMatch[1], 10)
  }

  // Coincidencias de días
  const dayMatch = str.match(/(\d+)\s*(?:DÍA|DIA)/i)
  if (dayMatch) {
    days = parseInt(dayMatch[1], 10)
  }

  // Si solo dice "1 AÑO" sin número
  if (years === 0 && months === 0 && days === 0) {
    if (str.includes('AÑO') || str.includes('ANO')) years = 1
    else if (str.includes('MES')) months = 6
  }

  let label = periodStr.trim().toUpperCase()
  if (years > 0 && months === 0 && days === 0) {
    label = years === 1 ? '1 AÑO' : `${years} AÑOS`
  } else if (months > 0 && years === 0 && days === 0) {
    label = `${months} MESES`
  }

  return { years, months, days, isIndefinite: false, label }
}

/**
 * Parsea una fecha en texto (YYYY-MM-DD o DD/MM/YYYY) a objeto Date local
 */
export function parseContractDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'null') return null

  // Si viene en formato ISO YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-')
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const d = parseInt(parts[2], 10)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d)
      }
    }
  }

  // Si viene en formato DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const y = parseInt(parts[2], 10)
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d)
      }
    }
  }

  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Formatea una fecha a string visual legible DD/MM/YYYY
 */
export function formatDisplayDate(d: Date | null | string): string {
  if (!d) return '-'
  if (typeof d === 'string') {
    const parsed = parseContractDate(d)
    if (!parsed) return d
    d = parsed
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formatea una fecha a formato estándar input YYYY-MM-DD
 */
export function toInputDate(d: Date | null): string {
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Analiza un contrato y calcula su próximo vencimiento, días restantes y urgencia.
 */
export function analyzeContractRenewal(
  contractDateStr: string | null | undefined,
  renewalPeriodStr: string | null | undefined,
  referenceDate: Date = new Date()
): RenewalAnalysis {
  const parsedDate = parseContractDate(contractDateStr)
  const periodInfo = parseRenewalPeriod(renewalPeriodStr)

  // 1. Datos incompletos
  if (!parsedDate || (!periodInfo.isIndefinite && periodInfo.years === 0 && periodInfo.months === 0 && periodInfo.days === 0)) {
    return {
      status: 'INCOMPLETO',
      statusLabel: !parsedDate && (!renewalPeriodStr || renewalPeriodStr.trim() === '')
        ? 'Falta Fecha y Período'
        : !parsedDate
        ? 'Falta Fecha Contrato'
        : 'Falta Período',
      expirationDate: null,
      expirationDateFormatted: 'Sin fecha de vencimiento',
      contractDateFormatted: parsedDate ? formatDisplayDate(parsedDate) : 'No registrada',
      daysRemaining: null,
      daysText: 'Incompleto',
      urgency: 'incomplete',
      normalizedPeriod: periodInfo.label,
    }
  }

  // 2. Contrato indefinido
  if (periodInfo.isIndefinite) {
    return {
      status: 'INDEFINIDO',
      statusLabel: 'Indefinido',
      expirationDate: null,
      expirationDateFormatted: 'Plazo Indefinido',
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining: null,
      daysText: 'Indefinido',
      urgency: 'indefinite',
      normalizedPeriod: 'INDEFINIDO',
    }
  }

  // 3. Calcular fecha de vencimiento sumando la duración
  const expDate = new Date(parsedDate.getTime())
  if (periodInfo.years > 0) {
    expDate.setFullYear(expDate.getFullYear() + periodInfo.years)
  }
  if (periodInfo.months > 0) {
    expDate.setMonth(expDate.getMonth() + periodInfo.months)
  }
  if (periodInfo.days > 0) {
    expDate.setDate(expDate.getDate() + periodInfo.days)
  }

  // Calcular diferencia en días exactos respecto a la fecha actual
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const expOnly = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate())
  const diffTime = expOnly.getTime() - today.getTime()
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Clasificación
  if (daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining)
    return {
      status: 'VENCIDO',
      statusLabel: 'Vencido',
      expirationDate: expDate,
      expirationDateFormatted: formatDisplayDate(expDate),
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining,
      daysText: absDays === 1 ? 'Venció ayer' : `Vencido hace ${absDays} días`,
      urgency: 'critical',
      normalizedPeriod: periodInfo.label,
    }
  }

  if (daysRemaining <= 60) {
    return {
      status: 'POR_VENCER',
      statusLabel: 'Por Vencer',
      expirationDate: expDate,
      expirationDateFormatted: formatDisplayDate(expDate),
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining,
      daysText: daysRemaining === 0 ? 'Vence hoy' : daysRemaining === 1 ? 'Vence mañana' : `Vence en ${daysRemaining} días`,
      urgency: 'warning',
      normalizedPeriod: periodInfo.label,
    }
  }

  return {
    status: 'VIGENTE',
    statusLabel: 'Vigente',
    expirationDate: expDate,
    expirationDateFormatted: formatDisplayDate(expDate),
    contractDateFormatted: formatDisplayDate(parsedDate),
    daysRemaining,
    daysText: `Vence en ${daysRemaining} días`,
    urgency: 'normal',
    normalizedPeriod: periodInfo.label,
  }
}
