'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Building,
  Users,
  Printer,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  FileSpreadsheet,
  Receipt,
  MapPin,
  Shield,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Crown,
  Sparkles,
  Layers,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { PermissionsMatrix } from '@/lib/permissions-config';

interface AdminNavProps {
  currentUser?: {
    name: string;
    email: string;
    roleName: string;
    isSuperadmin: boolean;
    permissions: PermissionsMatrix;
  } | null;
}

interface NavItem {
  key: string;
  name: string;
  href: string;
  icon: any;
  description: string;
  badge?: string;
}

interface NavGroup {
  id: string;
  name: string;
  icon: any;
  items: NavItem[];
}

export function AdminNavbarClient({ currentUser }: AdminNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Estados para dropdowns de navegación desktop
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  if (pathname?.startsWith('/admin/login')) {
    return null;
  }

  // Comprobar si el usuario actual tiene permiso de visualización para un módulo
  function hasPermission(key: string): boolean {
    if (!currentUser) {
      return key !== 'usuarios' && key !== 'vouchers' && key !== 'arriendos';
    }
    if (currentUser.isSuperadmin) return true;

    // Vouchers y Arriendos exclusivo para Contabilidad (o quien tenga permiso explícito)
    if (key === 'vouchers' || key === 'arriendos') {
      const isContabilidad = currentUser.roleName?.toLowerCase().includes('contabilidad');
      return Boolean(isContabilidad && (currentUser.permissions?.[key]?.view ?? true));
    }

    const modPerm = currentUser.permissions?.[key];
    return Boolean(modPerm?.view);
  }

  // Definición de todos los módulos del sistema organizados por categorías
  const rawGroups: NavGroup[] = [
    {
      id: 'propiedades',
      name: 'Propiedades',
      icon: Building,
      items: [
        {
          key: 'propiedades',
          name: 'Propiedades',
          href: '/admin',
          icon: Building,
          description: 'Gestión del portafolio inmobiliario en venta y arriendo',
        },
      ],
    },
    {
      id: 'finanzas',
      name: 'Finanzas',
      icon: Receipt,
      items: [
        {
          key: 'arriendos',
          name: 'Maestro de Arriendos',
          href: '/admin/arriendos',
          icon: FileSpreadsheet,
          description: 'Contratos, valores base, reajustes y fechas de arriendos',
        },
        {
          key: 'vouchers',
          name: 'Vouchers y Recibos',
          href: '/admin/vouchers',
          icon: Receipt,
          description: 'Liquidaciones mensuales, control de recaudación y pagos',
        },
      ],
    },
    {
      id: 'comercial',
      name: 'Comercial',
      icon: Users,
      items: [
        {
          key: 'clientes',
          name: 'Clientes',
          href: '/admin/clientes',
          icon: Users,
          description: 'Fichas de clientes, RUT y repositorio de documentos',
        },
        {
          key: 'solicitudes',
          name: 'Solicitudes Web',
          href: '/admin/solicitudes',
          icon: MessageSquare,
          description: 'Consultas de contacto y captación de propiedades',
        },
        {
          key: 'portafolio',
          name: 'Portafolio PDF',
          href: '/admin/portafolio',
          icon: Printer,
          description: 'Generación y exportación de catálogos en PDF',
        },
      ],
    },
    {
      id: 'sitio_web',
      name: 'Sitio Web',
      icon: Globe,
      items: [
        {
          key: 'contenido',
          name: 'Contenido y Equipo',
          href: '/admin/contenido',
          icon: FileText,
          description: 'Quiénes somos, equipo humano, fotos y textos del portal',
        },
        {
          key: 'carrusel',
          name: 'Carrusel Principal',
          href: '/admin/carrusel',
          icon: ImageIcon,
          description: 'Imágenes del hero de la página de inicio',
        },
        {
          key: 'oficinas',
          name: 'Oficinas y Sucursales',
          href: '/admin/oficinas',
          icon: MapPin,
          description: 'Sedes en Talca y Santiago con mapa y contactos',
        },
      ],
    },
    {
      id: 'seguridad',
      name: 'Seguridad',
      icon: Shield,
      items: [
        {
          key: 'usuarios',
          name: 'Usuarios y Roles',
          href: '/admin/usuarios',
          icon: Shield,
          description: 'Control de accesos administrativos y matriz de permisos',
        },
      ],
    },
  ];

  // Filtrar grupos e ítems según permisos del usuario activo
  const visibleGroups = rawGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.key)),
    }))
    .filter((group) => group.items.length > 0);

  // Manejo de hover con retardo suave en desktop
  const handleMouseEnter = (groupId: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(groupId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 transition-colors shadow-2xs">
      <div className="max-w-[1400px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* LOGO & IDENTIFICADOR */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="relative h-9 w-11 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo-nys.png"
                alt="NyS Admin"
                fill
                priority
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-tight text-foreground flex items-center gap-1.5">
                <span>NyS</span>
                <span className="text-primary font-black">Admin</span>
              </span>
              {currentUser && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                  {currentUser.isSuperadmin ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Crown className="w-2.5 h-2.5" />
                      <span>Superadmin</span>
                    </span>
                  ) : (
                    <span>{currentUser.roleName || 'Colaborador'}</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* NAVEGACIÓN DESKTOP COMPACTA & ORGANIZADA (PANTALLAS >= LG) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {visibleGroups.map((group) => {
            // Si el grupo tiene solo 1 ítem accesible (como "Propiedades" o "Seguridad"), se muestra como botón directo
            if (group.items.length === 1) {
              const item = group.items[0];
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-2xs ring-1 ring-primary/30'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <span>{item.name}</span>
                </Link>
              );
            }

            // Si el grupo tiene 2 o más ítems (como "Finanzas", "Comercial", "Sitio Web"), se renderiza como dropdown elegante
            const hasActiveChild = group.items.some((item) =>
              pathname.startsWith(item.href)
            );
            const isOpen = openDropdown === group.id;
            const GroupIcon = group.icon;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : group.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none',
                    hasActiveChild
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : isOpen
                      ? 'bg-muted text-foreground'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <GroupIcon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      hasActiveChild ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span>{group.name}</span>
                  {hasActiveChild && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* Popover Dropdown Flotante */}
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1.5 w-72 p-2 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150 z-50"
                  >
                    <div className="px-3 py-1.5 mb-1 border-b border-border/50 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>{group.name}</span>
                      <span className="text-[10px] font-medium lowercase">
                        {group.items.length} módulos
                      </span>
                    </div>

                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isItemActive = pathname.startsWith(item.href);
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className={cn(
                              'flex items-start gap-3 p-2.5 rounded-xl transition-all group/item',
                              isItemActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'hover:bg-muted/60 text-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'p-2 rounded-lg shrink-0 transition-colors',
                                isItemActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground group-hover/item:text-primary group-hover/item:bg-primary/10'
                              )}
                            >
                              <ItemIcon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                <span className="truncate">{item.name}</span>
                                {isItemActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ACCIONES LATERALES: SITIO WEB, TEMA, USUARIO Y SALIR */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Botón Ver Sitio Web */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground/80 hover:text-foreground text-xs font-bold transition-all shadow-2xs"
            title="Abrir el sitio web público en una nueva pestaña"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>Ver Sitio</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>

          {/* Toggle Tema Claro / Oscuro */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted border border-transparent hover:border-border cursor-pointer"
            title="Cambiar tema claro / oscuro"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Perfil del Usuario / Salir */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            {currentUser && (
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                  {currentUser.email}
                </span>
              </div>
            )}

            <form action="/admin/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>

          {/* Botón Hamburger Móvil (Pantallas < LG) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground cursor-pointer"
            title="Abrir menú"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL / TABLET DESPLEGABLE */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card p-4 space-y-4 animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {/* Datos del usuario conectado en móvil */}
          {currentUser && (
            <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-foreground">{currentUser.name}</div>
                <div className="text-[11px] text-muted-foreground">{currentUser.email}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                {currentUser.roleName}
              </span>
            </div>
          )}

          {/* Lista de grupos de navegación */}
          <div className="space-y-2">
            {visibleGroups.map((group) => {
              if (group.items.length === 1) {
                const item = group.items[0];
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/30 hover:bg-muted text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              }

              const isAccordionOpen = openMobileAccordion === group.id;
              const hasActiveChild = group.items.some((item) =>
                pathname.startsWith(item.href)
              );
              const GroupIcon = group.icon;

              return (
                <div key={group.id} className="rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMobileAccordion(isAccordionOpen ? null : group.id)
                    }
                    className={cn(
                      'w-full flex items-center justify-between p-3 text-xs font-bold transition-colors cursor-pointer',
                      hasActiveChild
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/30 text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <GroupIcon className="w-4 h-4 text-primary" />
                      <span>{group.name}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isAccordionOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isAccordionOpen && (
                    <div className="p-2 space-y-1 bg-card border-t border-border/50">
                      {group.items.map((item) => {
                        const isItemActive = pathname.startsWith(item.href);
                        const ItemIcon = item.icon;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-semibold transition-all',
                              isItemActive
                                ? 'bg-primary text-primary-foreground font-bold'
                                : 'text-foreground/80 hover:bg-muted'
                            )}
                          >
                            <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Enlace ver sitio en móvil */}
          <Link
            href="/"
            target="_blank"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-muted"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span>Ver Sitio Web Público</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      )}
    </header>
  );
}
