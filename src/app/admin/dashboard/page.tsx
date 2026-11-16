import { requireAdminAuth } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAccountingDashboardData } from './actions'
import { AccountingDashboard } from '@/components/admin/AccountingDashboard'

export const metadata: Metadata = {
  title: 'Dashboard de Contabilidad | NyS Residencial',
  description: 'Panel de indicadores financieros, recaudación mensual, vouchers y eventos de arriendos.',
}

export default async function DashboardPage() {
  const session = await requireAdminAuth('vouchers', 'view')

  const isContabilidad = session.roleName?.toLowerCase().includes('contabilidad')
  if (!session.isSuperadmin && !isContabilidad && !session.permissions?.['vouchers']?.view) {
    redirect('/admin')
  }

  const data = await getAccountingDashboardData()

  return (
    <div className="space-y-6">
      <AccountingDashboard initialData={data} />
    </div>
  )
}
