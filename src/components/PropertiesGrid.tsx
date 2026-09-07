import Link from "next/link";
import prisma from "@/lib/db";
import { PropertyCard } from "./PropertyCard";

export async function PropertiesGrid() {
  const properties = await prisma.property.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <section className="py-12 md:py-20 bg-background" id="propiedades">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
              Propiedades Destacadas
            </h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Explora nuestra selección de propiedades exclusivas disponibles para ti.
            </p>
          </div>
          <Link href="/propiedades" className="text-primary font-medium hover:underline mt-4 md:mt-0">
            Ver todas las propiedades &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
