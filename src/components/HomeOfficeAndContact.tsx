'use client';

import { useState } from 'react';
import { Office } from '@prisma/client';
import { MapPin, Phone, Mail, ExternalLink, Send, CheckCircle2, AlertCircle, Building2, User, Sparkles } from 'lucide-react';
import { submitContactRequest } from '@/app/(public)/contact-action';

interface HomeOfficeAndContactProps {
  offices: Office[];
}

export function HomeOfficeAndContact({ offices }: HomeOfficeAndContactProps) {
  // Manejo de la oficina seleccionada para el mapa
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    offices.length > 0 ? offices[0].id : ''
  );

  const activeOffice = offices.find((o) => o.id === selectedOfficeId) || offices[0];

  // Estados del formulario
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setIsSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await submitContactRequest(formData);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      form.reset();
    } else {
      setErrorMessage(result.error || 'Ocurrió un error al enviar el formulario.');
    }
  }

  return (
    <section id="contacto-solicitud" className="py-12 md:py-16 bg-muted/30 border-t border-border scroll-mt-6">
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          
          {/* ================= MITAD IZQUIERDA: UBICACIÓN Y MAPA DE OFICINAS ================= */}
          <div className="flex flex-col bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm">
            
            <div className="border-b border-border pb-4 mb-6">
              <span className="text-xs uppercase font-bold tracking-wider text-primary">
                Atenci&oacute;n Presencial
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Nuestras Oficinas
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Vis&iacute;tanos en nuestras dependencias o coordina una reuni&oacute;n personalizada con nuestro equipo.
              </p>
            </div>

            {/* Pestañas para cambiar de oficina si hay más de una */}
            {offices.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {offices.map((office) => {
                  const isSelected = office.id === (activeOffice?.id ?? '');
                  return (
                    <button
                      key={office.id}
                      type="button"
                      onClick={() => setSelectedOfficeId(office.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Oficina {office.name}
                    </button>
                  );
                })}
              </div>
            )}

            {activeOffice ? (
              <div className="flex flex-col flex-1">
                
                {/* Datos de contacto de la oficina activa */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-start gap-2.5 text-foreground font-medium">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{activeOffice.address}</span>
                  </div>

                  {activeOffice.phone && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>{activeOffice.phone}</span>
                    </div>
                  )}

                  {activeOffice.email && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span>{activeOffice.email}</span>
                    </div>
                  )}
                </div>

                {/* Vista previa embebida de Google Maps */}
                <div className="relative w-full h-[240px] sm:h-[280px] rounded-xl overflow-hidden border border-border shadow-inner bg-muted mb-4">
                  <iframe
                    title={`Mapa de Oficina ${activeOffice.name}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(activeOffice.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  />
                </div>

                {/* Botón para abrir en Google Maps app o web */}
                <div className="mt-auto pt-2">
                  <a
                    href={activeOffice.mapLink || `https://maps.google.com/?q=${encodeURIComponent(activeOffice.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    Abrir en Google Maps
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No hay oficinas configuradas actualmente.
              </div>
            )}

          </div>


          {/* ================= MITAD DERECHA: FORMULARIO TRABAJA CON NOSOTROS / CONTACTO ================= */}
          <div className="flex flex-col bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm">
            
            <div className="border-b border-border pb-4 mb-6">
              <span className="text-xs uppercase font-bold tracking-wider text-primary">
                Atenci&oacute;n Inmediata
              </span>
              <h2 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Trabaja con Nosotros o Cont&aacute;ctanos
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Cu&eacute;ntanos tu requerimiento o env&iacute;anos tu postulaci&oacute;n. Responderemos a tu solicitud con la m&aacute;xima rapidez.
              </p>
            </div>

            {/* Mensaje de Confirmación tras enviar */}
            {isSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="block font-semibold">¡Solicitud recibida exitosamente!</strong>
                  Tu informaci&oacute;n ya se encuentra en nuestro sistema. Un ejecutivo de NyS se comunicar&aacute; contigo en breve.
                </div>
              </div>
            )}

            {/* Mensaje de Error */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Nombre Completo <span className="text-primary">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ej: Juan Carlos Pérez"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {/* Correo / Gmail */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Correo Electr&oacute;nico / Gmail <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="ejemplo@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Teléfono */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    Tel&eacute;fono / WhatsApp
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                {/* Tipo de solicitud (Menú Desplegable) */}
                <div className="space-y-1.5">
                  <label htmlFor="operation" className="text-xs font-semibold text-foreground">
                    Tipo de Solicitud <span className="text-primary">*</span>
                  </label>
                  <select
                    id="operation"
                    name="operation"
                    required
                    defaultValue="Quiero vender un inmueble"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="Quiero vender un inmueble">Quiero vender un inmueble</option>
                    <option value="Quiero comprar un inmueble">Quiero comprar un inmueble</option>
                    <option value="Quiero poner en arriendo mi propiedad">Quiero poner en arriendo mi propiedad</option>
                    <option value="Busco arrendar una propiedad">Busco arrendar una propiedad</option>
                    <option value="Trabaja con nosotros / Postulación laboral">Trabaja con nosotros / Postulaci&oacute;n laboral</option>
                    <option value="Tasación comercial de inmueble">Tasaci&oacute;n comercial de inmueble</option>
                    <option value="Asesoría legal e inmobiliaria">Asesor&iacute;a legal e inmobiliaria</option>
                    <option value="Otra consulta general">Otra consulta general</option>
                  </select>
                </div>

              </div>

              {/* Mensaje / Comentario */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label htmlFor="message" className="text-xs font-semibold text-foreground">
                  Mensaje o Detalles del Inmueble / Postulaci&oacute;n
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  placeholder="Detalles de la propiedad (ubicación, superficie, valor estimado) o información sobre tu postulación laboral..."
                  className="w-full flex-1 min-h-[90px] px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                />
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Enviando solicitud...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Solicitud</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>
    </section>
  );
}
