/**
 * Utilidades para cálculo de vencimientos, prórrogas y estados de renovación de contratos de arriendo.
 */

export interface RenewalAnalysis {
  status: 'VENCIDO' | 'POR_VENCER' | 'VIGENTE' | 'INCOMPLETO' | 'INDEFINIDO'
  statusLabel: string
  autoRenewal: boolean
  cycleNumber: number
  cycleStartDate: Date | null
  cycleStartDateFormatted: string
  expirationDate: Date | null
  expirationDateFormatted: string
  noticeDays: number
  effectiveNoticeDays: number
  noticeDate: Date | null
  noticeDateFormatted: string
  alertStartDate: Date | null
  alertStartDateFormatted: string
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
 * Helper que suma un período a una fecha
 */
export function addRenewalPeriod(
  date: Date,
  period: { years: number; months: number; days: number }
): Date {
  const d = new Date(date.getTime())
  if (period.years > 0) d.setFullYear(d.getFullYear() + period.years)
  if (period.months > 0) d.setMonth(d.getMonth() + period.months)
  if (period.days > 0) d.setDate(d.getDate() + period.days)
  return d
}

/**
 * Analiza un contrato y calcula su próximo vencimiento, días restantes y urgencia,
 * soportando prórroga automática sucesiva (ciclos) y ventana de aviso contractual (noticeDays: 30, 60, 90, 120)
 * más una holgura preventiva de 5 días para que la administración prepare y envíe las notificaciones.
 */
export function analyzeContractRenewal(
  contractDateStr: string | null | undefined,
  renewalPeriodStr: string | null | undefined,
  referenceDate: Date = new Date(),
  autoRenewal: boolean = true,
  noticeDays: number = 30
): RenewalAnalysis {
  const parsedDate = parseContractDate(contractDateStr)
  const periodInfo = parseRenewalPeriod(renewalPeriodStr)
  const safeNoticeDays = Number(noticeDays) > 0 ? Number(noticeDays) : 30
  const bufferDays = 5
  const effectiveNoticeDays = safeNoticeDays + bufferDays

  // 1. Datos incompletos
  if (!parsedDate || (!periodInfo.isIndefinite && periodInfo.years === 0 && periodInfo.months === 0 && periodInfo.days === 0)) {
    return {
      status: 'INCOMPLETO',
      statusLabel: !parsedDate && (!renewalPeriodStr || renewalPeriodStr.trim() === '')
        ? 'Falta Fecha y Período'
        : !parsedDate
        ? 'Falta Fecha Contrato'
        : 'Falta Período',
      autoRenewal,
      cycleNumber: 1,
      cycleStartDate: null,
      cycleStartDateFormatted: '-',
      expirationDate: null,
      expirationDateFormatted: 'Sin fecha de vencimiento',
      noticeDays: safeNoticeDays,
      effectiveNoticeDays,
      noticeDate: null,
      noticeDateFormatted: '-',
      alertStartDate: null,
      alertStartDateFormatted: '-',
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
      autoRenewal,
      cycleNumber: 1,
      cycleStartDate: parsedDate,
      cycleStartDateFormatted: formatDisplayDate(parsedDate),
      expirationDate: null,
      expirationDateFormatted: 'Plazo Indefinido',
      noticeDays: safeNoticeDays,
      effectiveNoticeDays,
      noticeDate: null,
      noticeDateFormatted: '-',
      alertStartDate: null,
      alertStartDateFormatted: '-',
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining: null,
      daysText: 'Indefinido',
      urgency: 'indefinite',
      normalizedPeriod: 'INDEFINIDO',
    }
  }

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  let cycleStart = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate())
  let cycleEnd = addRenewalPeriod(cycleStart, periodInfo)
  let cycleNumber = 1

  if (autoRenewal) {
    // Si tiene renovación automática, avanzamos de ciclo mientras el ciclo ya haya concluido en el pasado (cycleEnd < today)
    while (cycleEnd.getTime() < today.getTime()) {
      cycleStart = new Date(cycleEnd.getTime())
      cycleEnd = addRenewalPeriod(cycleStart, periodInfo)
      cycleNumber++
    }
  }

  // Fecha límite contractual de aviso previo (ej: 30, 60, 90, 120 días antes del término)
  const noticeDate = new Date(cycleEnd.getTime() - safeNoticeDays * 24 * 60 * 60 * 1000)

  // Fecha de inicio de alerta preventiva en sistema (5 días antes de la fecha límite contractual)
  const alertStartDate = new Date(cycleEnd.getTime() - effectiveNoticeDays * 24 * 60 * 60 * 1000)

  // Diferencia en días respecto a hoy
  const diffTime = cycleEnd.getTime() - today.getTime()
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24))

  // Si no es renovación automática y ya expiró su plazo original
  if (!autoRenewal && daysRemaining < 0) {
    const absDays = Math.abs(daysRemaining)
    return {
      status: 'VENCIDO',
      statusLabel: 'Vencido (Plazo Fijo)',
      autoRenewal,
      cycleNumber: 1,
      cycleStartDate: parsedDate,
      cycleStartDateFormatted: formatDisplayDate(parsedDate),
      expirationDate: cycleEnd,
      expirationDateFormatted: formatDisplayDate(cycleEnd),
      noticeDays: safeNoticeDays,
      effectiveNoticeDays,
      noticeDate,
      noticeDateFormatted: formatDisplayDate(noticeDate),
      alertStartDate,
      alertStartDateFormatted: formatDisplayDate(alertStartDate),
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining,
      daysText: absDays === 1 ? 'Venció ayer' : `Vencido hace ${absDays} días`,
      urgency: 'critical',
      normalizedPeriod: periodInfo.label,
    }
  }

  // Ventana de aviso preventivo: días restantes <= días de aviso pactados + 5 días de holgura
  if (daysRemaining <= effectiveNoticeDays && daysRemaining >= 0) {
    return {
      status: 'POR_VENCER',
      statusLabel: `Por Vencer (${safeNoticeDays}d)`,
      autoRenewal,
      cycleNumber,
      cycleStartDate: cycleStart,
      cycleStartDateFormatted: formatDisplayDate(cycleStart),
      expirationDate: cycleEnd,
      expirationDateFormatted: formatDisplayDate(cycleEnd),
      noticeDays: safeNoticeDays,
      effectiveNoticeDays,
      noticeDate,
      noticeDateFormatted: formatDisplayDate(noticeDate),
      alertStartDate,
      alertStartDateFormatted: formatDisplayDate(alertStartDate),
      contractDateFormatted: formatDisplayDate(parsedDate),
      daysRemaining,
      daysText:
        daysRemaining === 0
          ? 'Vence/Renueva hoy'
          : daysRemaining === 1
          ? 'Vence mañana (1 día)'
          : `Vence en ${daysRemaining} días`,
      urgency: daysRemaining <= safeNoticeDays ? 'critical' : 'warning',
      normalizedPeriod: periodInfo.label,
    }
  }

  // Contrato vigente en curso (más días restantes que la ventana de aviso + holgura)
  return {
    status: 'VIGENTE',
    statusLabel: 'Vigente',
    autoRenewal,
    cycleNumber,
    cycleStartDate: cycleStart,
    cycleStartDateFormatted: formatDisplayDate(cycleStart),
    expirationDate: cycleEnd,
    expirationDateFormatted: formatDisplayDate(cycleEnd),
    noticeDays: safeNoticeDays,
    effectiveNoticeDays,
    noticeDate,
    noticeDateFormatted: formatDisplayDate(noticeDate),
    alertStartDate,
    alertStartDateFormatted: formatDisplayDate(alertStartDate),
    contractDateFormatted: formatDisplayDate(parsedDate),
    daysRemaining,
    daysText: `Vigente (vence en ${daysRemaining}d)`,
    urgency: 'normal',
    normalizedPeriod: periodInfo.label,
  }
}
