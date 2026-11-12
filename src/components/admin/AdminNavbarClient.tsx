'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Home,
  FileText,
  DollarSign,
  Building,
  MessageSquare,
  Image as ImageIcon,
  MapPin,
  Printer,
  Users,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UFWidget } from '@/components/UFWidget';
import { useTheme } from '@/components/ThemeProvider';
import { PermissionsMatrix } from '@/lib/permissions-config';

interface AdminNavProps {
  currentUser?: {
    name: string
    email: string
    roleName: string
    isSuperadmin: boolean
    permissions: PermissionsMatrix
  } | null
}

export function AdminNavbarClient({ currentUser }: AdminNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  if (pathname?.startsWith('/admin/login')) {
    return null;
  }

  const allNavItems = [
    { key: 'propiedades', name: 'Propiedades', href: '/admin', icon: Building },
    { key: 'clientes', name: 'Clientes', href: '/admin/clientes', icon: Users },
    { key: 'portafolio', name: 'Portafolio PDF', href: '/admin/portafolio', icon: Printer },
    { key: 'carrusel', name: 'Carrusel', href: '/admin/carrusel', icon: ImageIcon },
    { key: 'contenido', name: 'Contenido', href: '/admin/contenido', icon: FileText },
    { key: 'uf', name: 'UF', href: '/admin/uf', icon: DollarSign },
    { key: 'solicitudes', name: 'Solicitudes', href: '/admin/solicitudes', icon: MessageSquare },
    { key: 'oficinas', name: 'Oficinas', href: '/admin/oficinas', icon: MapPin },
    { key: 'usuarios', name: 'Usuarios y Roles', href: '/admin/usuarios', icon: Shield },
  ];

  // Filtrar ítems de navegación según permisos del usuario conectado
  const visibleNavItems = allNavItems.filter((item) => {
    // Si no hay sesión RBAC (ej: sesión mock histórica previa), mostrar ítems estándar
    if (!currentUser) {
      return item.key !== 'usuarios';
    }
    // Superadmin ve todo
    if (currentUser.isSuperadmin) {
      return true;
    }
    // Para roles con permisos específicos
    const modPerm = currentUser.permissions[item.key];
    return Boolean(modPerm?.view);
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" suppressHydrationWarning>
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/admin" className="mr-6 flex items-center space-x-2.5 group shrink-0">
          <div className="relative h-9 w-12 shrink-0">
            <Image src="/logo-nys.png" alt="NyS Admin" fill priority className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-tight">Admin</span>
            {currentUser && (
              <span className="text-[10px] text-muted-foreground font-semibold line-clamp-1">
                {currentUser.roleName}
              </span>
            )}
          </div>
        </Link>

        {/* Menú de navegación dinámico */}
        <nav className="flex items-center space-x-3 md:space-x-5 text-sm font-medium flex-1 overflow-x-auto whitespace-nowrap px-2 no-scrollbar">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80 flex items-center gap-1.5 md:gap-2 py-1',
                  isActive ? 'text-primary font-bold' : 'text-foreground/60'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : '')} />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Acciones Derecha */}
        <div className="flex items-center space-x-2 md:space-x-3 ml-2 shrink-0">
          <div className="hidden lg:block">
            <UFWidget />
          </div>

          <Link
            href="/"
            target="_blank"
            className="text-foreground/60 hover:text-foreground flex items-center gap-1.5 text-xs font-semibold transition-colors border-l pl-2 md:pl-3 border-border"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Ver Sitio</span>
          </Link>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50 cursor-pointer"
            title="Cambiar tema claro/oscuro"
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <form action="/admin/logout" method="POST" suppressHydrationWarning>
            <button
              type="submit"
              suppressHydrationWarning
              className="text-red-500 hover:text-red-600 flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Cerrar sesión administrativa"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
