import prisma from '@/lib/db'
import { PropertyCard } from '@/components/PropertyCard'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  const operation = typeof resolvedParams.operation === 'string' ? resolvedParams.operation : '';
  const type = typeof resolvedParams.type === 'string' ? resolvedParams.type : '';

  // Build prisma where clause dynamically
  const whereClause: any = {};
  
  if (operation) {
    whereClause.operation = operation;
  }
  
  if (type) {
    whereClause.propertyType = type;
  }
  
  if (q) {
    whereClause.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { sector: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
    ];
  }

  const properties = await prisma.property.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="pt-24 pb-16 min-h-screen bg-zinc-50 dark:bg-background">
      {/* Header */}
      <div className="bg-zinc-900 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Explora Propiedades
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Encuentra tu próximo hogar o inversión con nuestros filtros avanzados.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-8 relative z-10">
        <div className="bg-card border border-border p-4 md:p-6 rounded-2xl shadow-lg mb-8 md:mb-12 flex flex-col md:flex-row gap-4">
          <form className="flex-1 flex flex-col md:flex-row gap-4" method="GET" action="/propiedades">
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                name="q"
                defaultValue={q}
                placeholder="Comuna, sector, dirección..." 
                className="pl-10 h-12 w-full bg-background"
              />
            </div>
            
            <div className="w-full md:w-48">
              <select 
                name="operation" 
                defaultValue={operation}
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Cualquier Operación</option>
                <option value="Venta">Comprar (Venta)</option>
                <option value="Arriendo">Arrendar</option>
              </select>
            </div>
            
            <div className="w-full md:w-48">
              <select 
                name="type" 
                defaultValue={type}
                className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Cualquier Tipo</option>
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Oficina">Oficina</option>
                <option value="Comercial">Local Comercial</option>
                <option value="Parcela">Parcela</option>
                <option value="Agricola">Predio Agrícola</option>
                <option value="Institucional">Institucional</option>
              </select>
            </div>

            <Button type="submit" size="lg" className="h-12 shrink-0 px-8">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">
            {properties.length} {properties.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </h2>
        </div>

        {properties.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <h3 className="text-2xl font-bold mb-2">No encontramos coincidencias</h3>
            <p className="text-muted-foreground mb-6">Prueba ajustando tus filtros de búsqueda o buscando en otros sectores.</p>
            <a href="/propiedades">
              <Button variant="outline">Limpiar filtros</Button>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
