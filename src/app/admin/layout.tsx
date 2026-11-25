import { getAdminSession } from '@/lib/admin-auth'
import { AdminSidebarClient } from '@/components/admin/AdminSidebarClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  return (
    <AdminSidebarClient
      currentUser={
        session
          ? {
              name: session.name,
              email: session.email,
              roleName: session.roleName,
              isSuperadmin: session.isSuperadmin,
              permissions: session.permissions,
            }
          : null
      }
    >
      {children}
    </AdminSidebarClient>
  )
}
