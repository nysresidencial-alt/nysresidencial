import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Limpiar el mock si existe
  const cookieStore = await cookies()
  if (cookieStore.get('mock_admin_session')) {
    cookieStore.delete('mock_admin_session')
  }

  redirect('/admin/login')
}
