'use client';

import { useState } from 'react';
import { Home, Briefcase, Send, CheckCircle2, AlertCircle, Building2, User, MapPin, DollarSign, FileText } from 'lucide-react';
import { submitFullSolicitud } from './actions';
import Link from 'next/link';

interface SolicitudFormProps {
  initialType?: 'vender' | 'trabajar';
}

export function SolicitudForm({ initialType = 'vender' }: SolicitudFormProps) {
  const [tipo, setTipo] = useState<'vender' | 'trabajar'>(initialType);
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
    formData.append('tipo', tipo);

    const result = await submitFullSolicitud(formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      form.reset();
    } else {
      setErrorMessage(result.error || 'Ocurrió un error al enviar la solicitud.');
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-lg">
      
      {/* Selector de Pestañas / Tipo de Formulario */}
      <div className="flex flex-col sm:flex-row p-1.5 bg-muted rounded-2xl mb-8 gap-1.5">
        <button
          type="button"
          onClick={() => { setTipo('vender'); setIsSuccess(false); setErrorMessage(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            tipo === 'vender'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Quiero vender mi propiedad</span>
        </button>

        <button
          type="button"
          onClick={() => { setTipo('trabajar'); setIsSuccess(false); setErrorMessage(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            tipo === 'trabajar'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Quiero trabajar con nosotros</span>
        </button>
      </div>

      {/* Título y Descripción de la sección */}
      <div className="border-b border-border pb-6 mb-8">
        <span className="text-xs uppercase font-bold tracking-wider text-primary">
          {tipo === 'vender' ? 'Consignación Inmobiliaria' : 'Oportunidad Laboral'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">
          {tipo === 'vender' ? 'Publica y Vende tu Propiedad con NyS' : 'Únete al Equipo de NyS Residencial'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          {tipo === 'vender'
            ? 'Completa los datos de tu inmueble. Uno de nuestros ejecutivos se comunicará contigo para realizar una tasación preliminar y coordinar el proceso de corretaje.'
            : 'Buscamos talentos comprometidos con la excelencia y el servicio al cliente. Cuéntanos sobre ti y tu experiencia profesional.'}
        </p>
      </div>

      {/* Mensaje de Éxito */}
      {isSuccess && (
        <div className="mb-8 p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <div>
            <h2 className="text-lg font-bold">¡Solicitud recibida con éxito!</h2>
            <p className="text-sm mt-1 max-w-md">
              {tipo === 'vender'
                ? 'Hemos recibido los datos de tu propiedad. Un asesor comercial de NyS Residencial te contactará en menos de 24 horas.'
                : 'Tu postulación ha sido registrada en nuestro departamento de selección. Revisaremos tus antecedentes y nos pondremos en contacto.'}
            </p>
          </div>
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="text-xs font-semibold text-primary underline underline-offset-4 cursor-pointer"
            >
              Enviar otra solicitud
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )}

      {/* Mensaje de Error */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FORMULARIO */}
      {!isSuccess && (
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PASO 1: DATOS DE CONTACTO (COMUNES) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              1. Tus Datos de Contacto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Correo Electr&oacute;nico <span className="text-primary">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="ejemplo@gmail.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                  Tel&eacute;fono / WhatsApp <span className="text-primary">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          </div>


          {/* PASO 2: FORMULARIO ESPECÍFICO SEGÚN TIPO */}
          {tipo === 'vender' ? (
            /* ================= FORMULARIO PARA VENDER PROPIEDAD ================= */
            <div className="space-y-6 pt-2 border-t border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                2. Informaci&oacute;n de la Propiedad
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="propertyType" className="text-xs font-semibold text-foreground">
                    Tipo de Inmueble <span className="text-primary">*</span>
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    required
                    defaultValue="Casa"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Parcela">Parcela / Sitio</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Local Comercial">Local Comercial</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Predio Agrícola">Predio Agrícola / Forestal</option>
                    <option value="Edificio">Edificio / Institucional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="operation" className="text-xs font-semibold text-foreground">
                    ¿Qu&eacute; deseas hacer? <span className="text-primary">*</span>
                  </label>
                  <select
                    id="operation"
                    name="operation"
                    required
                    defaultValue="Venta"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="Venta">Quiero venderla</option>
                    <option value="Arriendo">Quiero ponerla en arriendo</option>
                    <option value="Tasación">Solicitar solo tasación profesional</option>
                  </select>
                </div>
              </div>

              {/* Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-semibold text-foreground">
                    Ciudad / Comuna <span className="text-primary">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    placeholder="Ej: Talca, Santiago, Curicó..."
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sector" className="text-xs font-semibold text-foreground">
                    Sector o Barrio
                  </label>
                  <input
                    id="sector"
                    name="sector"
                    type="text"
                    placeholder="Ej: Las Rastras, El Golf, Centro..."
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="address" className="text-xs font-semibold text-foreground">
                    Direcci&oacute;n Aproximada
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="Ej: 1 Sur con 8 Oriente"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              {/* Precio y Medidas */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="price" className="text-xs font-semibold text-foreground">
                    Valor Estimado o Esperado
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="currency"
                      name="currency"
                      defaultValue="UF"
                      className="w-24 px-2 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="UF">UF</option>
                      <option value="CLP">CLP ($)</option>
                    </select>
                    <input
                      id="price"
                      name="price"
                      type="text"
                      placeholder="Ej: 4.500 o 150.000.000"
                      className="flex-1 px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="area" className="text-xs font-semibold text-foreground">
                    Superficie Aprox (m&sup2;)
                  </label>
                  <input
                    id="area"
                    name="area"
                    type="text"
                    placeholder="Ej: 140 m2"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="beds" className="text-xs font-semibold text-foreground">
                    Dormitorios / Ba&ntilde;os
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="beds"
                      name="beds"
                      type="number"
                      placeholder="Dorm"
                      className="w-1/2 px-2.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground"
                    />
                    <input
                      id="baths"
                      name="baths"
                      type="number"
                      placeholder="Baños"
                      className="w-1/2 px-2.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Comentarios */}
              <div className="space-y-1.5">
                <label htmlFor="comments" className="text-xs font-semibold text-foreground">
                  Detalles o Comentarios Adicionales de la Propiedad
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows={3}
                  placeholder="Indícanos características especiales (estacionamientos, piscina, remodelaciones, estado de conservación, etc.)..."
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

            </div>
          ) : (
            /* ================= FORMULARIO PARA TRABAJAR CON NOSOTROS ================= */
            <div className="space-y-6 pt-2 border-t border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                2. Informaci&oacute;n de Postulaci&oacute;n
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="role" className="text-xs font-semibold text-foreground">
                    &Aacute;rea o Cargo de Inter&eacute;s <span className="text-primary">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    defaultValue="Asesor Comercial / Corredor Inmobiliario"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  >
                    <option value="Asesor Comercial / Corredor Inmobiliario">Asesor Comercial / Corredor Inmobiliario</option>
                    <option value="Captador de Propiedades y Terrenos">Captador de Propiedades y Terrenos</option>
                    <option value="Tasador / Perito Inmobiliario">Tasador / Perito Inmobiliario</option>
                    <option value="Asistente Administrativo / Operaciones">Asistente Administrativo / Operaciones</option>
                    <option value="Área Legal / Estudio de Títulos">Área Legal / Estudio de Títulos</option>
                    <option value="Otra área">Otra área o postulación espontánea</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-semibold text-foreground">
                    Ciudad de Residencia <span className="text-primary">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    placeholder="Ej: Talca, Santiago, Curicó..."
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="experience" className="text-xs font-semibold text-foreground">
                    Experiencia en Ventas o Corretaje
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    defaultValue="1 a 2 años de experiencia"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Sin experiencia previa (con alta motivación)">Sin experiencia previa (con alta motivación)</option>
                    <option value="Menos de 1 año">Menos de 1 año</option>
                    <option value="1 a 2 años de experiencia">1 a 2 años de experiencia</option>
                    <option value="3 a 5 años de experiencia">3 a 5 años de experiencia</option>
                    <option value="Más de 5 años de experiencia">Más de 5 años de experiencia</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="availability" className="text-xs font-semibold text-foreground">
                    Disponibilidad para Comenzar
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    defaultValue="Inmediata"
                    className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Inmediata">Inmediata</option>
                    <option value="15 días">15 días</option>
                    <option value="1 mes">1 mes</option>
                    <option value="Part-time / Por comisión">Part-time / Por comisión</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="linkedin" className="text-xs font-semibold text-foreground">
                  Perfil de LinkedIn o Enlace a Curr&iacute;culum (Opcional)
                </label>
                <input
                  id="linkedin"
                  name="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/tu-perfil o link de Google Drive"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="presentation" className="text-xs font-semibold text-foreground">
                  Carta de Presentaci&oacute;n o Resumen de tu Experiencia
                </label>
                <textarea
                  id="presentation"
                  name="presentation"
                  rows={4}
                  placeholder="Cuéntanos sobre tu trayectoria, tus fortalezas comerciales y por qué te gustaría formar parte de NyS Residencial..."
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

            </div>
          )}

          {/* Botón de Envío */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <span>Enviando solicitud...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{tipo === 'vender' ? 'Enviar Solicitud de Venta' : 'Enviar Postulación'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
