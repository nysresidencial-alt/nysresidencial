import { Navbar } from "@/components/Navbar";
import prisma from "@/lib/db";
import Image from "next/image";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fonos = await prisma.siteContent.findUnique({ where: { key: 'fonos_superior' } });
  const eslogan = await prisma.siteContent.findUnique({ where: { key: 'eslogan_cabecera' } });
  
  // Obtener oficinas desde la base de datos (ordenadas por el campo 'order')
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  const sloganText = eslogan?.content 
    ? eslogan.content.replace(/<[^>]+>/g, '').trim() 
    : "Buscar la mejor opción es nuestro compromiso desde 1999";

  return (
    <>
      <Navbar topPhone={fonos?.content} slogan={sloganText} />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer Dinámico */}
      <footer className="bg-zinc-950 py-12 text-zinc-400 mt-auto border-t border-zinc-800">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-12 w-16 shrink-0">
                <Image
                  src="/logo-nys.png"
                  alt="NyS Propiedades"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">NYS Residencial</h3>
                <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold block">Negocios y Soluciones</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400">{sloganText}</p>
          </div>
          
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {offices.map((office) => (
              <div key={office.id}>
                <h4 className="text-white font-semibold mb-3">Oficina {office.name}</h4>
                <p className="text-sm text-zinc-400 mb-1">{office.address}</p>
                {office.email && <p className="text-sm text-zinc-400">{office.email}</p>}
                {office.phone && <p className="text-sm text-zinc-400">{office.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
