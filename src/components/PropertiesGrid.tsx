import prisma from "@/lib/db";
import { ExpandablePropertiesGrid } from "./ExpandablePropertiesGrid";
import { Prisma } from "@prisma/client";

interface PropertiesGridProps {
  title: string;
  description?: string;
  categoryFilter?: string[];
  operationFilter?: string;
  take?: number;
  initialCount?: number;
  linkHref?: string;
  bgColor?: string;
}

export async function PropertiesGrid({ 
  title, 
  description, 
  categoryFilter, 
  operationFilter,
  take = 24, 
  initialCount = 6,
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
    <ExpandablePropertiesGrid
      title={title}
      description={description}
      properties={properties}
      linkHref={linkHref}
      bgColor={bgColor}
      initialCount={initialCount}
    />
  );
}
