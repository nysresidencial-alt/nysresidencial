'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { loginClient } from './actions'
import { ArrowLeft, Lock, User, ShieldCheck, Loader2, HelpCircle, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

export default function ClientLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await loginClient(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 px-4 py-12 relative">
      
      {/* Botones superiores: Volver y Toggle Tema */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors font-medium bg-card border border-border px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a NYS Residencial</span>
        </Link>

        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-full bg-card border border-border shadow-sm cursor-pointer"
          title="Cambiar tema claro/oscuro"
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        
        {/* Tarjeta de Login */}
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-xl">
          
          {/* Logo y Encabezado */}
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
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portal Privado de Clientes</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Oficina Virtual
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 leading-relaxed">
              Consulta tus contratos, certificados y documentos de forma privada, segura y centralizada.
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-3.5 rounded-2xl mb-6 text-xs text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>RUT, Correo o Usuario</span>
                <span className="text-[11px] text-muted-foreground font-normal">Ej: test</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder="Ej: test o 12.345.678-9"
                  defaultValue="test"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Contraseña</span>
                <span className="text-[11px] text-muted-foreground font-normal">Ej: test</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Tu contraseña"
                  defaultValue="test"
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Hint para pruebas */}
            <div className="bg-muted/60 border border-border/80 p-3 rounded-xl text-[11px] text-muted-foreground flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Acceso de prueba activado:</span> puedes ingresar directamente con usuario <strong>test</strong> y contraseña <strong>test</strong>.
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Ingresando a tu Oficina Virtual...</span>
                </>
              ) : (
                <span>Ingresar a mi Oficina Virtual</span>
              )}
            </Button>
          </form>

          {/* Ayuda y Soporte */}
          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>¿Problemas para acceder o necesitas una cuenta?</p>
            <a
              href="https://wa.me/56992893145?text=Hola,%20necesito%20asistencia%20con%20el%20acceso%20a%20la%20Oficina%20Virtual%20de%20NyS"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold mt-1 inline-block"
            >
              Contactar a Soporte NyS vía WhatsApp &rarr;
            </a>
          </div>

        </div>

        {/* Footer legal */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} NyS Negocios y Soluciones Inmobiliarias. Acceso cifrado y confidencial.
        </p>

      </div>
    </div>
  )
}
