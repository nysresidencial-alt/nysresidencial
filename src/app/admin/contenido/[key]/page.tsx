import prisma from '@/lib/db'
import { ContentForm } from './ContentForm'
import { requireAdminAuth } from '@/lib/admin-auth'

const DEFAULT_TITLES: Record<string, string> = {
  'fonos_superior': 'Teléfonos y Correos de Cabecera (Navbar)',
  'eslogan_cabecera': 'Eslogan Institucional del Sitio',
  'quienes_somos': 'Quiénes Somos (Página /nosotros)',
  'equipo': 'Nuestro Equipo (Página /equipo y /nosotros)',
  'vender_propiedad_info': 'Información: Vender tu Propiedad',
  'trabajar_con_nosotros_info': 'Información: Trabajar con Nosotros',
  'santiago_contacto': 'Santiago Info Contacto',
  'talca_contacto': 'Talca Info Contacto',
}

export default async function EditarContenidoPage({
  params
}: {
  params: Promise<{ key: string }>
}) {
  await requireAdminAuth('contenido', 'edit')

  const { key } = await params
  const defaultTitle = DEFAULT_TITLES[key] || key

  const contentRecord = await prisma.siteContent.findUnique({
    where: { key }
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Editar: {defaultTitle}</h1>
        <p className="text-muted-foreground mt-2">Los cambios guardados aquí se reflejarán automáticamente en el sitio público.</p>
      </div>

      <ContentForm 
        contentKey={key} 
        initialTitle={defaultTitle} 
        initialContent={contentRecord?.content || ''} 
      />
    </div>
  )
}
