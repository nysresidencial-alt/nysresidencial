import { Navbar } from "@/components/Navbar";
import prisma from "@/lib/db";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cargar contenido del footer desde BD
  const santiago = await prisma.siteContent.findUnique({ where: { key: 'santiago_contacto' } });
  const talca = await prisma.siteContent.findUnique({ where: { key: 'talca_contacto' } });
  const fonos = await prisma.siteContent.findUnique({ where: { key: 'fonos_superior' } });

  return (
    <>
      <Navbar topPhone={fonos?.content} />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer Dinámico */}
      <footer className="bg-zinc-950 py-12 text-zinc-400 mt-auto">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-xl mb-4">NYS Residencial</h3>
            <p className="text-sm">Buscar la mejor opción es nuestro compromiso desde 1999.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Santiago</h4>
            {santiago?.content ? (
              <div className="text-sm prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: santiago.content }} />
            ) : (
              <>
                <p className="text-sm">El Golf 40, piso 12 Las Condes</p>
                <p className="text-sm">contacto@nys.cl</p>
              </>
            )}
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Talca</h4>
            {talca?.content ? (
              <div className="text-sm prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: talca.content }} />
            ) : (
              <>
                <p className="text-sm">6 Oriente 960, Edificio Manuel Solar, 4 piso</p>
                <p className="text-sm">Celular: +56 9 9289 3145 | +56 9 7387 7812</p>
              </>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
