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
  bgColor = "bg-white"
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
    <section className={`py-8 ${bgColor}`}>
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        <div className="border-b border-border mb-4 pb-2 flex justify-between items-end">
          <h2 className="text-primary text-xl sm:text-2xl font-normal">
            {title}
          </h2>
          {linkHref && (
            <Link href={linkHref} className="text-primary text-sm hover:underline">
              Ver m&aacute;s &rarr;
            </Link>
          )}
        </div>
        
        {description && (
          <p className="text-muted-foreground text-sm mb-6">
            {description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
