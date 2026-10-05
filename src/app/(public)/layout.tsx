import { Navbar } from "@/components/Navbar";
import prisma from "@/lib/db";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fonos = await prisma.siteContent.findUnique({ where: { key: 'fonos_superior' } });
  
  // Obtener oficinas desde la base de datos (ordenadas por el campo 'order')
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  return (
    <>
      <Navbar topPhone={fonos?.content} />
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer Dinámico */}
      <footer className="bg-zinc-950 py-12 text-zinc-400 mt-auto">
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-white font-bold text-xl mb-4">NYS Residencial</h3>
            <p className="text-sm">Buscar la mejor opci&oacute;n es nuestro compromiso desde 1999.</p>
          </div>
          
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {offices.map((office) => (
              <div key={office.id}>
                <h4 className="text-white font-semibold mb-4">{office.name}</h4>
                <p className="text-sm">{office.address}</p>
                {office.email && <p className="text-sm">{office.email}</p>}
                {office.phone && <p className="text-sm">{office.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
