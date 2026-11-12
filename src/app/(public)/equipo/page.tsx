import Link from 'next/link'
import { ArrowLeft, Users, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { getTeamData } from '@/app/admin/contenido/equipo-actions'
import { TeamSection } from '@/components/public/TeamSection'

export const metadata: Metadata = {
  title: 'Nuestro Equipo | Asesores Inmobiliarios y Corredores',
  description:
    'Conoce al equipo de corredores, asesores comerciales, peritos legales y directores de NYS Residencial en Talca y Santiago.',
}

export default async function EquipoPage() {
  const { members, companies } = await getTeamData()

  return (
    <div className="pt-24 pb-20 min-h-screen bg-background">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Botón volver */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div className="border-b border-border pb-8 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NyS Residencial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-9 h-9 sm:w-10 sm:h-10 text-primary" />
            <span>Nuestro Equipo</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-3xl leading-relaxed">
            Un equipo multidisciplinario de corredores, tasadores, asesores legales y ejecutivos comerciales con amplia trayectoria en la gestión de arriendos, compraventas e inversiones en Chile.
          </p>
        </div>

        {/* Sección del Equipo con Filtro de Empresas y Fotos Circulares */}
        <div className="bg-card/50 border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
          <TeamSection
            members={members}
            companies={companies}
            showCompanyFilter={true}
            title="Integrantes y Asesores"
            subtitle="Filtra por empresa o explora los perfiles de nuestro equipo humano."
          />
        </div>
      </div>
    </div>
  )
}
