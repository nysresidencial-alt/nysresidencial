'use server'

import prisma from '../../../lib/db'
console.log('DEBUG prisma imported:', !!prisma)
import { createClientSession, clearClientSession } from '@/lib/client-auth'
import { redirect } from 'next/navigation'

export async function loginClient(formData: FormData) {
  const identifier = (formData.get('identifier') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!identifier || !password) {
    return { error: 'Por favor, ingresa tu usuario, RUT o correo y tu contraseña.' }
  }

  try {
    console.log('Login attempt identifier:', identifier)
    const client = await prisma.clientUser.findFirst({
      where: {
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
          { rut: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    })
    console.log('Client fetched:', client?.id)

    if (!client) {
      return { error: 'Usuario no encontrado. Verifica tu RUT, correo o usuario.' };
    }

    if (!client.isActive) {
      return { error: 'Tu cuenta se encuentra temporalmente inactiva. Por favor, comunícate con tu asesor NyS.' }
    }

    // Verify password (plain match or trimmed)
    if (client.password !== password) {
      return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' }
    }

    await createClientSession(client)
  } catch (err: any) {
    console.error('Login error:', err)
    return { error: 'Ocurrió un error al iniciar sesión. Inténtalo nuevamente.' }
  }

  redirect('/oficina-virtual')
}

export async function logoutClient() {
  await clearClientSession()
  redirect('/')
}
