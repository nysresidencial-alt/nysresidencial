'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'El email y la contraseña son requeridos' }
  }

  // --- MOCK TEMPORAL DE LOGIN ---
  if (email === 'admin@nys.cl' && password === 'nysresidencialadmin') {
    // Seteamos una cookie para que el middleware sepa que está autenticado
    const { cookies } = await import('next/headers')
    ;(await cookies()).set('mock_admin_session', 'true', { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/admin')
    return
  }
  // ------------------------------

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}
