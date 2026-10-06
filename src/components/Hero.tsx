"use client";

import { Search, Home, Briefcase } from "lucide-react";
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
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const [priceLimit, setPriceLimit] = useState("");
  
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
    if (city) params.append("q", city);
    if (sector) params.append("sector", sector);
    
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <div className="relative h-[600px] w-full flex items-center justify-center bg-gray-200 overflow-hidden">
      {/* Background Image Carousel */}
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
        </div>
      ))}

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 mt-32">
        
        {/* Tab Title */}
        <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-t-md font-medium text-lg">
          Buscador de Propiedad
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-card/95 backdrop-blur shadow-lg flex flex-col sm:flex-row items-center gap-3 p-3">
          
          <select 
            value={operation} 
            onChange={(e) => setOperation(e.target.value)}
            className="w-full sm:w-1/6 border border-border rounded-sm p-2 text-foreground bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Venta-Arriendo</option>
            <option value="Venta">Venta</option>
            <option value="Arriendo">Arriendo</option>
          </select>

          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full sm:w-1/6 border border-border rounded-sm p-2 text-foreground bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Casas</option>
            <option value="Casa">Casa</option>
            <option value="Departamento">Departamento</option>
            <option value="Terreno">Terreno</option>
            <option value="Oficina">Oficina</option>
            <option value="Comercial">Local Comercial</option>
            <option value="Parcela">Parcela</option>
            <option value="Agricola">Predio Agrícola</option>
          </select>

          <select 
            value={city} 
            onChange={(e) => setCity(e.target.value)}
            className="w-full sm:w-1/6 border border-border rounded-sm p-2 text-foreground bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Ciudad</option>
            <option value="Talca">Talca</option>
            <option value="Santiago">Santiago</option>
            <option value="Curicó">Curicó</option>
          </select>

          <select 
            value={sector} 
            onChange={(e) => setSector(e.target.value)}
            className="w-full sm:w-1/6 border border-border rounded-sm p-2 text-foreground bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Sector</option>
            <option value="Oriente">Oriente</option>
            <option value="Centro">Centro</option>
            <option value="Norte">Norte</option>
            <option value="Sur">Sur</option>
          </select>

          <input 
            type="text" 
            placeholder="Valor hasta" 
            value={priceLimit}
            onChange={(e) => setPriceLimit(e.target.value)}
            className="w-full sm:w-1/6 border border-border rounded-sm p-2 text-foreground bg-background text-sm focus:outline-none focus:border-primary"
          />

          <button type="submit" className="w-full sm:w-12 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm flex items-center justify-center transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Extra buttons below */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full max-w-[800px]">
          <button className="flex-1 bg-muted-foreground/80 hover:bg-muted-foreground text-white py-2 px-4 rounded-sm flex items-center justify-center gap-2 text-sm transition-colors opacity-95">
            <Home className="w-4 h-4" />
            Quieres vender tu propiedad
          </button>
          <button className="flex-1 bg-muted-foreground/80 hover:bg-muted-foreground text-white py-2 px-4 rounded-sm flex items-center justify-center gap-2 text-sm transition-colors opacity-95">
            <Briefcase className="w-4 h-4" />
            Quieres trabajar con nosotros
          </button>
        </div>

      </div>
    </div>
  );
}
