import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getPropietarios } from './actions'
import { PropietariosManager } from '@/components/admin/PropietariosManager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Propietarios y Asignatarios | NyS Admin',
  description: 'Administración de propietarios, asignatarios, RUT oficial y cartera inmobiliaria.',
}

export default async function PropietariosAdminPage() {
  const session = await requireAdminAuth('vouchers', 'view')

  // Acceso exclusivo: rol Contabilidad o Superadmin
  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad) {
    redirect('/admin')
  }

  const owners = await getPropietarios()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PropietariosManager
        initialOwners={owners}
        currentRole={session.roleName}
        isSuperadmin={session.isSuperadmin}
      />
    </div>
  )
}
