import { Hero } from "@/components/Hero";
import { PropertiesGrid } from "@/components/PropertiesGrid";
import { GlobalMap } from "@/components/GlobalMap";
import prisma from "@/lib/db";

export default async function Home() {
  // Obtener propiedades para el mapa (solo las que tienen latitud y longitud)
  const properties = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
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
      <Hero />

      {/* Mapa Interactivo */}
      <section className="w-full py-12 md:py-20 bg-card border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Explora en el Mapa</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Navega por nuestra selección de propiedades directamente en el mapa y encuentra oportunidades en tu sector favorito.
            </p>
          </div>
          <GlobalMap properties={properties as any} />
        </div>
      </section>
      
      {/* 1. Residenciales: Casas y Departamentos */}
      <PropertiesGrid 
        title="Propiedades Residenciales" 
        description="Encuentra la casa o departamento ideal para ti y tu familia."
        categoryFilter={['Casas', 'Departamento']}
        take={8}
        bgColor="bg-background"
        linkHref="/propiedades?type=Casa"
      />

      {/* 2. Comerciales e Institucionales */}
      <PropertiesGrid 
        title="Oportunidades Comerciales" 
        description="Locales, oficinas y edificios corporativos para tu negocio."
        categoryFilter={['Comercial', 'Oficina', 'Institucional']}
        take={8}
        bgColor="bg-accent/30"
        linkHref="/propiedades?type=Comercial"
      />

      {/* 3. Terrenos y Parcelas */}
      <PropertiesGrid 
        title="Terrenos y Parcelas" 
        description="El espacio perfecto para construir tu proyecto desde cero."
        categoryFilter={['Terrenos', 'Parcela']}
        take={8}
        bgColor="bg-background"
        linkHref="/propiedades?type=Terreno"
      />

      {/* 4. Predios Agrícolas */}
      <PropertiesGrid 
        title="Predios Agrícolas y Forestales" 
        description="Extensas hectáreas productivas en excelentes ubicaciones."
        categoryFilter={['Agricola']}
        take={8}
        bgColor="bg-accent/30"
        linkHref="/propiedades?type=Agricola"
      />
      
    </div>
  );
}
