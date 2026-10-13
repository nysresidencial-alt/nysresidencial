import prisma from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Phone, Sparkles, BookOpen, Users, Building, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';

interface ContentItemConfig {
  key: string;
  title: string;
  location: string;
  description: string;
  icon: any;
}

export default async function ContenidoDashboard() {
  const contents = await prisma.siteContent.findMany();
  const contentMap = new Map(contents.map((c) => [c.key, c.content]));

  const contentItems: ContentItemConfig[] = [
    {
      key: 'fonos_superior',
      title: 'Teléfonos y Correos de Cabecera',
      location: 'Barra Superior (Navbar)',
      description: 'Números de teléfono, WhatsApp y correo que se muestran en la esquina superior derecha del menú.',
      icon: Phone,
    },
    {
      key: 'eslogan_cabecera',
      title: 'Eslogan Institucional',
      location: 'Cabecera (Logo) y Pie de Página',
      description: 'Lema corporativo de la empresa. Por defecto: "Buscar la mejor opción es nuestro compromiso desde 1999".',
      icon: Sparkles,
    },
    {
      key: 'quienes_somos',
      title: 'Quiénes Somos',
      location: 'Página Pública /nosotros',
      description: 'Texto corporativo, historia y propuesta de valor de NyS Inmobiliaria.',
      icon: BookOpen,
    },
    {
      key: 'equipo',
      title: 'Nuestro Equipo',
      location: 'Página Pública /equipo y /nosotros',
      description: 'Presentación del equipo humano, directores y asesores comerciales.',
      icon: Users,
    },
    {
      key: 'vender_propiedad_info',
      title: 'Información: Vender tu Propiedad',
      location: 'Buscador Principal (Botón Inferior)',
      description: 'Detalles explicativos y beneficios para clientes que desean vender o consignar su propiedad con NyS.',
      icon: Building,
    },
    {
      key: 'trabajar_con_nosotros_info',
      title: 'Información: Trabajar con Nosotros',
      location: 'Buscador Principal (Botón Inferior)',
      description: 'Información sobre el perfil de postulación, oportunidades y cultura laboral.',
      icon: Briefcase,
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          Contenido del Sitio
        </h1>
        <p className="text-muted-foreground mt-2">
          Administra fácilmente los textos, eslóganes, páginas informativas y datos de contacto de todo el portal público.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {contentItems.map((item) => {
          const Icon = item.icon;
          const currentContent = contentMap.get(item.key);
          const isConfigured = Boolean(currentContent && currentContent.trim().length > 0);

          return (
            <div 
              key={item.key} 
              className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground leading-tight">
                        {item.title}
                      </h2>
                      <Badge variant="outline" className="mt-1 text-[11px] font-normal border-border">
                        {item.location}
                      </Badge>
                    </div>
                  </div>

                  <Badge 
                    variant={isConfigured ? 'default' : 'secondary'}
                    className={isConfigured ? 'bg-green-600/10 text-green-700 dark:text-green-400 border-none text-[11px]' : 'text-[11px]'}
                  >
                    {isConfigured ? 'Personalizado' : 'Por Defecto'}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>

                {isConfigured && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground line-clamp-2 italic">
                    &ldquo;{currentContent?.replace(/<[^>]+>/g, '').trim()}&rdquo;
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <Link href={`/admin/contenido/${item.key}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-xl text-xs font-semibold cursor-pointer">
                    <Pencil className="w-3.5 h-3.5 text-primary" />
                    Editar Contenido
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
