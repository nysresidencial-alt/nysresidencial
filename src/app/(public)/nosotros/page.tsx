import prisma from '@/lib/db'
import Image from 'next/image'

export default async function NosotrosPage() {
  const quienesSomos = await prisma.siteContent.findUnique({ where: { key: 'quienes_somos' } })
  const equipo = await prisma.siteContent.findUnique({ where: { key: 'equipo' } })

  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Banner / Header */}
      <div className="relative h-[300px] md:h-[400px] w-full bg-zinc-900 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop"
            alt="Quiénes Somos NYS"
            fill
            className="object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Nosotros</h1>
          <p className="mt-4 text-zinc-300 text-lg max-w-2xl mx-auto">
            Conoce más sobre NYS Residencial y el equipo detrás de tu próximo hogar.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Quiénes Somos Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b pb-4">Quiénes Somos</h2>
          {quienesSomos?.content ? (
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: quienesSomos.content }}
            />
          ) : (
            <div className="text-muted-foreground italic">
              (El contenido de "Quiénes Somos" aún no ha sido cargado en el panel de administración).
            </div>
          )}
        </section>

        {/* Equipo Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b pb-4">Nuestro Equipo</h2>
          {equipo?.content ? (
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: equipo.content }}
            />
          ) : (
            <div className="text-muted-foreground italic">
              (El contenido de "Equipo" aún no ha sido cargado en el panel de administración).
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
