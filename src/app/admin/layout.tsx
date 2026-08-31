'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Home, FileText, DollarSign, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UFWidget } from '@/components/UFWidget'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Propiedades', href: '/admin', icon: Building },
    { name: 'Contenido', href: '/admin/contenido', icon: FileText },
    { name: 'UF', href: '/admin/uf', icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/admin" className="mr-8 flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight">NYS<span className="font-light">Admin</span></span>
          </Link>
          
          <nav className="flex items-center space-x-4 md:space-x-6 text-sm font-medium flex-1 overflow-x-auto whitespace-nowrap px-2 no-scrollbar">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 flex items-center gap-1.5 md:gap-2",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4 ml-2 shrink-0">
            <div className="hidden sm:block">
              <UFWidget />
            </div>

            <Link href="/" className="text-foreground/60 hover:text-foreground flex items-center gap-1.5 md:gap-2 text-sm font-medium transition-colors border-l pl-2 md:pl-4 border-border">
              <Home className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Ver Sitio</span>
            </Link>
            
            <form action="/admin/logout" method="POST">
              <button className="text-red-500 hover:text-red-600 flex items-center gap-1.5 md:gap-2 text-sm font-medium transition-colors">
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
