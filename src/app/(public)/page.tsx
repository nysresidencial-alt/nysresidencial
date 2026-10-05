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

  // Obtener im&aacute;genes del carrusel
  const heroImages = await prisma.heroImage.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { url: true }
  });
  const heroImageUrls = heroImages.map((img: { url: string }) => img.url);

  // Obtener propiedades para el mapa (solo las que tienen latitud y longitud)
  const offices = await prisma.office.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  const properties = await prisma.property.findMany({
    where: {
      
      ...(operationFilter ? { operation: { contains: operationFilter, mode: "insensitive" } } : {})
    },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      images: true,
      
      sector: true,
      city: true,
    }
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Hero images={heroImageUrls} />

      {/* Oficinas y Contacto */}
      {offices.length > 0 && (
        <section className="w-full py-6 md:py-8 bg-zinc-50 dark:bg-zinc-900 border-b border-border">
          <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {offices.map(office => (
                <div key={office.id} className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-card p-4 md:p-6 rounded-2xl shadow-sm border border-border">
                  
                  <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                    <div className="bg-primary/10 p-4 rounded-full text-primary shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Oficina {office.name}</h3>
                      <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        {office.address}
                      </p>
                      {office.phone && <p className="text-muted-foreground text-sm font-medium mt-1">{office.phone}</p>}
                    </div>
                  </div>

                  <div className="w-full md:w-[250px] lg:w-[300px] shrink-0 flex flex-col gap-3">
                    <div className="relative h-[100px] w-full rounded-xl overflow-hidden border border-border shadow-inner hidden sm:block">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(office.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    {office.mapLink && (
                      <a 
                        href={office.mapLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-md hover:shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        Abrir en Maps
                      </a>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Toggle Venta/Arriendo */}
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8 mt-8">
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

      {/* 4. Predios AgrÃƒÂ­colas */}
      <PropertiesGrid 
        title="Predios Agr&iacute;colas y Forestales" 
        description="Extensas hect&aacute;reas productivas en excelentes ubicaciones."
        categoryFilter={['Agricola']}
        operationFilter={operationFilter}
        take={8}
        bgColor="bg-accent/30"
        linkHref="/propiedades?type=Agricola"
      />
      
    </div>
  );
}
