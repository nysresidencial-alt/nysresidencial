import { PropertyForm } from '@/components/PropertyForm'
import { createProperty } from './actions'
import { requireAdminAuth } from '@/lib/admin-auth'

export default async function NuevaPropiedadPage() {
  await requireAdminAuth('propiedades', 'create')

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
