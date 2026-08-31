'use client'

import { useEffect, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'

export function UFWidget() {
  const [data, setData] = useState<{ uf: number | null; dolar: number | null }>({
    uf: null,
    dolar: null,
  })
  const [showUf, setShowUf] = useState(true)

  useEffect(() => {
    async function fetchIndicators() {
      try {
        const res = await fetch('https://mindicador.cl/api')
        const json = await res.json()
        setData({
          uf: json.uf.valor,
          dolar: json.dolar.valor,
        })
      } catch (error) {
        console.error('Error fetching indicators:', error)
      }
    }
    
    fetchIndicators()
    // mindicador actualiza diario, no necesitamos poll, solo fetch al montar
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setShowUf((prev) => !prev)
    }, 5000) // Cambia cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  if (!data.uf || !data.dolar) {
    return (
      <div className="h-8 w-32 bg-zinc-800/50 animate-pulse rounded-full" />
    )
  }

  return (
    <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium cursor-default transition-all duration-500 overflow-hidden min-w-[140px] justify-center shadow-inner">
      <div className="flex items-center transition-opacity duration-500">
        <span className="text-white/60 mr-2">{showUf ? 'UF' : 'USD'}</span>
        <span className="text-white">
          $ {showUf 
              ? data.uf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
              : data.dolar.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
        </span>
      </div>
    </div>
  )
}
