"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface HeroProps {
  images?: string[];
}

export function Hero({ images = [] }: HeroProps) {
  const router = useRouter();
  const [operation, setOperation] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  
  const defaultImage = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop";
  const displayImages = images.length > 0 ? images : [defaultImage];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000); // Rota cada 5 segundos
    
    return () => clearInterval(interval);
  }, [displayImages.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (operation) params.append("operation", operation);
    if (type) params.append("type", type);
    if (q) params.append("q", q);
    
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <div className="relative h-[90vh] min-h-[600px] w-full flex items-center justify-center bg-zinc-900 rounded-b-[3rem] sm:rounded-b-[5rem] overflow-hidden">
      {/* Background Image Carousel with Overlay */}
      {displayImages.map((url, index) => (
        <div
          key={url}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={url}
            alt="Hero Background"
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-start mt-20">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white max-w-4xl tracking-tight leading-tight">
          Tu hogar merece la <span className="text-primary">mayor confianza.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-zinc-200 max-w-2xl font-light">
          Encuentra propiedades exclusivas, asesoría personalizada y la tranquilidad de trabajar con expertos en el mercado inmobiliario.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 md:mt-12 w-full max-w-5xl bg-background/95 backdrop-blur-md rounded-3xl md:rounded-full p-4 md:p-3 shadow-xl flex flex-col md:flex-row items-center gap-4 md:gap-4 transition-all hover:shadow-2xl">
          <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-2 px-4">
            
            <div className="w-full md:w-1/3">
              <Select value={operation} onValueChange={(val) => setOperation(val || "")}>
                <SelectTrigger className="w-full border-none shadow-none bg-transparent focus:ring-0 text-foreground text-base font-medium">
                  <SelectValue placeholder="Comprar o Arrendar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venta">Comprar (Venta)</SelectItem>
                  <SelectItem value="Arriendo">Arrendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-border" />

            <div className="w-full md:w-1/3">
              <Select value={type} onValueChange={(val) => setType(val || "")}>
                <SelectTrigger className="w-full border-none shadow-none bg-transparent focus:ring-0 text-foreground text-base font-medium">
                  <SelectValue placeholder="Tipo de Propiedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Departamento">Departamento</SelectItem>
                  <SelectItem value="Terreno">Terreno</SelectItem>
                  <SelectItem value="Oficina">Oficina</SelectItem>
                  <SelectItem value="Comercial">Local Comercial</SelectItem>
                  <SelectItem value="Parcela">Parcela</SelectItem>
                  <SelectItem value="Agricola">Predio Agrícola</SelectItem>
                  <SelectItem value="Institucional">Institucional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden md:block w-px h-8 bg-border" />

            <div className="w-full md:flex-1 flex items-center gap-2 text-foreground">
              <Search className="w-5 h-5 text-muted-foreground ml-2 shrink-0" />
              <Input 
                type="text" 
                placeholder="Ingresa comuna, sector o dirección..." 
                className="w-full border-none shadow-none bg-transparent focus-visible:ring-0 px-0 text-base font-medium"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full md:w-auto rounded-full px-8 h-12 md:h-14 text-base shrink-0 font-bold">
            Buscar
          </Button>
        </form>
      </div>
    </div>
  );
}
