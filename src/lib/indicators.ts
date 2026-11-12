/**
 * Obtiene indicadores económicos chilenos (UF y Dólar) con caché de 12 horas.
 * No bloquea la aplicación si la API externa falla.
 */
export interface EconomicIndicators {
  uf: number | null
  dolar: number | null
  date: string | null
}

export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2500) // 2.5s timeout máximo

    const res = await fetch('https://mindicador.cl/api', {
      signal: controller.signal,
      next: { revalidate: 43200 }, // Caché por 12 horas en Next.js
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    return {
      uf: data?.uf?.valor ?? null,
      dolar: data?.dolar?.valor ?? null,
      date: data?.uf?.fecha ? new Date(data.uf.fecha).toLocaleDateString('es-CL') : null,
    }
  } catch (error) {
    // Si la API falla, retornar null silenciosamente sin ralentizar la web
    return {
      uf: null,
      dolar: null,
      date: null,
    }
  }
}
