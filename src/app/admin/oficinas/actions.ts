'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function deleteOffice(id: string) {
  await prisma.office.delete({ where: { id } })
  revalidatePath('/')
  revalidatePath('/contacto')
  revalidatePath('/admin/oficinas')
}

export async function toggleOfficeStatus(id: string, isActive: boolean) {
  await prisma.office.update({
    where: { id },
    data: { isActive }
  })
  revalidatePath('/')
  revalidatePath('/contacto')
  revalidatePath('/admin/oficinas')
}

export async function saveOffice(formData: FormData, id?: string) {
  const data = {
    name: formData.get('name') as string,
    address: formData.get('address') as string,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    mapLink: formData.get('mapLink') as string || null,
    order: parseInt(formData.get('order') as string) || 0,
    isActive: formData.get('isActive') === 'on'
  }

  if (id) {
    await prisma.office.update({
      where: { id },
      data
    })
  } else {
    await prisma.office.create({
      data
    })
  }

  revalidatePath('/')
  revalidatePath('/contacto')
  revalidatePath('/admin/oficinas')
}
