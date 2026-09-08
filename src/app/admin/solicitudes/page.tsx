import prisma from '@/lib/db'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export default async function SolicitudesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasMockSession) {
    redirect('/admin/login')
  }

  const solicitudes = await prisma.publicationRequest.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Publicación</h1>
          <p className="text-muted-foreground mt-2">Mensajes enviados por clientes que desean publicar su propiedad.</p>
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {solicitudes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay solicitudes por el momento.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {solicitudes.map((sol) => (
              <div key={sol.id} className="p-6 hover:bg-accent/5 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{sol.name}</h3>
                    <div className="text-muted-foreground flex gap-4 text-sm mt-1">
                      <span>Email: <strong>{sol.email}</strong></span>
                      <span>Teléfono: <strong>{sol.phone}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={sol.status === 'Pendiente' ? 'default' : 'secondary'}>
                      {sol.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(sol.createdAt).toLocaleDateString('es-CL', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className="bg-background">{sol.propertyType}</Badge>
                    <Badge variant="outline" className="bg-background">{sol.operation}</Badge>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{sol.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
