import prisma from '@/lib/db';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ClientDocumentManager } from '@/components/admin/ClientDocumentManager';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) {
    notFound();
  }
  const client = await prisma.clientUser.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: 'desc' } } },
  });

  if (!client) {
    notFound();
  }

  // Ensure admin is authenticated (reuse same admin check as list page)
  // This page is under /admin, so admin auth should already be enforced globally via layout.

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8">
      {/* Back button */}
      <Button variant="ghost" asChild className="flex items-center gap-2 text-sm">
        <Link href="/admin/clientes">
          <ArrowLeft size={16} /> Volver a la lista de clientes
        </Link>
      </Button>

      {/* Client header */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {client.name} – Detalle de Carpeta
        </h1>
        <p className="text-muted-foreground mt-1">
          {client.rut ? `RUT: ${client.rut}` : 'Sin RUT registrado'} | {client.email || 'Sin email'}
        </p>
      </div>

      {/* Document manager */}
      <ClientDocumentManager client={client} />
    </div>
  );
}
