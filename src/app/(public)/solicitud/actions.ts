'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitFullSolicitud(formData: FormData) {
  const tipo = (formData.get('tipo') as string) || 'vender'; // 'vender' | 'trabajar'
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || '';

  if (!name || !email) {
    return { success: false, error: 'Nombre y correo electrónico son requeridos.' };
  }

  try {
    if (tipo === 'vender') {
      const propertyType = (formData.get('propertyType') as string) || 'Propiedad';
      const operation = (formData.get('operation') as string) || 'Venta';
      const city = (formData.get('city') as string) || '';
      const sector = (formData.get('sector') as string) || '';
      const address = (formData.get('address') as string) || '';
      const currency = (formData.get('currency') as string) || 'UF';
      const price = (formData.get('price') as string) || '';
      const beds = (formData.get('beds') as string) || '';
      const baths = (formData.get('baths') as string) || '';
      const area = (formData.get('area') as string) || '';
      const comments = (formData.get('comments') as string) || '';

      const lines = [
        `=== SOLICITUD PARA VENDER / CONSIGNAR INMUEBLE ===`,
        `Operación requerida: ${operation}`,
        `Tipo de propiedad: ${propertyType}`,
        `Ubicación: ${city}${sector ? ` - Sector: ${sector}` : ''}${address ? ` (${address})` : ''}`,
        price ? `Valor estimado / deseado: ${currency} ${price}` : null,
        (beds || baths || area) ? `Dimensiones: ${beds ? `${beds} dormitorios` : ''} ${baths ? `| ${baths} baños` : ''} ${area ? `| ${area} m²` : ''}`.trim() : null,
        comments ? `Detalles adicionales:\n${comments}` : null,
      ].filter(Boolean);

      await prisma.publicationRequest.create({
        data: {
          name,
          email,
          phone,
          propertyType,
          operation: `Vender Propiedad (${operation})`,
          message: lines.join('\n'),
          status: 'Pendiente',
        }
      });
    } else {
      // Postulación laboral
      const role = (formData.get('role') as string) || 'Postulación General';
      const city = (formData.get('city') as string) || '';
      const experience = (formData.get('experience') as string) || 'No especificada';
      const availability = (formData.get('availability') as string) || 'Inmediata';
      const linkedin = (formData.get('linkedin') as string) || '';
      const presentation = (formData.get('presentation') as string) || '';

      const lines = [
        `=== POSTULACIÓN LABORAL: TRABAJA CON NOSOTROS ===`,
        `Área o cargo de interés: ${role}`,
        `Ciudad de residencia: ${city}`,
        `Experiencia en corretaje o ventas: ${experience}`,
        `Disponibilidad: ${availability}`,
        linkedin ? `Perfil LinkedIn / Enlace CV: ${linkedin}` : null,
        presentation ? `Presentación o resumen:\n${presentation}` : null,
      ].filter(Boolean);

      await prisma.publicationRequest.create({
        data: {
          name,
          email,
          phone,
          propertyType: 'Laboral',
          operation: `Trabaja con Nosotros: ${role}`,
          message: lines.join('\n'),
          status: 'Pendiente',
        }
      });
    }

    revalidatePath('/admin/solicitudes');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar solicitud especializada:', error);
    return { success: false, error: 'Hubo un error al procesar tu solicitud. Intenta nuevamente.' };
  }
}
