'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function deleteProperty(id: string) {
  try {
    await prisma.property.delete({
      where: { id },
    })
    
    revalidatePath('/admin')
    revalidatePath('/admin/portafolio')
    revalidatePath('/propiedades')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting property:", error)
    return { success: false, error: "No se pudo eliminar la propiedad." }
  }
}

export async function updatePropertyAvailability(
  id: string,
  isAvailable: boolean,
  availabilityStatus: string = isAvailable ? 'Disponible' : 'No Disponible'
) {
  try {
    await prisma.property.update({
      where: { id },
      data: {
        isAvailable,
        availabilityStatus,
      },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/portafolio')
    revalidatePath('/propiedades')
    revalidatePath(`/propiedades/${id}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error("Error updating property availability:", error)
    return { success: false, error: "No se pudo actualizar la disponibilidad de la propiedad." }
  }
}
