'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClientUser } from '@/app/admin/clientes/actions'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DeleteClientModal({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    const res = await deleteClientUser(clientId)
    if (res.success) {
      setIsOpen(false)
      setIsDeleting(false)
      router.refresh()
    } else {
      alert(res.error || 'No se pudo eliminar el cliente.')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-full cursor-pointer"
        title="Eliminar cliente"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-foreground">¿Eliminar Cliente?</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong>{clientName}</strong>? Se borrará su acceso a la Oficina Virtual y todos los documentos asociados a su cuenta.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="rounded-full px-5 text-xs"
              >
                Cancelar
              </Button>

              <Button
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-5 text-xs cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
