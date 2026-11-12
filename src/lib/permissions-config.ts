export type AdminModule =
  | 'propiedades'
  | 'clientes'
  | 'portafolio'
  | 'carrusel'
  | 'contenido'
  | 'uf'
  | 'solicitudes'
  | 'oficinas'
  | 'usuarios'
  | 'vouchers'
  | 'contabilidad' // Reservado para futura fase

export type ActionType = 'view' | 'create' | 'edit' | 'delete'

export interface ModulePermission {
  view: boolean
  create?: boolean
  edit?: boolean
  delete?: boolean
}

export type PermissionsMatrix = Record<string, ModulePermission>

export interface AdminRoleConfig {
  name: string
  description: string
  isSystem: boolean
  permissions: PermissionsMatrix
}

export const ADMIN_MODULES: {
  key: AdminModule
  name: string
  href: string
  description: string
  hasCrud: boolean
}[] = [
  {
    key: 'propiedades',
    name: 'Propiedades',
    href: '/admin',
    description: 'Gestión completa de inventario, publicación, fotos y disponibilidad',
    hasCrud: true,
  },
  {
    key: 'clientes',
    name: 'Oficina Virtual • Clientes',
    href: '/admin/clientes',
    description: 'Cuentas de clientes, carpetas privadas y documentos oficiales',
    hasCrud: true,
  },
  {
    key: 'portafolio',
    name: 'Portafolio PDF',
    href: '/admin/portafolio',
    description: 'Generación y exportación de dossier comercial en PDF',
    hasCrud: false,
  },
  {
    key: 'carrusel',
    name: 'Carrusel Portada',
    href: '/admin/carrusel',
    description: 'Imágenes destacadas de la cabecera del sitio web',
    hasCrud: true,
  },
  {
    key: 'contenido',
    name: 'Contenidos Web',
    href: '/admin/contenido',
    description: 'Textos de quiénes somos, teléfonos y eslogan',
    hasCrud: true,
  },
  {
    key: 'solicitudes',
    name: 'Solicitudes Clientes',
    href: '/admin/solicitudes',
    description: 'Mensajes de contacto y solicitudes de publicación',
    hasCrud: true,
  },
  {
    key: 'oficinas',
    name: 'Oficinas Físicas',
    href: '/admin/oficinas',
    description: 'Sucursales de Talca y Santiago',
    hasCrud: true,
  },
  {
    key: 'usuarios',
    name: 'Usuarios y Permisos',
    href: '/admin/usuarios',
    description: 'Panel Superadmin: Control de acceso, roles y contraseñas',
    hasCrud: true,
  },
  {
    key: 'vouchers',
    name: 'Vouchers / Recibos',
    href: '/admin/vouchers',
    description: 'Liquidaciones de arriendo, recibos mensuales y recaudación',
    hasCrud: true,
  },
  {
    key: 'contabilidad',
    name: 'Contabilidad',
    href: '/admin/contabilidad',
    description: 'Módulo contable general y estados de pago',
    hasCrud: true,
  },
]

export const DEFAULT_ROLES: AdminRoleConfig[] = [
  {
    name: 'Superadmin',
    description: 'Acceso total e irrestricto a todas las vistas, usuarios y configuraciones del sistema.',
    isSystem: true,
    permissions: {
      propiedades: { view: true, create: true, edit: true, delete: true },
      clientes: { view: true, create: true, edit: true, delete: true },
      portafolio: { view: true },
      carrusel: { view: true, create: true, edit: true, delete: true },
      contenido: { view: true, create: true, edit: true, delete: true },
      solicitudes: { view: true, create: true, edit: true, delete: true },
      oficinas: { view: true, create: true, edit: true, delete: true },
      usuarios: { view: true, create: true, edit: true, delete: true },
      vouchers: { view: true, create: true, edit: true, delete: true },
      contabilidad: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    name: 'Comercial',
    description: 'Acceso enfocado a la gestión, publicación y modificación de propiedades y solicitudes.',
    isSystem: true,
    permissions: {
      propiedades: { view: true, create: true, edit: true, delete: true },
      portafolio: { view: true },
      solicitudes: { view: true, edit: true },
      clientes: { view: false },
      carrusel: { view: false },
      contenido: { view: false },
      oficinas: { view: false },
      usuarios: { view: false },
      vouchers: { view: false },
      contabilidad: { view: false },
    },
  },
  {
    name: 'Contabilidad',
    description: 'Gestión de finanzas, vouchers de arriendo y liquidaciones mensuales.',
    isSystem: true,
    permissions: {
      vouchers: { view: true, create: true, edit: true, delete: true },
      contabilidad: { view: true, create: true, edit: true, delete: true },
      clientes: { view: true },
      propiedades: { view: true },
      portafolio: { view: true },
      carrusel: { view: false },
      contenido: { view: false },
      solicitudes: { view: false },
      oficinas: { view: false },
      usuarios: { view: false },
    },
  },
]
