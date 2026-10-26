'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientUser } from '@/app/admin/clientes/actions'
import { Plus, UserPlus, Loader2, X, Shield, Lock, Mail, Phone, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CreateClientModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createClientUser(formData)

    if (result.success) {
      setIsOpen(false)
      setIsLoading(false)
      router.refresh()
    } else {
      setError(result.error || 'Ocurrió un error al crear el cliente.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-5 shadow-sm cursor-pointer"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        <span>Nuevo Cliente</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span>Crear Nuevo Cliente</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Genera una cuenta para que el cliente pueda acceder a su Oficina Virtual.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nombre Completo *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej: Rodrigo Valenzuela Morales"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">RUT (Opcional)</label>
                  <input
                    type="text"
                    name="rut"
                    placeholder="Ej: 14.238.901-4"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Ej: +56 9 8765 4321"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Correo Electrónico (Gmail)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="cliente@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Usuario / Alias (Opcional)</label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Ej: rodrigo (opcional)"
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border border-border/80">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>Contraseña para Oficina Virtual *</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-normal">Inicial para el cliente</span>
                </label>
                <input
                  type="text"
                  name="password"
                  required
                  defaultValue="nys2026"
                  placeholder="Contraseña"
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notas Internas (Privadas)</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ej: Comprador departamento Amalfi, firma escritura en noviembre"
                  className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full px-5 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 text-xs shadow-sm cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Guardar y Crear Cliente</span>
                  )}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
