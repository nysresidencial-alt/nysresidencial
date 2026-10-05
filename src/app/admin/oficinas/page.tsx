import prisma from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { deleteOffice, toggleOfficeStatus } from './actions';
import { revalidatePath } from 'next/cache';

export default async function OficinasAdminPage() {
  const offices = await prisma.office.findMany({
    orderBy: { order: 'asc' }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Oficinas y Contacto
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las oficinas que aparecen en el pie de página y en la página de contacto.
          </p>
        </div>
        <Link href="/admin/oficinas/nueva">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nueva Oficina
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offices.map((office) => (
          <div key={office.id} className={`bg-card border p-6 rounded-2xl shadow-sm relative ${office.isActive ? 'border-border' : 'border-dashed opacity-70'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold">{office.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${office.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {office.isActive ? 'Activa' : 'Oculta'}
                  </span>
                  <span className="text-xs text-muted-foreground">Orden: {office.order}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={async () => {
                  'use server';
                  await toggleOfficeStatus(office.id, !office.isActive);
                }}>
                  <Button type="submit" variant="outline" size="sm">
                    {office.isActive ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </form>
                <Link href={`/admin/oficinas/editar/${office.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <form action={async () => {
                  'use server';
                  await deleteOffice(office.id);
                }}>
                  <Button type="submit" variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Dirección:</strong> {office.address}</p>
              {office.email && <p><strong className="text-foreground">Email:</strong> {office.email}</p>}
              {office.phone && <p><strong className="text-foreground">Teléfono:</strong> {office.phone}</p>}
              {office.mapLink && (
                <p className="truncate"><strong className="text-foreground">Link Maps:</strong> <a href={office.mapLink} target="_blank" className="text-primary hover:underline">{office.mapLink}</a></p>
              )}
            </div>
          </div>
        ))}

        {offices.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card border border-dashed rounded-2xl">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-bold">No hay oficinas configuradas</h3>
            <p className="text-muted-foreground mt-1 mb-4">Agrega tu primera oficina para que aparezca en el sitio web.</p>
            <Link href="/admin/oficinas/nueva">
              <Button>Agregar Oficina</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
