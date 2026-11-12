import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { OfficeForm } from '../../OfficeForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdminAuth } from '@/lib/admin-auth';

export default async function EditarOficinaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminAuth('oficinas', 'edit');

  const { id } = await params;

  const office = await prisma.office.findUnique({
    where: { id },
  });

  if (!office) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href="/admin/oficinas"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a Oficinas
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editar Oficina: {office.name}</h1>
        <p className="text-muted-foreground mt-2">
          Modifica los datos de la sucursal, teléfonos, dirección o enlace de Google Maps.
        </p>
      </div>

      <OfficeForm office={office} />
    </div>
  );
}
