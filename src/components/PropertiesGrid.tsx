import Link from "next/link";
import prisma from "@/lib/db";
import { PropertyCard } from "./PropertyCard";
import { Prisma } from "@prisma/client";

interface PropertiesGridProps {
  title: string;
  description?: string;
  categoryFilter?: string[];
  take?: number;
  linkHref?: string;
  bgColor?: string;
}

export async function PropertiesGrid({ 
  title, 
  description, 
  categoryFilter, 
  take, 
  linkHref,
  bgColor = "bg-background"
}: PropertiesGridProps) {
  
  const properties = await prisma.property.findMany({
    where: categoryFilter ? { propertyType: { in: categoryFilter } } : undefined,
    take: take,
    orderBy: { createdAt: 'desc' }
  });

  if (properties.length === 0) return null;

  return (
    <section className={`py-12 md:py-20 ${bgColor}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {linkHref && (
            <Link href={linkHref} className="text-primary font-medium hover:underline mt-4 md:mt-0">
              Ver más &rarr;
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
