import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { DataManagementManager } from '@/components/admin/DataManagementManager'

export const metadata: Metadata = {
  title: 'Carga y Descarga de Datos (Excel) | NyS Residencial',
  description: 'Exportación de base de datos completa e importación masiva de propiedades y vouchers.',
}

export default async function DatosPage() {
  const session = await requireAdminAuth('vouchers', 'view')

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad && !session.permissions?.['vouchers']?.view) {
    redirect('/admin')
  }

  return <DataManagementManager />
}
