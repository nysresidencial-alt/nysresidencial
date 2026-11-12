import { OfficeForm } from '../OfficeForm';
import { requireAdminAuth } from '@/lib/admin-auth';

export default async function NuevaOficinaPage() {
  await requireAdminAuth('oficinas', 'create');

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Oficina</h1>
        <p className="text-muted-foreground mt-2">
          Agrega una nueva sucursal u oficina de contacto.
        </p>
      </div>

      <OfficeForm />
    </div>
  );
}
