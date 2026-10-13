'use client';

import { useState } from 'react';
import { login } from './actions';
import { Mail, Lock, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 px-4 py-12 relative">
      
      {/* Botón superior para volver al sitio público */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium bg-background border border-border px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al sitio web
      </Link>

      <div className="w-full max-w-md">
        
        {/* Tarjeta de Login */}
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-xl">
          
          {/* Header del Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-3">
              <span 
                className="text-5xl font-thin leading-none text-primary tracking-tighter" 
                style={{ fontFamily: 'Times New Roman, serif' }}
              >
                N<span className="text-4xl align-top">Y</span>S
              </span>
            </div>
            
            <div className="text-xs tracking-widest uppercase font-light text-muted-foreground mb-4">
              RESIDENCIAL &bull; PANEL ADMIN
            </div>

            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Iniciar Sesi&oacute;n
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ingresa tus credenciales autorizadas para gestionar el portal.
            </p>
          </div>

          {/* Formulario */}
          <form action={onSubmit} className="space-y-5">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Correo Electr&oacute;nico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@nys.cl o tu correo"
                  required
                  defaultValue="comercial@nys.cl"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-foreground">
                Contrase&ntilde;a
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-70 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer mt-2"
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
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} NyS Inmobiliaria &bull; Sistema de Gesti&oacute;n Interno
        </p>

      </div>
    </div>
  );
}
