'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createProperty(formData: FormData) {
  let parsedImages: string[] = []
  try {
    const imagesRaw = formData.get('images') as string
    if (imagesRaw) {
      parsedImages = JSON.parse(imagesRaw)
    }
  } catch (e) {
    console.error('Error parsing images array', e)
  }

  const isAvailableRaw = formData.get('isAvailable')
  const isAvailable = isAvailableRaw === null ? true : (isAvailableRaw === 'true' || isAvailableRaw === 'on')
  const availabilityStatus = (formData.get('availabilityStatus') as string) || (isAvailable ? 'Disponible' : 'No Disponible')

  const data = {
    title: formData.get('title') as string,
    propertyType: formData.get('propertyType') as string,
    operation: formData.get('operation') as string,
    status: formData.get('status') as string,
    description: formData.get('description') as string,
    currency: formData.get('currency') as string,
    price: parseFloat(formData.get('price') as string),
    beds: parseInt(formData.get('beds') as string) || 0,
    baths: parseInt(formData.get('baths') as string) || 0,
    parking: parseInt(formData.get('parking') as string) || 0,
    builtArea: parseFloat(formData.get('builtArea') as string) || 0,
    landArea: parseFloat(formData.get('landArea') as string) || 0,
    city: formData.get('city') as string,
    sector: formData.get('sector') as string,
    address: formData.get('address') as string,
    googleMapsLink: formData.get('googleMapsLink') as string || null,
    
    salesRoom: formData.get('salesRoom') as string,
    executive: formData.get('executive') as string,
    images: parsedImages,
    publishedState: 'Publicado',
    isAvailable,
    availabilityStatus,
  }

  await prisma.property.create({
    data,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/portafolio')
  revalidatePath('/propiedades')
  revalidatePath('/')
}
