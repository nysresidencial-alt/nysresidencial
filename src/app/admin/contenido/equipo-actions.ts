'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { TeamMember, TeamCompany } from '@/lib/team-types'

const KEY_MEMBERS = 'equipo_members'
const KEY_COMPANIES = 'equipo_companies'
const KEY_QUIENES_SOMOS = 'quienes_somos'

const DEFAULT_COMPANIES: TeamCompany[] = [
  { id: 'comp_1', name: 'NyS Residencial' },
  { id: 'comp_2', name: 'NyS Inmobiliaria' },
  { id: 'comp_3', name: 'Jose Retamal' },
  { id: 'comp_4', name: 'Buses Cipreses' },
  { id: 'comp_5', name: 'Grand Prix' },
  { id: 'comp_6', name: 'JFR Propiedades' },
]

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'member_1',
    name: 'José Manuel Retamal Bustos',
    role: 'Gerente General & Socio Fundador',
    photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop',
    companies: ['NyS Residencial', 'Jose Retamal'],
    linkedinUrl: 'https://www.linkedin.com',
    bio: 'Más de 25 años liderando el desarrollo inmobiliario e inversiones residenciales en la región.',
    order: 1,
    isActive: true,
  },
  {
    id: 'member_2',
    name: 'Patricia Retamal Bustos',
    role: 'Directora Comercial & Gestión Inmobiliaria',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
    companies: ['NyS Residencial'],
    linkedinUrl: 'https://www.linkedin.com',
    bio: 'Especialista en administración de arriendos, cartera de propiedades y atención personalizada.',
    order: 2,
    isActive: true,
  },
  {
    id: 'member_3',
    name: 'Rodrigo González',
    role: 'Asesor Comercial & Corretaje Senior',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop',
    companies: ['NyS Residencial', 'Grand Prix'],
    linkedinUrl: 'https://www.linkedin.com',
    bio: 'Gestión de captación de inmuebles residenciales y comerciales en Talca y Santiago.',
    order: 3,
    isActive: true,
  },
  {
    id: 'member_4',
    name: 'Camila Silva',
    role: 'Asesora Jurídica & Notarial',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop',
    companies: ['NyS Residencial'],
    linkedinUrl: 'https://www.linkedin.com',
    bio: 'Revisión rigurosa de títulos, contratos notariales e inscripciones en el Conservador de Bienes Raíces.',
    order: 4,
    isActive: true,
  },
]

export async function getTeamData() {
  try {
    const [membersRec, companiesRec, quienesSomosRec] = await Promise.all([
      prisma.siteContent.findUnique({ where: { key: KEY_MEMBERS } }),
      prisma.siteContent.findUnique({ where: { key: KEY_COMPANIES } }),
      prisma.siteContent.findUnique({ where: { key: KEY_QUIENES_SOMOS } }),
    ])

    let members: TeamMember[] = DEFAULT_MEMBERS
    if (membersRec?.content) {
      try {
        const parsed = JSON.parse(membersRec.content)
        if (Array.isArray(parsed) && parsed.length > 0) {
          members = parsed
        }
      } catch {
        // Fallback to defaults
      }
    }

    let companies: TeamCompany[] = DEFAULT_COMPANIES
    if (companiesRec?.content) {
      try {
        const parsed = JSON.parse(companiesRec.content)
        if (Array.isArray(parsed) && parsed.length > 0) {
          companies = parsed
        }
      } catch {
        // Fallback to defaults
      }
    }

    const corporateText = quienesSomosRec?.content || ''

    return {
      members: members.sort((a, b) => (a.order || 0) - (b.order || 0)),
      companies,
      corporateText,
    }
  } catch (error) {
    console.error('Error fetching team data:', error)
    return {
      members: DEFAULT_MEMBERS,
      companies: DEFAULT_COMPANIES,
      corporateText: '',
    }
  }
}

export async function saveTeamMember(member: TeamMember): Promise<{ success?: boolean; member?: TeamMember; error?: string }> {
  try {
    const currentData = await getTeamData()
    let members = currentData.members

    const existingIdx = members.findIndex((m) => m.id === member.id)
    if (existingIdx >= 0) {
      members[existingIdx] = member
    } else {
      members.push({
        ...member,
        order: member.order || members.length + 1,
      })
    }

    await prisma.siteContent.upsert({
      where: { key: KEY_MEMBERS },
      update: {
        content: JSON.stringify(members),
      },
      create: {
        key: KEY_MEMBERS,
        title: 'Equipo - Integrantes',
        content: JSON.stringify(members),
      },
    })

    revalidatePath('/nosotros')
    revalidatePath('/equipo')
    revalidatePath('/admin/contenido')
    revalidatePath('/admin/contenido/quienes_somos')
    revalidatePath('/admin/contenido/equipo')

    return { success: true, member }
  } catch (error: any) {
    console.error('Error saving team member:', error)
    return { error: error.message || 'Error al guardar el integrante del equipo' }
  }
}

export async function deleteTeamMember(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const currentData = await getTeamData()
    const updated = currentData.members.filter((m) => m.id !== id)

    await prisma.siteContent.upsert({
      where: { key: KEY_MEMBERS },
      update: { content: JSON.stringify(updated) },
      create: {
        key: KEY_MEMBERS,
        title: 'Equipo - Integrantes',
        content: JSON.stringify(updated),
      },
    })

    revalidatePath('/nosotros')
    revalidatePath('/equipo')
    revalidatePath('/admin/contenido')
    revalidatePath('/admin/contenido/quienes_somos')
    revalidatePath('/admin/contenido/equipo')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting team member:', error)
    return { error: error.message || 'Error al eliminar el integrante' }
  }
}

export async function saveTeamCompanies(companies: TeamCompany[]): Promise<{ success?: boolean; companies?: TeamCompany[]; error?: string }> {
  try {
    await prisma.siteContent.upsert({
      where: { key: KEY_COMPANIES },
      update: { content: JSON.stringify(companies) },
      create: {
        key: KEY_COMPANIES,
        title: 'Equipo - Lista de Empresas',
        content: JSON.stringify(companies),
      },
    })

    revalidatePath('/nosotros')
    revalidatePath('/equipo')
    revalidatePath('/admin/contenido')
    revalidatePath('/admin/contenido/quienes_somos')
    revalidatePath('/admin/contenido/equipo')

    return { success: true, companies }
  } catch (error: any) {
    console.error('Error saving team companies:', error)
    return { error: error.message || 'Error al guardar las empresas' }
  }
}

export async function addTeamCompany(name: string): Promise<{ success?: boolean; companies?: TeamCompany[]; error?: string }> {
  try {
    const clean = name.trim()
    if (!clean) throw new Error('El nombre de la empresa no puede estar vacío')

    const currentData = await getTeamData()
    const exists = currentData.companies.some(
      (c) => c.name.toLowerCase() === clean.toLowerCase()
    )
    if (exists) {
      return { success: true, companies: currentData.companies }
    }

    const newCompany: TeamCompany = {
      id: `comp_${Date.now()}`,
      name: clean,
    }
    const updated = [...currentData.companies, newCompany]
    return await saveTeamCompanies(updated)
  } catch (error: any) {
    return { error: error.message || 'Error al agregar empresa' }
  }
}

export async function deleteTeamCompany(companyId: string): Promise<{ success?: boolean; companies?: TeamCompany[]; error?: string }> {
  try {
    const currentData = await getTeamData()
    const toDelete = currentData.companies.find((c) => c.id === companyId)
    const updatedCompanies = currentData.companies.filter((c) => c.id !== companyId)

    // Opcionalmente remover el tag de los miembros que la tenían
    if (toDelete) {
      const updatedMembers = currentData.members.map((m) => ({
        ...m,
        companies: m.companies.filter((c) => c !== toDelete.name),
      }))

      await prisma.siteContent.upsert({
        where: { key: KEY_MEMBERS },
        update: { content: JSON.stringify(updatedMembers) },
        create: {
          key: KEY_MEMBERS,
          title: 'Equipo - Integrantes',
          content: JSON.stringify(updatedMembers),
        },
      })
    }

    return await saveTeamCompanies(updatedCompanies)
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar empresa' }
  }
}

export async function saveCorporateText(text: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await prisma.siteContent.upsert({
      where: { key: KEY_QUIENES_SOMOS },
      update: { content: text },
      create: {
        key: KEY_QUIENES_SOMOS,
        title: 'Quiénes Somos (Página /nosotros)',
        content: text,
      },
    })

    revalidatePath('/nosotros')
    revalidatePath('/equipo')
    revalidatePath('/admin/contenido')
    revalidatePath('/admin/contenido/quienes_somos')

    return { success: true }
  } catch (error: any) {
    console.error('Error saving corporate text:', error)
    return { error: error.message || 'Error al guardar el texto' }
  }
}
