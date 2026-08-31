import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { ContentForm } from './ContentForm'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const DEFAULT_TITLES: Record<string, string> = {
  'quienes_somos': 'Quiénes Somos',
  'equipo': 'Equipo',
  'santiago_contacto': 'Santiago Info Contacto',
  'talca_contacto': 'Talca Info Contacto',
  'fonos_superior': 'Fonos Parte Superior',
}

export default async function EditarContenidoPage({
  params
}: {
  params: Promise<{ key: string }>
}) {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const hasMockSession = cookieStore.get('mock_admin_session')?.value === 'true'

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !hasMockSession) {
    redirect('/admin/login')
  }

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
