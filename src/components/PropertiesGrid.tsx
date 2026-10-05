import Link from "next/link";
import prisma from "@/lib/db";
import { PropertyCard } from "./PropertyCard";
import { Prisma } from "@prisma/client";

interface PropertiesGridProps {
  title: string;
  description?: string;
  categoryFilter?: string[];
  operationFilter?: string;
  take?: number;
  linkHref?: string;
  bgColor?: string;
}

export async function PropertiesGrid({ 
  title, 
  description, 
  categoryFilter, 
  operationFilter,
  take = 10, 
  linkHref,
  bgColor = "bg-background"
}: PropertiesGridProps) {
  
  const whereClause: Prisma.PropertyWhereInput = {};
  if (categoryFilter) {
    whereClause.propertyType = { in: categoryFilter };
  }
  if (operationFilter) {
    whereClause.operation = { contains: operationFilter, mode: "insensitive" };
  }

  const properties = await prisma.property.findMany({
    where: whereClause,
    take: take,
    orderBy: { createdAt: 'desc' }
  });

  if (properties.length === 0) return null;

  return (
    <section className={`py-12 md:py-16 ${bgColor}`}>
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 md:mb-3 text-secondary uppercase">
              {title}
            </h2>
            {description && (
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {linkHref && (
            <Link href={linkHref} className="text-primary font-bold hover:underline mt-4 md:mt-0 whitespace-nowrap">
              Ver m&aacute;s &rarr;
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
