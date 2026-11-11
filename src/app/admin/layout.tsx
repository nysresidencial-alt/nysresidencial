import { getAdminSession } from '@/lib/admin-auth'
import { AdminNavbarClient } from '@/components/admin/AdminNavbarClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  return (
    <div className="min-h-screen bg-background flex flex-col" suppressHydrationWarning>
      <AdminNavbarClient
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
      />

      {/* Admin Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
