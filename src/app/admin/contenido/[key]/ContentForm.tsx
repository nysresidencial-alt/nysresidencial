'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/RichTextEditor';
import { updateSiteContent } from './actions';
import { Phone, Mail, Sparkles, Eye } from 'lucide-react';

interface ContentFormProps {
  contentKey: string;
  initialTitle: string;
  initialContent: string;
}

export function ContentForm({ contentKey, initialTitle, initialContent }: ContentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Parse inicial para fonos_superior si ya contiene datos
  const isFonosSuperior = contentKey === 'fonos_superior';
  const isEslogan = contentKey === 'eslogan_cabecera';

  const [phone1, setPhone1] = useState(() => {
    if (!isFonosSuperior) return '';
    try {
      const parsed = JSON.parse(initialContent);
      return parsed.phone1 || '';
    } catch {
      const clean = initialContent.replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
      const phoneFound = clean.find(s => !s.includes('@') && s.replace(/[^0-9]/g, '').length >= 7);
      return phoneFound || '+56 9 9289 3145';
    }
  });

  const [phone2, setPhone2] = useState(() => {
    if (!isFonosSuperior) return '';
    try {
      const parsed = JSON.parse(initialContent);
      return parsed.phone2 || '';
    } catch {
      return '';
    }
  });

  const [email, setEmail] = useState(() => {
    if (!isFonosSuperior) return '';
    try {
      const parsed = JSON.parse(initialContent);
      return parsed.email || '';
    } catch {
      const clean = initialContent.replace(/<[^>]+>/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
      const emailFound = clean.find(s => s.includes('@'));
      return emailFound || 'comercial@nys.cl';
    }
  });

  const [slogan, setSlogan] = useState(() => {
    if (!isEslogan) return '';
    return initialContent.replace(/<[^>]+>/g, '').trim() || 'Buscar la mejor opción es nuestro compromiso desde 1999';
  });

  const [content, setContent] = useState(initialContent);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let finalContent = content;

    if (isFonosSuperior) {
      finalContent = JSON.stringify({
        phone1: phone1.trim(),
        phone2: phone2.trim(),
        email: email.trim(),
      });
    } else if (isEslogan) {
      finalContent = slogan.trim();
    }

    await updateSiteContent(contentKey, initialTitle, finalContent);

    router.push('/admin/contenido');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <section className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
        
        {/* ================= FORMULARIO DEDICADO PARA TELÉFONOS Y WHATSAPP ================= */}
        {isFonosSuperior ? (
          <div className="space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground">Datos de Contacto de la Cabecera</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Ingresa tus números de WhatsApp y correo. Al hacer clic en el número en la barra de navegación, el usuario será redirigido a WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone1" className="text-sm font-semibold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-green-600" />
                  Tel&eacute;fono / WhatsApp Principal
                </Label>
                <Input
                  id="phone1"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="Ej: +56 9 9289 3145"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone2" className="text-sm font-semibold flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-green-600" />
                  Tel&eacute;fono / WhatsApp Secundario (Opcional)
                </Label>
                <Input
                  id="phone2"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="Ej: +56 9 7387 7812"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-primary" />
                  Correo Electr&oacute;nico de Contacto
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: comercial@nys.cl"
                  required
                />
              </div>
            </div>

            {/* Vista previa en tiempo real */}
            <div className="mt-6 p-4 rounded-2xl bg-muted/30 border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Vista Previa en el Men&uacute; Superior:
              </span>
              <div className="flex flex-col items-start gap-1 p-3 bg-background rounded-xl border border-border/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  {phone1 && (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      WhatsApp: {phone1}
                    </span>
                  )}
                  {phone2 && (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      WhatsApp: {phone2}
                    </span>
                  )}
                </div>
                {email && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 text-primary" />
                    {email}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : isEslogan ? (
          /* ================= FORMULARIO DEDICADO PARA ESLOGAN ================= */
          <div className="space-y-4">
            <Label htmlFor="slogan" className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              Eslogan Institucional
            </Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Buscar la mejor opción es nuestro compromiso desde 1999"
              required
            />
            <p className="text-xs text-muted-foreground">
              Este texto aparece debajo del logo en el menú y en la descripción del pie de página.
            </p>
          </div>
        ) : (
          /* ================= EDITOR DE TEXTO ENRIQUECIDO PARA OTRAS PÁGINAS ================= */
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground">Contenido (HTML / Texto Enriquecido)</label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>
        )}

      </section>

      <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur p-4 rounded-full border shadow-2xl">
        <Button variant="outline" type="button" onClick={() => router.push('/admin/contenido')} className="rounded-full px-6 cursor-pointer">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
