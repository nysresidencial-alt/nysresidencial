'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateRequestStatus(id: string, status: string) {
  await prisma.publicationRequest.update({
    where: { id },
    data: { status }
  });

  revalidatePath('/admin/solicitudes');
}

export async function deleteRequest(id: string) {
  await prisma.publicationRequest.delete({
    where: { id }
  });

  revalidatePath('/admin/solicitudes');
}
