'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function deleteProperty(id: string) {
  try {
    await prisma.property.delete({
      where: { id },
    })
    
    revalidatePath('/admin')
    revalidatePath('/propiedades')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error("Error deleting property:", error)
    return { success: false, error: "No se pudo eliminar la propiedad." }
  }
}
