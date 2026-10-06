import { Hero } from "@/components/Hero";
import { PropertiesGrid } from "@/components/PropertiesGrid";
import prisma from "@/lib/db";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ op?: string }>
}) {
  const { op } = await searchParams;
  const operationFilter = op === "venta" ? "Venta" : op === "arriendo" ? "Arriendo" : undefined;

  // Obtener imágenes del carrusel
  const heroImages = await prisma.heroImage.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { url: true }
  });
  const heroImageUrls = heroImages.map((img: { url: string }) => img.url);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Hero images={heroImageUrls} />
      
      {/* 1. Residenciales: Casas y Departamentos */}
      <PropertiesGrid 
        title="Propiedades Residenciales" 
        categoryFilter={['Casa', 'Casas', 'Departamento']}
        operationFilter={operationFilter}
        take={9}
        bgColor="bg-background"
        linkHref="/propiedades?type=Casa"
      />

      {/* 2. Comerciales e Institucionales */}
      <PropertiesGrid 
        title="Oportunidades Comerciales" 
        categoryFilter={['Comercial', 'Oficina', 'Institucional']}
        operationFilter={operationFilter}
        take={9}
        bgColor="bg-muted"
        linkHref="/propiedades?type=Comercial"
      />

      {/* 3. Terrenos y Parcelas */}
      <PropertiesGrid 
        title="Terrenos y Parcelas" 
        categoryFilter={['Terreno', 'Terrenos', 'Parcela']}
        operationFilter={operationFilter}
        take={9}
        bgColor="bg-background"
        linkHref="/propiedades?type=Terreno"
      />

      {/* 4. Predios Agrícolas */}
      <PropertiesGrid 
        title="Predios Agr&iacute;colas y Forestales" 
        categoryFilter={['Agricola']}
        operationFilter={operationFilter}
        take={9}
        bgColor="bg-muted"
        linkHref="/propiedades?type=Agricola"
      />
      
    </div>
  );
}
