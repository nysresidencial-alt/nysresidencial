'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateSiteContent(key: string, title: string, content: string) {
  await prisma.siteContent.upsert({
    where: { key },
    update: { title, content },
    create: { key, title, content },
  })

  revalidatePath('/')
  revalidatePath('/nosotros')
  revalidatePath('/contacto')
  revalidatePath('/admin/contenido')
}
