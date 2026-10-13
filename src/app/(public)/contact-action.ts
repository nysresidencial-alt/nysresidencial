'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitContactRequest(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || '';
  const operation = (formData.get('operation') as string) || 'Consulta general';
  const message = (formData.get('message') as string)?.trim() || '';

  if (!name || !email) {
    return { success: false, error: 'Por favor, ingresa tu nombre y correo electrónico.' };
  }

  // Clasificación para la columna propertyType del panel de control
  let propertyType = 'General';
  if (operation.includes('vender') || operation.includes('comprar')) {
    propertyType = 'Compra / Venta';
  } else if (operation.includes('arriendo') || operation.includes('arrendar')) {
    propertyType = 'Arriendo';
  } else if (operation.includes('Trabaja')) {
    propertyType = 'Postulación Laboral';
  } else if (operation.includes('Tasación') || operation.includes('Asesoría')) {
    propertyType = 'Servicios Inmobiliarios';
  }

  try {
    await prisma.publicationRequest.create({
      data: {
        name,
        email,
        phone,
        operation,
        propertyType,
        message: message || `Solicitud ingresada desde la web: ${operation}`,
        status: 'Pendiente'
      }
    });

    revalidatePath('/admin/solicitudes');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar solicitud de contacto:', error);
    return { 
      success: false, 
      error: 'Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.' 
    };
  }
}
