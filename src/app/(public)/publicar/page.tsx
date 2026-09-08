"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitPublicationRequest } from "./actions";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PublicarPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await submitPublicationRequest(formData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      alert(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl mt-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
          ¡Solicitud Enviada!
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Hemos recibido los datos de tu propiedad con éxito. Nuestro equipo se pondrá en contacto contigo muy pronto para seguir con el proceso.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-3xl mt-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Publica tu Propiedad con Nosotros
        </h1>
        <p className="text-muted-foreground text-lg">
          Déjanos los datos de tu propiedad y nos pondremos en contacto contigo para asesorarte y subirla a nuestra red.
        </p>
      </div>

      <div className="bg-card border border-border shadow-lg rounded-3xl p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input 
                id="name" 
                name="name"
                placeholder="Ej. Juan Pérez" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de contacto</Label>
              <Input 
                id="phone" 
                name="phone"
                placeholder="+56 9 1234 5678" 
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="tu@email.com" 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de propiedad</Label>
              <select 
                id="type"
                name="propertyType"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Terreno">Terreno</option>
                <option value="Oficina">Oficina</option>
                <option value="Local Comercial">Local Comercial</option>
                <option value="Parcela">Parcela</option>
                <option value="Predio Agrícola">Predio Agrícola</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="operation">Operación</Label>
              <select 
                id="operation"
                name="operation"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Venta">Venta</option>
                <option value="Arriendo">Arriendo</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Cuéntanos sobre la propiedad (Ubicación, m2, detalles)</Label>
            <Textarea 
              id="message" 
              name="message"
              placeholder="Ej. La propiedad está ubicada en el centro de Talca, tiene 3 habitaciones..." 
              className="min-h-[120px]"
              required
            />
          </div>

          <Button type="submit" size="lg" disabled={loading} className="w-full text-lg h-12 rounded-full">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Enviando solicitud...
              </span>
            ) : (
              "Enviar Solicitud"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Tu solicitud se enviará de forma segura a nuestro sistema interno. No necesitas aplicación de correo.
          </p>
        </form>
      </div>
    </div>
  );
}
