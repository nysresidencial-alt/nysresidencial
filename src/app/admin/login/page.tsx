'use client';

import { useState } from 'react';
import { login } from './actions';
import { Mail, Lock, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    
    const result = await login(formData);
    
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-100 via-stone-50 to-rose-50/40 px-4 py-12 relative overflow-hidden text-slate-800">
      
      {/* Luces ambientales suaves de fondo */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-200/40 blur-3xl"
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl"
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-200/20 blur-3xl"
      />

      {/* Botón superior para volver al sitio público */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors font-medium bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al sitio web</span>
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Tarjeta de Login */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/60">
          
          {/* Header del Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative h-16 w-24">
                <Image
                  src="/logo-nys.png"
                  alt="NyS Residencial"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Residencial &bull; Panel Admin</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Iniciar Sesi&oacute;n
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Ingresa tus credenciales autorizadas para gestionar el portal.
            </p>
          </div>

          {/* Formulario */}
          <form action={onSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Correo Electr&oacute;nico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.cl"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Contrase&ntilde;a
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-primary hover:bg-primary/90 active:scale-[0.99] disabled:opacity-70 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ingresar al Panel</span>
                </>
              )}
            </button>

          </form>

        </div>

        {/* Pie informativo */}
        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} NyS Inmobiliaria &bull; Sistema de Gesti&oacute;n Interno
        </p>

      </div>
    </div>
  );
}
