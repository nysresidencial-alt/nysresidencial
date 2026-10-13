import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://nysresidencial.cl';

  // Rutas estáticas clave
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/propiedades`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/solicitud`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/equipo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Rutas dinámicas para cada propiedad activa en la plataforma
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await prisma.property.findMany({
      where: { publishedState: 'Publicado' },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    propertyRoutes = properties.map((prop) => ({
      url: `${baseUrl}/propiedades/${prop.id}`,
      lastModified: prop.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error generando sitemap de propiedades:', error);
  }

  return [...staticRoutes, ...propertyRoutes];
}
