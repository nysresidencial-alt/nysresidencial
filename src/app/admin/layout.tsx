'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LogOut, Home, FileText, DollarSign, Building, MessageSquare, Image as ImageIcon, MapPin, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UFWidget } from '@/components/UFWidget'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  // En la página de login no mostramos la barra del panel de administración
  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  const navItems = [
    { name: 'Propiedades', href: '/admin', icon: Building },
    { name: 'Portafolio PDF', href: '/admin/portafolio', icon: Printer },
    { name: 'Carrusel', href: '/admin/carrusel', icon: ImageIcon },
    { name: 'Contenido', href: '/admin/contenido', icon: FileText },
    { name: 'UF', href: '/admin/uf', icon: DollarSign },
    { name: 'Solicitudes', href: '/admin/solicitudes', icon: MessageSquare },
    { name: 'Oficinas', href: '/admin/oficinas', icon: MapPin },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col" suppressHydrationWarning>
      {/* Admin Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/admin" className="mr-8 flex items-center space-x-2.5 group">
            <div className="relative h-9 w-12 shrink-0">
              <Image
                src="/logo-nys.png"
                alt="NyS Admin"
                fill
                priority
                className="object-contain"
              />
            </div>
            <span className="font-bold text-lg tracking-tight">Admin</span>
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
                    isActive ? "text-foreground font-semibold" : "text-foreground/60"
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
            
            <form action="/admin/logout" method="POST" suppressHydrationWarning>
              <button 
                type="submit"
                suppressHydrationWarning
                className="text-red-500 hover:text-red-600 flex items-center gap-1.5 md:gap-2 text-sm font-medium transition-colors cursor-pointer"
              >
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
