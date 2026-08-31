import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import Image from "next/image";

// Mock data based on the provided images
const MOCK_PROPERTIES = [
  {
    id: 1,
    title: "Departamento en Las Condes",
    priceUF: "15.000",
    type: "Venta",
    location: "Sector El Golf, Las Condes",
    beds: 4,
    baths: 4,
    area: 214,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60",
    featured: true,
  },
  {
    id: 2,
    title: "Departamento Parque Bicentenario",
    priceUF: "15.500",
    type: "Venta",
    location: "Sector Vitacura, Vitacura",
    beds: 4,
    baths: 4,
    area: 178,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    title: "Departamento Santa Lucía",
    priceUF: "2.390",
    type: "Venta",
    location: "Sector Santa Lucía, Santiago",
    beds: 2,
    baths: 1,
    area: 40,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 4,
    title: "Casa Sector Oriente",
    priceUF: "9.600",
    type: "Venta",
    location: "Sector La Reina, Región Metropolitana",
    beds: 3,
    baths: 2,
    area: 113,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 5,
    title: "Casa Centro de Talca",
    priceUF: "11.600",
    type: "Venta",
    location: "Sector Centro, Talca",
    beds: 4,
    baths: 4,
    area: 269,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: 6,
    title: "Terreno Alto del Llano",
    priceUF: "1.510",
    type: "Venta",
    location: "Alto del Llano, Talca",
    beds: 0,
    baths: 0,
    area: 5000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60",
  },
];

export function PropertiesGrid() {
  return (
    <section className="py-20 bg-background" id="propiedades">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Propiedades Destacadas
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Explora nuestra selección de propiedades exclusivas disponibles para ti.
            </p>
          </div>
          <a href="/propiedades" className="text-primary font-medium hover:underline mt-4 md:mt-0">
            Ver todas las propiedades &rarr;
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PROPERTIES.map((property) => (
            <Card key={property.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card">
              <div className="relative h-64 w-full overflow-hidden">
                <Image
                  src={property.image}
                  alt={property.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    {property.type}
                  </Badge>
                  {property.featured && (
                    <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white font-semibold backdrop-blur-sm">
                      Destacado
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <p className="text-white font-bold text-2xl tracking-tight drop-shadow-sm">
                    UF {property.priceUF}
                  </p>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-2 text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {property.title}
                </h3>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-1 shrink-0" />
                  <span className="text-sm truncate">{property.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border/50">
                  {property.beds > 0 && (
                    <div className="flex items-center gap-1.5" title="Habitaciones">
                      <Bed className="h-4 w-4" />
                      <span>{property.beds}</span>
                    </div>
                  )}
                  {property.baths > 0 && (
                    <div className="flex items-center gap-1.5" title="Baños">
                      <Bath className="h-4 w-4" />
                      <span>{property.baths}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5" title="Metros cuadrados">
                    <Square className="h-4 w-4" />
                    <span>{property.area} m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
