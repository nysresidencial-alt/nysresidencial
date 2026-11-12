import { getEconomicIndicators } from '@/lib/indicators'
import { TrendingUp } from 'lucide-react'

export async function PublicUFBadge() {
  const indicators = await getEconomicIndicators()

  if (!indicators.uf) {
    return null
  }

  const formattedUF = indicators.uf.toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <div
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/15 text-[11px] font-medium text-foreground tracking-tight select-none shadow-xs"
      title="Valor de la Unidad de Fomento (UF) oficial para el mercado inmobiliario"
    >
      <TrendingUp className="w-3.5 h-3.5 text-primary" />
      <span className="text-muted-foreground font-semibold">UF Hoy:</span>
      <span className="font-bold text-primary">${formattedUF}</span>
    </div>
  )
}
