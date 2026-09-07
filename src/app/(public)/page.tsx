import { Hero } from "@/components/Hero";
import { PropertiesGrid } from "@/components/PropertiesGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      
      {/* 1. Residenciales: Casas y Departamentos */}
      <PropertiesGrid 
        title="Propiedades Residenciales" 
        description="Encuentra la casa o departamento ideal para ti y tu familia."
        categoryFilter={['Casas', 'Departamento']}
        bgColor="bg-background"
        linkHref="/propiedades"
      />

      {/* 2. Comerciales e Institucionales */}
      <PropertiesGrid 
        title="Oportunidades Comerciales" 
        description="Locales, oficinas y edificios corporativos para tu negocio."
        categoryFilter={['Comercial', 'Oficina', 'Institucional']}
        bgColor="bg-accent/30"
        linkHref="/propiedades"
      />

      {/* 3. Terrenos y Parcelas */}
      <PropertiesGrid 
        title="Terrenos y Parcelas" 
        description="El espacio perfecto para construir tu proyecto desde cero."
        categoryFilter={['Terrenos', 'Parcela']}
        bgColor="bg-background"
        linkHref="/propiedades"
      />

      {/* 4. Predios Agrícolas */}
      <PropertiesGrid 
        title="Predios Agrícolas y Forestales" 
        description="Extensas hectáreas productivas en excelentes ubicaciones."
        categoryFilter={['Agricola']}
        bgColor="bg-accent/30"
        linkHref="/propiedades"
      />
      
    </div>
  );
}
