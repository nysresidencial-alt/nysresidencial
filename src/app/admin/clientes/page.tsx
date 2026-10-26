import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { Users, Search, FolderOpen, Mail, Phone, FileText, ArrowRight, ShieldCheck, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateClientModal } from '@/components/admin/CreateClientModal'
import { ImportClientsModal } from '@/components/admin/ImportClientsModal'
import { DeleteClientModal } from '@/components/admin/DeleteClientModal'

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasMockSession) {
    redirect('/admin/login')
  }

  const { q } = await searchParams

  const clients = await prisma.clientUser.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { rut: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <span>Oficina Virtual • Clientes</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona el acceso de tus clientes y sube los documentos (PDFs o enlaces de OneDrive) que verán en su portal privado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ImportClientsModal />
          <CreateClientModal />
        </div>
      </div>

      {/* Search & Stats Toolbar */}
      <div className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <form className="w-full sm:w-80 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Buscar por nombre, RUT o correo..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
          <span className="bg-muted px-3 py-1.5 rounded-full">
            {clients.length} {clients.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </span>
          <Link
            href="/oficina-virtual"
            target="_blank"
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>Ver Portal Público &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No se encontraron clientes</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {q ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no has creado clientes para la Oficina Virtual. Crea el primero haciendo clic en "Nuevo Cliente".'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-card border border-border rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header card: Name and status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground leading-snug">
                      {client.name}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {client.rut ? `RUT: ${client.rut}` : 'Sin RUT registrado'}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      client.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                    }`}
                  >
                    {client.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-muted-foreground my-4 pt-3 border-t border-border/80">
                  {client.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] bg-muted/50 p-2 rounded-xl">
                    <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>Usuario: <strong className="text-foreground">{client.username || client.rut || client.email}</strong> | Clave: <strong className="text-foreground">{client.password}</strong></span>
                  </div>

                  {client.notes && (
                    <p className="text-[11px] text-muted-foreground italic pt-1 line-clamp-2">
                      &ldquo;{client.notes}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>{client._count.documents} {client._count.documents === 1 ? 'documento' : 'documentos'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <DeleteClientModal clientId={client.id} clientName={client.name} />

                  <Link href={`/admin/clientes/${client.id}`}>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-xs px-4 shadow-xs cursor-pointer gap-1"
                    >
                      <span>Ver Carpeta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}
