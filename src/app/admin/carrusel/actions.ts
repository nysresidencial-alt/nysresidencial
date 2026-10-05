"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveHeroCarousel(urls: string[]) {
  // Eliminar todas las imagenes actuales
  await prisma.heroImage.deleteMany();

  // Crear los nuevos records
  if (urls.length > 0) {
    await prisma.heroImage.createMany({
      data: urls.map((url, index) => ({
        url,
        order: index,
        isActive: true,
      })),
    });
  }

  // Revalidar las paginas
  revalidatePath("/");
  revalidatePath("/admin/carrusel");
}
