import { HeroCarouselAdmin } from "@/components/admin/HeroCarouselAdmin";
import prisma from "@/lib/db";
import { requireAdminAuth } from "@/lib/admin-auth";

export default async function AdminCarouselPage() {
  await requireAdminAuth('carrusel', 'view');

  const images = await prisma.heroImage.findMany({
    orderBy: { order: 'asc' },
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Carrusel de Inicio</h1>
        <p className="text-muted-foreground">Sube y ordena las imágenes que aparecerán de fondo en la página principal.</p>
      </div>

      <HeroCarouselAdmin initialImages={images} />
    </div>
  );
}
