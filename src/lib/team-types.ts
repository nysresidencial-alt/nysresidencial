export interface TeamMember {
  id: string
  name: string
  role: string
  photoUrl: string
  companies: string[] // Lista de nombres de empresas asociadas (tags)
  linkedinUrl?: string
  bio?: string
  order: number
  isActive: boolean
}

export interface TeamCompany {
  id: string
  name: string
  color?: string
}
