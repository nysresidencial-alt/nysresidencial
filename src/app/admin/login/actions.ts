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
  let dbLookupFailed = false
  try {
    console.log('[login] Buscando AdminUser para:', email)
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      include: { role: true },
    })

    console.log('[login] AdminUser encontrado:', adminUser ? `${adminUser.email} (activo: ${adminUser.isActive})` : 'NO')

    if (adminUser) {
      if (!adminUser.isActive) {
        return { error: 'Tu cuenta de administrador se encuentra inactiva. Contacta al Superadmin.' }
      }

      const isValid = verifyPassword(password, adminUser.passwordHash)
      console.log('[login] Verificación de contraseña:', isValid ? 'VÁLIDA' : 'INVÁLIDA')
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
    console.error('[login] Error durante consulta AdminUser:', err)
    dbLookupFailed = true
    // Devolver el error específico si falló la conexión con Prisma/DB en Vercel
    return { error: `Error de conexión BD: ${err.message || 'No se pudo conectar'}` }
  }

  if (dbLookupFailed) {
    return { error: 'No se pudo conectar con la base de datos. Contacta al administrador.' }
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

  // Si se autenticó por Supabase Auth, sincronizar la sesión RBAC de AdminUser si existe
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      include: { role: true },
    })

    if (adminUser && adminUser.isActive) {
      await createAdminSession({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        roleId: adminUser.role.id,
        roleName: adminUser.role.name,
      })
    }
  } catch (e) {
    console.warn('[login] No se pudo sincronizar la sesión RBAC tras login con Supabase:', e)
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

