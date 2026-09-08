'use server'

import prisma from '@/lib/db'

export async function submitPublicationRequest(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      propertyType: formData.get('propertyType') as string,
      operation: formData.get('operation') as string,
      message: formData.get('message') as string,
    }

    await prisma.publicationRequest.create({
      data
    })

    return { success: true }
  } catch (error) {
    console.error('Error al guardar la solicitud:', error)
    return { success: false, error: 'Ocurrió un error al enviar la solicitud.' }
  }
}
