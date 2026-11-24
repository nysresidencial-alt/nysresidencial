'use client'

import React, { useState, useEffect } from 'react'
import { X, Building, Home, User, DollarSign, Calendar, Loader2, ExternalLink } from 'lucide-react'
import { getPropietarioProperties } from '@/app/admin/propietarios/actions'

interface OwnerPropertiesModalProps {
  ownerName: string
  onClose: () => void
}

export function OwnerPropertiesModal({ ownerName, onClose }: OwnerPropertiesModalProps) {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getPropietarioProperties(ownerName)
      .then((data) => {
        if (isMounted) {
          setProperties(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Error cargando propiedades del propietario:', err)
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [ownerName])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base leading-tight">
                Inmuebles Asignados a {ownerName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? 'Cargando cartera...' : `${properties.length} inmuebles encontrados en el sistema`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido / Tabla */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs">Consultando inmuebles del propietario...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No se encontraron inmuebles asociados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Edificio</th>
                    <th className="py-3 px-3">Unidad</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3.5">Arrendatario</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3.5 text-right">Valor Arriendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {properties.map((p) => {
                    const isOccupied = (p.status || '').toLowerCase().includes('ocup')
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3.5 font-bold text-foreground">
                          {p.building}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {p.unitNumber}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {p.propertyType || 'Departamento'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-medium text-foreground block">
                            {p.tenantName || 'Disponible'}
                          </span>
                          {p.tenantPhone && (
                            <span className="text-[10px] text-muted-foreground">
                              {p.tenantPhone}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOccupied
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {p.status || 'Ocupado'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-foreground">
                          ${Math.round(p.totalRent || 0).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20 text-xs">
          <span className="text-muted-foreground font-medium">
            Total en cartera: <strong>{properties.length} inmuebles</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
