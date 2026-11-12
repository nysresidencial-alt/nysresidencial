import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { PropertyForm } from '@/components/PropertyForm'
import { updateProperty } from './actions'
import { requireAdminAuth } from '@/lib/admin-auth'

export default async function EditarPropiedadPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminAuth('propiedades', 'edit')

  const { id } = await params
  
  const property = await prisma.property.findUnique({
    where: { id }
  })

  if (!property) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Editar Propiedad</h1>
        <p className="text-muted-foreground mt-2">Modifica los detalles de la publicación. Los cambios se reflejarán inmediatamente en el sitio público.</p>
      </div>

      <PropertyForm 
        property={property} 
        actionFn={async (formData) => {
          'use server'
          await updateProperty(id, formData)
        }} 
      />
    </div>
  )
}
