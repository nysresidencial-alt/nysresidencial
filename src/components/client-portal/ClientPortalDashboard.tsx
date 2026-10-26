'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClientUser, ClientDocument } from '@prisma/client'
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  LogOut, 
  ShieldCheck, 
  FolderLock, 
  Calendar, 
  FileCheck2, 
  MessageCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logoutClient } from '@/app/oficina-virtual/login/actions'
import { useTheme } from '@/components/ThemeProvider'

interface ClientPortalDashboardProps {
  client: ClientUser & { documents: ClientDocument[] }
}

export function ClientPortalDashboard({ client }: ClientPortalDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    client.documents.forEach((d) => {
      if (d.category) set.add(d.category)
    })
    return ['TODOS', ...Array.from(set)]
  }, [client.documents])

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return client.documents.filter((doc) => {
      if (selectedCategory !== 'TODOS' && doc.category !== selectedCategory) return false
      if (searchTerm) {
        const query = searchTerm.toLowerCase()
        const matchTitle = doc.title.toLowerCase().includes(query)
        const matchCat = doc.category.toLowerCase().includes(query)
        const matchNotes = doc.notes?.toLowerCase().includes(query)
        if (!matchTitle && !matchCat && !matchNotes) return false
      }
      return true
    })
  }, [client.documents, selectedCategory, searchTerm])

  function getCategoryColor(category: string) {
    const cat = category.toLowerCase()
    if (cat.includes('contrato')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    if (cat.includes('escritura')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
    if (cat.includes('tasaci') || cat.includes('informe')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
    if (cat.includes('certific')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    if (cat.includes('liquidaci')) return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
    return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      
      {/* Top Client Navbar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Portal title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-10 w-14 shrink-0">
                <Image
                  src="/logo-nys.png"
                  alt="NyS Residencial"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col border-l border-border pl-3">
                <span className="font-bold text-sm sm:text-base leading-tight tracking-tight text-foreground flex items-center gap-1.5">
                  <span>Oficina Virtual</span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                    Clientes
                  </span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                  NyS Negocios y Soluciones
                </span>
              </div>
            </Link>
          </div>

            {/* Theme Toggle & User profile & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/60 border border-border/60 cursor-pointer"
                title="Cambiar tema claro/oscuro"
              >
                {mounted && theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
              </button>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {client.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {client.rut ? `RUT: ${client.rut}` : (client.email || 'Cliente verificado')}
                </span>
              </div>

              <form action="/oficina-virtual/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-background hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors cursor-pointer shadow-xs"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </form>
            </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full space-y-8">
        
        {/* Welcome Hero Banner */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Espacio Privado y Cifrado</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              Bienvenido(a), {client.name}
            </h1>
            
            <p className="text-muted-foreground text-xs sm:text-sm mt-2 leading-relaxed">
              En este portal puedes acceder de forma inmediata a tus contratos, escrituras notariales, tasaciones comerciales e informes de tus operaciones gestionadas con NyS Inmobiliaria.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border/80">
              <div className="flex items-center gap-2 bg-muted/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-foreground">
                <FileCheck2 className="w-4 h-4 text-primary" />
                <span>{client.documents.length} {client.documents.length === 1 ? 'documento disponible' : 'documentos disponibles'}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cuenta activa y sincronizada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar text-xs font-medium">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>

        </div>

        {/* Documents Grid */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <FolderLock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No se encontraron documentos</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? 'No hay archivos que coincidan con el término de búsqueda ingresado.' 
                : 'Aún no tienes documentos cargados en esta categoría. Tu ejecutivo los subirá en cuanto estén formalizados.'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="mt-4 rounded-full text-xs"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDocuments.map((doc) => {
              const formattedDate = new Date(doc.createdAt).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })

              return (
                <div 
                  key={doc.id}
                  className="group bg-card border border-border rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top line: Category pill + File Type badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                      
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                        {doc.isExternal ? 'OneDrive / Web' : doc.fileType}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {doc.title}
                    </h3>

                    {/* Notes / Description */}
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Footer: Date, Size & Download Button */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formattedDate}</span>
                      {doc.fileSize && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{doc.fileSize}</span>
                        </>
                      )}
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-semibold text-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      {doc.isExternal ? (
                        <>
                          <span>Abrir</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Descargar</span>
                          <Download className="w-3.5 h-3.5" />
                        </>
                      )}
                    </a>
                  </div>

                </div>
              )
            })}
          </div>
        )}

        {/* Support Section for Clients */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>¿Necesitas un documento adicional o aclaración sobre tu contrato?</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Tu ejecutivo de NyS Propiedades está disponible para atenderte, redactar copias notariales o coordinar firmas pendientes.
            </p>
          </div>

          <a
            href="https://wa.me/56992893145?text=Hola,%20soy%20cliente%20de%20NyS%20y%20tengo%20una%20consulta%20sobre%20mis%20documentos%20en%20la%20Oficina%20Virtual."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-md cursor-pointer shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contactar a mi Asesor vía WhatsApp</span>
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} NyS Negocios y Soluciones Inmobiliarias. Portal Oficina Virtual de Clientes.</p>
      </footer>

    </div>
  )
}
