"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PublicarPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    propertyType: "Casa",
    operation: "Venta",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subject = encodeURIComponent(`Solicitud para publicar propiedad: ${formData.propertyType} en ${formData.operation}`);
    const body = encodeURIComponent(
      `Hola equipo NyS Residencial,\n\n` +
      `Me gustaría solicitar la publicación de mi propiedad con los siguientes datos:\n\n` +
      `Nombre: ${formData.name}\n` +
      `Teléfono: ${formData.phone}\n` +
      `Email: ${formData.email}\n` +
      `Tipo de Propiedad: ${formData.propertyType}\n` +
      `Operación: ${formData.operation}\n\n` +
      `Mensaje Adicional:\n${formData.message}\n\n` +
      `Quedo atento/a a su contacto.\n`
    );

    // Cambia el correo destino por el correo real de NyS
    const mailtoUrl = `mailto:contacto@nys.cl?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

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
                placeholder="Ej. Juan Pérez" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono de contacto</Label>
              <Input 
                id="phone" 
                placeholder="+56 9 1234 5678" 
                required 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tu@email.com" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de propiedad</Label>
              <select 
                id="type"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.propertyType}
                onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
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
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.operation}
                onChange={(e) => setFormData({...formData, operation: e.target.value})}
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
              placeholder="Ej. La propiedad está ubicada en el centro de Talca, tiene 3 habitaciones..." 
              className="min-h-[120px]"
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>

          <Button type="submit" size="lg" className="w-full text-lg h-12 rounded-full">
            Generar Mensaje y Enviar
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Al hacer clic, se abrirá tu aplicación de correo predeterminada (Gmail, Outlook, Mail, etc.) con los datos listos para enviar.
          </p>
        </form>
      </div>
    </div>
  );
}
