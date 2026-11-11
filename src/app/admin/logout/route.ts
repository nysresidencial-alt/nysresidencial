import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { clearAdminSession } from '@/lib/admin-auth'

export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {
    // Si no está en supabase auth no pasa nada
  }

  await clearAdminSession()
  redirect('/admin/login')
}

export async function GET() {
  await clearAdminSession()
  redirect('/admin/login')
}
