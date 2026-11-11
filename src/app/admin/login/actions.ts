'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createAdminSession } from '@/lib/admin-auth'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { error: 'El email y la contraseña son requeridos' }
  }

  // 1. Verificar si existe como AdminUser en la base de datos (Superadmin y roles RBAC)
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      include: { role: true },
    })

    if (adminUser) {
      if (!adminUser.isActive) {
        return { error: 'Tu cuenta de administrador se encuentra inactiva. Contacta al Superadmin.' }
      }

      const isValid = verifyPassword(password, adminUser.passwordHash)
      if (isValid) {
        // Actualizar último login
        try {
          await prisma.adminUser.update({
            where: { id: adminUser.id },
            data: { lastLoginAt: new Date() },
          })
        } catch (e) {
          console.warn('Could not update lastLoginAt:', e)
        }

        await createAdminSession({
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          roleId: adminUser.role.id,
          roleName: adminUser.role.name,
        })

        revalidatePath('/', 'layout')
        redirect('/admin')
      } else {
        return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' }
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('NEXT_REDIRECT')) {
      throw err
    }
    console.error('Error during adminUser login lookup:', err)
    // Devolver el error específico si falló la conexión con Prisma/DB en Vercel
    return { error: `Error en base de datos: ${err.message || 'No se pudo conectar'}` }
  }

  // 2. MOCK de respaldo histórico (para no romper accesos previos si aún se usan)
  if (email === 'admin@nys.cl' && password === 'nysresidencialadmin') {
    const { cookies } = await import('next/headers')
    ;(await cookies()).set('mock_admin_session', 'true', { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/admin')
  }

  // 3. Fallback a Supabase Auth si la cuenta fue creada allí
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message || 'Credenciales inválidas.' }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

