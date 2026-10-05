import prisma from '@/lib/db'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Mail, Phone, MapPin } from 'lucide-react'

export default async function ContactoPage() {
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' }
  });

  return (
    <div className="pt-24 pb-16 min-h-screen container mx-auto px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">Contacto</h1>
        <p className="text-muted-foreground text-center text-lg mb-12">
          &iquest;Tienes alguna duda o quieres agendar una visita? Escr&iacute;benos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card border border-border p-8 rounded-3xl shadow-sm">
          
          {/* Formulario */}
          <form className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Env&iacute;anos un mensaje</h2>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input id="nombre" placeholder="Tu nombre" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electr&oacute;nico</Label>
              <Input id="email" type="email" placeholder="tucorreo@ejemplo.com" className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Tel&eacute;fono (opcional)</Label>
              <Input id="telefono" type="tel" placeholder="+56 9 1234 5678" className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" placeholder="&iquest;En qu&eacute; te podemos ayudar?" className="bg-background min-h-[120px]" />
            </div>

            <Button type="button" className="w-full rounded-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
              Enviar Mensaje
            </Button>
          </form>

          {/* Información de Contacto */}
          <div className="space-y-8 md:pl-8 md:border-l border-border">
            {offices.map((office) => (
              <div key={office.id}>
                <h2 className="text-2xl font-bold mb-6">Oficina {office.name}</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                    <p>{office.address}</p>
                  </div>
                  {office.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary shrink-0" />
                      <p>{office.email}</p>
                    </div>
                  )}
                  {office.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0" />
                      <p>{office.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
