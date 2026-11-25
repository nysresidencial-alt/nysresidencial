'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Crown,
  Globe,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  CalendarClock,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { PermissionsMatrix } from '@/lib/permissions-config';

interface AdminSidebarProps {
  children: React.ReactNode;
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
  items: NavItem[];
}

export function AdminSidebarClient({ children, currentUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Estados: Colapso de sidebar desktop y Drawer móvil
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Inicializar estado guardado en localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('nys-admin-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Guardar preferencia de colapso
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nys-admin-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Cerrar drawer móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Si estamos en login administrativo, renderizar directo sin layout
  if (pathname?.startsWith('/admin/login')) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Verificación de permisos según rol
  function hasPermission(key: string): boolean {
    if (!currentUser) {
      return key !== 'usuarios' && key !== 'vouchers' && key !== 'arriendos' && key !== 'contratos';
    }
    if (currentUser.isSuperadmin) return true;

    // Módulos contables
    if (
      key === 'dashboard' ||
      key === 'vouchers' ||
      key === 'arriendos' ||
      key === 'contratos' ||
      key === 'propietarios' ||
      key === 'datos' ||
      key === 'correos'
    ) {
      const isContabilidad = currentUser.roleName?.toLowerCase().includes('contabilidad');
      return Boolean(isContabilidad || (currentUser.permissions?.[key]?.view ?? false));
    }

    const modPerm = currentUser.permissions?.[key];
    return Boolean(modPerm?.view);
  }

  // Definición de grupos y enlaces del sistema
  const rawGroups: NavGroup[] = [
    {
      id: 'finanzas',
      name: 'Finanzas & Arriendos',
      items: [
        {
          key: 'dashboard',
          name: 'Dashboard Contable',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
          description: 'Métricas, recaudación mensual y proyección',
        },
        {
          key: 'arriendos',
          name: 'Propiedades y Arriendos',
          href: '/admin/arriendos',
          icon: Building,
          description: 'Contratos, valores base y cartera activa',
        },
        {
          key: 'contratos',
          name: 'Contratos y Renovaciones',
          href: '/admin/contratos',
          icon: CalendarClock,
          description: 'Control preventivo de vigencias y cláusulas',
          badge: 'Nuevo',
        },
        {
          key: 'vouchers',
          name: 'Vouchers y Recibos',
          href: '/admin/vouchers',
          icon: Receipt,
          description: 'Liquidaciones mensuales y control de pagos',
        },
        {
          key: 'propietarios',
          name: 'Propietarios',
          href: '/admin/propietarios',
          icon: ShieldCheck,
          description: 'Gestión de Asignatarios, RUT y cartera',
        },
      ],
    },
    {
      id: 'herramientas',
      name: 'Herramientas & Datos',
      items: [
        {
          key: 'datos',
          name: 'Carga de Datos (Excel)',
          href: '/admin/datos',
          icon: FileSpreadsheet,
          description: 'Importar y exportar la base completa',
        },
        {
          key: 'correos',
          name: 'Correos y Notificaciones',
          href: '/admin/correos',
          icon: Mail,
          description: 'Directorio y envío masivo a arrendatarios',
        },
      ],
    },
    {
      id: 'gestion_inmobiliaria',
      name: 'Gestión Inmobiliaria',
      items: [
        {
          key: 'propiedades',
          name: 'Portafolio Web',
          href: '/admin',
          icon: Layers,
          description: 'Inmuebles públicos en venta y arriendo',
        },
        {
          key: 'solicitudes',
          name: 'Solicitudes Web',
          href: '/admin/solicitudes',
          icon: MessageSquare,
          description: 'Consultas de contacto y captación',
        },
        {
          key: 'portafolio',
          name: 'Portafolio PDF',
          href: '/admin/portafolio',
          icon: Printer,
          description: 'Generación de catálogos en PDF',
        },
      ],
    },
    {
      id: 'sitio_web',
      name: 'Sitio Web Público',
      items: [
        {
          key: 'contenido',
          name: 'Contenido y Equipo',
          href: '/admin/contenido',
          icon: FileText,
          description: 'Textos institucionales y miembros del equipo',
        },
        {
          key: 'carrusel',
          name: 'Carrusel Principal',
          href: '/admin/carrusel',
          icon: ImageIcon,
          description: 'Imágenes del hero del portal',
        },
        {
          key: 'oficinas',
          name: 'Oficinas y Sucursales',
          href: '/admin/oficinas',
          icon: MapPin,
          description: 'Sedes y mapas de contacto',
        },
      ],
    },
    {
      id: 'sistema',
      name: 'Sistema & Seguridad',
      items: [
        {
          key: 'usuarios',
          name: 'Usuarios y Roles',
          href: '/admin/usuarios',
          icon: Shield,
          description: 'Control de accesos y matriz de permisos',
        },
      ],
    },
  ];

  // Filtrar grupos con permisos activos
  const visibleGroups = rawGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => hasPermission(item.key)),
    }))
    .filter((g) => g.items.length > 0);

  // Determinar la vista activa actual para el Breadcrumb superior
  const currentItem = visibleGroups
    .flatMap((g) => g.items.map((i) => ({ ...i, groupName: g.name })))
    .find((item) => {
      if (item.href === '/admin') {
        return pathname === '/admin';
      }
      return pathname.startsWith(item.href);
    });

  // Iniciales del usuario
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'US';

  return (
    <div className="min-h-screen bg-background text-foreground flex" suppressHydrationWarning>
      {/* ========================================================================= */}
      {/* 1. SIDEBAR LATERAL IZQUIERDO (DESKTOP) */}
      {/* ========================================================================= */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 left-0 z-40 bg-card border-r border-border transition-all duration-300 ease-in-out shadow-xs select-none',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Header del Sidebar (Logo + Toggle) */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-border px-4 transition-all',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/admin" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-8 w-10 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo-nys.png"
                alt="NyS Admin"
                fill
                priority
                unoptimized
                className="object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight leading-tight text-foreground flex items-center gap-1">
                  <span>NyS</span>
                  <span className="text-primary">Admin</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Gestión Corporativa
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Contraer barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón rápido para expandir si está colapsado */}
        {isCollapsed && (
          <div className="pt-2 px-2 flex justify-center">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cuerpo de Enlaces de Navegación */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {/* Título de categoría */}
              {!isCollapsed ? (
                <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                  {group.name}
                </div>
              ) : (
                <div className="h-px bg-border/60 mx-2 my-2" />
              )}

              {/* Items del grupo */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  const ItemIcon = item.icon;

                  return (
                    <div key={item.href} className="relative group/item">
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground font-bold shadow-xs shadow-primary/25'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70',
                          isCollapsed ? 'justify-center px-0' : ''
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <ItemIcon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-transform group-hover/item:scale-110',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover/item:text-foreground'
                          )}
                        />

                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider',
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>

                      {/* Tooltip flotante cuando el sidebar está colapsado */}
                      {isCollapsed && (
                        <div className="hidden group-hover/item:flex fixed left-20 ml-2 px-3 py-1.5 rounded-xl bg-popover text-popover-foreground border border-border shadow-xl text-xs font-bold items-center gap-2 z-50 pointer-events-none whitespace-nowrap animate-in fade-in-50 zoom-in-95">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer del Sidebar (Usuario, Tema y Cerrar Sesión) */}
        <div className="p-3 border-t border-border bg-card/60 space-y-2">
          {currentUser && (
            <div
              className={cn(
                'flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border/80 transition-all',
                isCollapsed ? 'justify-center p-1.5' : ''
              )}
            >
              <div
                className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/20"
                title={`${currentUser.name} (${currentUser.roleName})`}
              >
                {userInitials}
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground truncate">
                    {currentUser.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {currentUser.roleName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones de Footer: Selector de Modo y Salir */}
          <div
            className={cn(
              'flex items-center gap-1',
              isCollapsed ? 'flex-col' : 'justify-between'
            )}
          >
            {/* Toggle Tema */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'flex items-center gap-2 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer text-xs font-semibold',
                isCollapsed ? 'w-full justify-center' : 'flex-1'
              )}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  {!isCollapsed && <span>Modo Claro</span>}
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700 shrink-0" />
                  {!isCollapsed && <span>Modo Oscuro</span>}
                </>
              )}
            </button>

            {/* Botón Salir */}
            <form action="/admin/logout" method="POST" className={isCollapsed ? 'w-full' : ''}>
              <button
                type="submit"
                className={cn(
                  'flex items-center gap-2 p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-xs font-semibold',
                  isCollapsed ? 'w-full justify-center' : ''
                )}
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Salir</span>}
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. DRAWER MÓVIL (PANTALLAS < LG) */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Fondo oscuro con desenfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Panel lateral móvil */}
          <div className="relative w-72 max-w-[85vw] bg-card border-r border-border h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header móvil */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <Link href="/admin" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3">
                <div className="relative h-8 w-10 shrink-0">
                  <Image src="/logo-nys.png" alt="NyS Admin" fill unoptimized className="object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm text-foreground">
                    NyS <span className="text-primary">Admin</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {currentUser?.roleName || 'Portal'}
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de navegación móvil */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {visibleGroups.map((group) => (
                <div key={group.id} className="space-y-1">
                  <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                    {group.name}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                            isActive
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                          )}
                        >
                          <ItemIcon className="w-4 h-4 shrink-0" />
                          <span className="flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer móvil */}
            <div className="p-4 border-t border-border bg-card/60 space-y-3">
              {currentUser && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/40 border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{currentUser.email}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold border border-border bg-muted/40 hover:bg-muted"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                </button>
                <form action="/admin/logout" method="POST" className="flex-1">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Salir</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ÁREA DE CONTENIDO PRINCIPAL + HEADER SUPERIOR */}
      {/* ========================================================================= */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* TOPBAR MINIMALISTA & ELEGANTE */}
        <header className="sticky top-0 z-30 h-16 bg-card/85 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between transition-colors shadow-2xs">
          {/* Lado izquierdo: Botón móvil + Breadcrumb / Identificador de página */}
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa móvil */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground cursor-pointer"
              title="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Toggle desktop visible en topbar para máxima comodidad */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer border border-transparent hover:border-border"
              title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb contextual */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground hidden sm:inline">
                {currentItem?.groupName || 'Administración'}
              </span>
              <span className="text-muted-foreground/40 hidden sm:inline">/</span>
              <span className="font-extrabold text-foreground truncate max-w-[200px] sm:max-w-none">
                {currentItem?.name || 'Panel de Control'}
              </span>
              {currentItem?.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  {currentItem.badge}
                </span>
              )}
            </div>
          </div>

          {/* Lado derecho: Ver Sitio Web + Toggle Modo + Perfil Rápido */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Enlace al sitio público */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-2xs"
              title="Abrir sitio web público en nueva pestaña"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Ver Sitio</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Link>

            {/* Toggle de Tema rápido */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Pill del usuario en Desktop */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {currentUser.roleName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
