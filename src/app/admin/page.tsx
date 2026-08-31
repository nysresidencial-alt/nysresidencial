import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Search, Plus, MapPin } from 'lucide-react'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboard({
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
  
  // Search properties
  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { title: { contains: q || '', mode: 'insensitive' } },
        { city: { contains: q || '', mode: 'insensitive' } },
        { sector: { contains: q || '', mode: 'insensitive' } },
      ]
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Propiedades</h1>
        <Link href="/admin/propiedades/nueva">
          <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Propiedad
          </Button>
        </Link>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-card border border-border p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <form className="relative w-full max-w-md" method="GET" action="/admin">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, ciudad o sector..." 
            className="pl-10 w-full bg-background border-border rounded-full"
          />
        </form>
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {properties.length} {properties.length === 1 ? 'propiedad' : 'propiedades'}
        </div>
      </div>
      
      {/* Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl">
          <p className="text-muted-foreground mb-4">No se encontraron propiedades.</p>
          <Link href="/admin/propiedades/nueva">
            <Button variant="outline" className="rounded-full">Crear la primera propiedad</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="group flex flex-col bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              
              {/* Image Section */}
              <div className="relative h-48 w-full bg-muted overflow-hidden">
                {prop.images && prop.images[0] ? (
                  <Image
                    src={prop.images[0]}
                    alt={prop.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-zinc-800">
                    Sin foto
                  </div>
                )}
                
                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className="bg-background/90 text-foreground backdrop-blur border-none hover:bg-background/90 font-medium">
                    {prop.operation}
                  </Badge>
                  {prop.status && (
                    <Badge variant="secondary" className="bg-primary/90 text-primary-foreground backdrop-blur border-none font-medium">
                      {prop.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {prop.sector}, {prop.city}
                </div>
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {prop.title}
                </h3>
                <div className="mt-auto pt-4">
                  <p className="text-2xl font-black text-foreground">
                    {prop.currency} {prop.price.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-border p-3 bg-muted/20 flex items-center justify-between">
                <Link href={`/propiedades/${prop.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors pl-2">
                  Ver en sitio
                </Link>
                <div className="flex gap-2">
                  <Link href={`/admin/propiedades/${prop.id}/editar`}>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-full">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <form action={async () => {
                    'use server'
                    await prisma.property.delete({ where: { id: prop.id } })
                  }}>
                    <Button variant="ghost" size="icon" type="submit" className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
