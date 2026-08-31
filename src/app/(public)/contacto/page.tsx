import prisma from '@/lib/db'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Mail, Phone, MapPin } from 'lucide-react'

export default async function ContactoPage() {
  const santiago = await prisma.siteContent.findUnique({ where: { key: 'santiago_contacto' } })
  const talca = await prisma.siteContent.findUnique({ where: { key: 'talca_contacto' } })

  return (
    <div className="pt-24 pb-16 min-h-screen container mx-auto px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-4">Contacto</h1>
        <p className="text-muted-foreground text-center text-lg mb-12">
          ¿Tienes alguna duda o quieres agendar una visita? Escríbenos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-card border border-border p-8 rounded-3xl shadow-sm">
          
          {/* Formulario */}
          <form className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Envíanos un mensaje</h2>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input id="nombre" placeholder="Tu nombre" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="tucorreo@ejemplo.com" className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input id="telefono" type="tel" placeholder="+56 9 1234 5678" className="bg-background" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensaje">Mensaje</Label>
              <Textarea id="mensaje" placeholder="¿En qué te podemos ayudar?" className="bg-background min-h-[120px]" />
            </div>

            <Button type="button" className="w-full rounded-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
              Enviar Mensaje
            </Button>
          </form>

          {/* Información de Contacto */}
          <div className="space-y-8 md:pl-8 md:border-l border-border">
            
            <div>
              <h2 className="text-2xl font-bold mb-6">Oficina Santiago</h2>
              {santiago?.content ? (
                <div 
                  className="prose prose-sm dark:prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: santiago.content }}
                />
              ) : (
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 text-primary" />
                    <p>El Golf 40, piso 12 Las Condes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <p>contacto@nys.cl</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Oficina Talca</h2>
              {talca?.content ? (
                <div 
                  className="prose prose-sm dark:prose-invert text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: talca.content }}
                />
              ) : (
                <div className="space-y-4 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 text-primary" />
                    <p>6 Oriente 960, Edificio Manuel Solar, 4 piso</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <p>+56 9 9289 3145 / +56 9 7387 7812</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
