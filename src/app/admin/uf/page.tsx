'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UfData {
  fecha: string
  valor: number
}

export default function UFDashboard() {
  const [history, setHistory] = useState<UfData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUfHistory() {
      try {
        // Mindicador permite obtener la serie de los últimos 30 días llamando al endpoint del indicador
        const res = await fetch('https://mindicador.cl/api/uf')
        const json = await res.json()
        
        // Transformar la fecha a un formato legible
        const formatted = json.serie.map((item: any) => ({
          fecha: new Date(item.fecha).toLocaleDateString('es-CL'),
          valor: item.valor
        }))
        
        setHistory(formatted)
      } catch (error) {
        console.error('Error fetching UF:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUfHistory()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">UF</h1>
        <p className="text-muted-foreground">valores obtenidos en <a href="https://mindicador.cl" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">mindicador.cl</a></p>
      </div>
      
      <div className="border rounded-md bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">Cargando valores...</TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-destructive">Error al cargar datos.</TableCell>
              </TableRow>
            ) : (
              history.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.fecha}</TableCell>
                  <TableCell>{item.valor.toLocaleString('es-CL', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
