import prisma from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

export default async function EquipoPage() {
  const equipo = await prisma.siteContent.findUnique({ where: { key: 'equipo' } });

  return (
    <div className="pt-8 pb-16 min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* Breadcrumb / Botón volver */}
        <div className="mb-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>

        {/* Encabezado */}
        <div className="border-b border-border pb-6 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            NyS Residencial
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Nuestro Equipo
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl">
            Profesionales comprometidos con brindarte la mejor asesor&iacute;a, transparencia y acompa&ntilde;amiento en cada operaci&oacute;n inmobiliaria.
          </p>
        </div>

        {/* Contenido editable desde el panel de admin */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          {equipo?.content ? (
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: equipo.content }}
            />
          ) : (
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                En <strong>NyS Residencial</strong> contamos con un equipo multidisciplinario de corredores, ejecutivos comerciales, tasadores y asesores legales especializados en el mercado residencial, comercial y agrícola de Chile.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 rounded-xl bg-muted/40 border border-border">
                  <h3 className="font-bold text-foreground text-lg mb-2">Asesor&iacute;a Comercial Integral</h3>
                  <p className="text-sm">
                    Acompa&ntilde;amiento dedicado desde la b&uacute;squeda del inmueble o estudio de mercado hasta la firma final de compraventa o contrato de arriendo.
                  </p>
                </div>
                <div className="p-6 rounded-xl bg-muted/40 border border-border">
                  <h3 className="font-bold text-foreground text-lg mb-2">Respaldo Jur&iacute;dico y Notarial</h3>
                  <p className="text-sm">
                    Revisi&oacute;n rigurosa de t&iacute;tulos, gesti&oacute;n bancaria, inscripciones en el Conservador de Bienes Ra&iacute;ces y seguridad en cada etapa.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
