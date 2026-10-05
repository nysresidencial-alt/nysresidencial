import { Hero } from "@/components/Hero";
import { PropertiesGrid } from "@/components/PropertiesGrid";
import { GlobalMap } from "@/components/GlobalMap";
import { OperationToggle } from "@/components/OperationToggle";
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

  // Obtener propiedades para el mapa (solo las que tienen latitud y longitud)
  const properties = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(operationFilter ? { operation: { contains: operationFilter, mode: "insensitive" } } : {})
    },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      images: true,
      latitude: true,
      longitude: true,
      sector: true,
      city: true,
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Hero images={heroImageUrls} />

      {/* Mapa Interactivo */}
      <section className="w-full py-12 md:py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-secondary uppercase">Explora en el Mapa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Navega por nuestra selecciÃ³n de propiedades directamente en el mapa y encuentra oportunidades en tu sector favorito.
            </p>
          </div>
          <GlobalMap properties={properties as any} />
        </div>
      </section>

      {/* Toggle Venta/Arriendo */}
      <div className="container mx-auto px-4 mt-8">
        <OperationToggle />
      </div>
      
      {/* 1. Residenciales: Casas y Departamentos */}
      <PropertiesGrid 
        title="Propiedades Residenciales" 
        description="Encuentra la casa o departamento ideal para ti y tu familia."
        categoryFilter={['Casa', 'Casas', 'Departamento']}
        operationFilter={operationFilter}
        take={8}
        bgColor="bg-background"
        linkHref="/propiedades?type=Casa"
      />

      {/* 2. Comerciales e Institucionales */}
      <PropertiesGrid 
        title="Oportunidades Comerciales" 
        description="Locales, oficinas y edificios corporativos para tu negocio."
        categoryFilter={['Comercial', 'Oficina', 'Institucional']}
        operationFilter={operationFilter}
        take={8}
        bgColor="bg-accent/30"
        linkHref="/propiedades?type=Comercial"
      />

      {/* 3. Terrenos y Parcelas */}
      <PropertiesGrid 
        title="Terrenos y Parcelas" 
        description="El espacio perfecto para construir tu proyecto desde cero."
        categoryFilter={['Terreno', 'Terrenos', 'Parcela']}
        operationFilter={operationFilter}
        take={8}
        bgColor="bg-background"
        linkHref="/propiedades?type=Terreno"
      />

      {/* 4. Predios AgrÃ­colas */}
      <PropertiesGrid 
        title="Predios AgrÃ­colas y Forestales" 
        description="Extensas hectÃ¡reas productivas en excelentes ubicaciones."
        categoryFilter={['Agricola']}
        operationFilter={operationFilter}
        take={8}
        bgColor="bg-accent/30"
        linkHref="/propiedades?type=Agricola"
      />
      
    </div>
  );
}
