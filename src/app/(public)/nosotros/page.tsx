import Image from 'next/image'
import type { Metadata } from 'next'
import { getTeamData } from '@/app/admin/contenido/equipo-actions'
import { TeamSection } from '@/components/public/TeamSection'
import { Sparkles, Building2, ShieldCheck, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Quiénes Somos | Trayectoria Inmobiliaria desde 1999',
  description:
    'Conoce la historia, valores y el equipo humano de NYS Residencial. Más de 25 años asesorando a familias e inversionistas en la compra y arriendo de propiedades en Talca y Chile.',
}

export default async function NosotrosPage() {
  const { members, companies, corporateText } = await getTeamData()

  return (
    <div className="pt-24 pb-20 min-h-screen bg-background">
      {/* Banner / Header Hero */}
      <div className="relative h-[320px] md:h-[420px] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
            alt="Quiénes Somos NYS"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/60" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-white border border-primary/30 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Trayectoria desde 1999</span>
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">
            Quiénes Somos
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base md:text-lg leading-relaxed">
            Conoce la historia, los valores y el equipo de profesionales detrás de tu próxima inversión y hogar.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Sección de Historia y Misión Corporativa */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>Nuestra Historia</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Más de 25 años conectando personas con oportunidades
            </h2>

            {corporateText ? (
              <div
                className="prose prose-zinc dark:prose-invert max-w-none text-base leading-relaxed space-y-4 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: corporateText }}
              />
            ) : (
              <div className="space-y-4 text-muted-foreground leading-relaxed text-base">
                <p>
                  En <strong>NyS Residencial</strong> nos dedicamos a brindar soluciones inmobiliarias integrales, acompañando a nuestros clientes en cada etapa de la búsqueda, compra, venta y arriendo de propiedades.
                </p>
                <p>
                  Nuestro compromiso es ofrecer un servicio cercano, transparente y personalizado, entendiendo que cada propiedad representa una oportunidad y cada cliente tiene metas únicas.
                </p>
                <p className="font-semibold text-foreground">
                  En NyS Residencial, más que propiedades, construimos relaciones de confianza a largo plazo.
                </p>
              </div>
            )}
          </div>

          {/* Cards de pilares */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Experiencia Comprobada</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Más de dos décadas de conocimiento riguroso del mercado en Talca, Santiago y la Región del Maule.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Transparencia Notarial</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Estudio de títulos minucioso, contratos claros y acompañamiento legal en cada firma.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Grupo Empresarial</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sinergia y respaldo multisectorial con empresas consolidadas en transporte, inmobiliaria y servicios.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Nuestro Equipo con Fotografía Circular Elegante y Tags de Empresas */}
        <section className="pt-8 border-t border-border">
          <TeamSection
            members={members}
            companies={companies}
            showCompanyFilter={true}
            title="Nuestro Equipo Humano"
            subtitle="Conoce a las personas detrás de NyS Residencial y las empresas que forman parte de nuestro grupo."
          />
        </section>
      </div>
    </div>
  )
}
