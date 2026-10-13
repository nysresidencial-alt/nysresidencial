import prisma from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Trash2, CheckCircle2, Clock, MessageSquare, Briefcase, Home } from 'lucide-react';
import { updateRequestStatus, deleteRequest } from './actions';

export default async function SolicitudesPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !hasMockSession) {
    redirect('/admin/login');
  }

  const solicitudes = await prisma.publicationRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Solicitudes y Contacto
          </h1>
          <p className="text-muted-foreground mt-2">
            Revisa los mensajes enviados por clientes interesados en comprar, vender, arrendar o postular a la inmobiliaria.
          </p>
        </div>
        <div className="bg-card border border-border px-4 py-2 rounded-xl text-sm font-medium">
          Total: <strong className="text-primary">{solicitudes.length}</strong> solicitudes
        </div>
      </div>

      <div className="space-y-4">
        {solicitudes.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">No hay solicitudes registradas</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Las consultas y solicitudes que envíen los usuarios desde la página principal aparecerán aquí.
            </p>
          </div>
        ) : (
          solicitudes.map((sol) => {
            const isLaboral = sol.operation.includes('Trabaja') || sol.propertyType === 'Laboral';
            const cleanPhone = sol.phone?.replace(/[^0-9]/g, '');

            return (
              <div 
                key={sol.id} 
                className={`bg-card border rounded-2xl p-6 transition-all shadow-sm ${
                  sol.status === 'Pendiente' ? 'border-primary/40 bg-primary/[0.02]' : 'border-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  
                  {/* Info de contacto */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">{sol.name}</h3>
                      <Badge 
                        variant={sol.status === 'Pendiente' ? 'default' : 'secondary'}
                        className={sol.status === 'Pendiente' ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {sol.status}
                      </Badge>
                      <Badge variant="outline" className="border-border">
                        {isLaboral ? (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Briefcase className="w-3 h-3" /> Postulación Laboral
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Home className="w-3 h-3" /> {sol.operation}
                          </span>
                        )}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                      <a 
                        href={`mailto:${sol.email}`}
                        className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium text-foreground"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        {sol.email}
                      </a>

                      {sol.phone && (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-foreground font-medium">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {sol.phone}
                          </span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 px-2 py-0.5 rounded font-semibold transition-colors"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de administración */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    
                    {/* Botón cambiar estado */}
                    <form action={async () => {
                      'use server';
                      await updateRequestStatus(
                        sol.id, 
                        sol.status === 'Pendiente' ? 'Contactado' : 'Pendiente'
                      );
                    }}>
                      <Button 
                        type="submit" 
                        variant="outline" 
                        size="sm"
                        className="text-xs flex items-center gap-1.5 h-8"
                      >
                        {sol.status === 'Pendiente' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            Marcar Contactado
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            Marcar Pendiente
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Botón eliminar */}
                    <form action={async () => {
                      'use server';
                      await deleteRequest(sol.id);
                    }}>
                      <Button 
                        type="submit" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Eliminar solicitud"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>

                  </div>

                </div>

                {/* Mensaje / Contenido */}
                <div className="bg-muted/40 p-4 rounded-xl border border-border/60">
                  <span className="text-[11px] uppercase font-bold text-muted-foreground block mb-1">
                    Detalle del Requerimiento / Mensaje:
                  </span>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {sol.message}
                  </p>
                </div>

                <div className="mt-3 text-right">
                  <span className="text-[11px] text-muted-foreground">
                    Recibido el {new Date(sol.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
