import { redirect } from 'next/navigation'
import { PropertyForm } from '@/components/PropertyForm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { createProperty } from './actions'

export default async function NuevaPropiedadPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasMockSession) {
    redirect('/admin/login')
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nueva Propiedad</h1>
        <p className="text-muted-foreground mt-2">Completa el formulario para agregar una nueva propiedad al catálogo. Las imágenes se pueden subir directamente desde tu computadora.</p>
      </div>

      <PropertyForm 
        actionFn={async (formData) => {
          'use server'
          await createProperty(formData)
        }} 
      />
    </div>
  )
}
