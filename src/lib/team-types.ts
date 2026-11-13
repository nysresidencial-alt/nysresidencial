export interface TeamMember {
  id: string
  name: string
  role: string
  photoUrl: string
  companies: string[] // Lista de nombres de empresas asociadas (tags)
  linkedinUrl?: string
  bio?: string
  order: number
  level?: number // 1: Dirección, 2: Gerencias, 3: Asesores/Especialistas, 4: Apoyo
  isActive: boolean
}

export interface TeamCompany {
  id: string
  name: string
  color?: string
}

export interface TeamLevelInfo {
  level: number
  title: string
  badge: string
  description: string
}

export const TEAM_LEVELS: TeamLevelInfo[] = [
  {
    level: 1,
    title: 'Dirección General & Socios Fundadores',
    badge: 'Nivel 1 · Cúpula Directiva',
    description: 'Liderazgo estratégico, fundadores y alta gerencia.',
  },
  {
    level: 2,
    title: 'Gerencias de Área & Jefaturas',
    badge: 'Nivel 2 · Gerencias & Coordinación',
    description: 'Dirección comercial, cartera y gestión operativa.',
  },
  {
    level: 3,
    title: 'Asesores Comerciales & Especialistas',
    badge: 'Nivel 3 · Equipo Comercial & Legal',
    description: 'Corretaje, asesoría jurídica, notarial y captación.',
  },
  {
    level: 4,
    title: 'Equipo de Apoyo & Colaboradores',
    badge: 'Nivel 4 · Soporte & Colaboradores',
    description: 'Asistentes, soporte y personal operativo.',
  },
]

