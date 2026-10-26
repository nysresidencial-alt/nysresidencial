'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Moon, Sun, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface NavbarProps {
  topPhone?: string;
  slogan?: string;
}

function parseTopContact(raw?: string) {
  if (!raw) {
    return {
      phones: ["+56 9 9289 3145", "+56 9 7387 7812"],
      email: "contacto@nys.cl"
    };
  }

  // Intentar parsear si viene como JSON
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      const phones: string[] = [];
      if (data.phone1) phones.push(String(data.phone1).trim());
      if (data.phone2) phones.push(String(data.phone2).trim());
      return {
        phones: phones.length > 0 ? phones : ["+56 9 9289 3145"],
        email: data.email ? String(data.email).trim() : "contacto@nys.cl"
      };
    }
  } catch (e) {
    // Si no es JSON continúa con HTML o texto plano
  }

  // Parsear texto plano o contenido HTML guardado por el editor
  const clean = raw.replace(/<br\s*[\/]?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ');
  const parts = clean.split(/[\n|]/).map((s) => s.trim()).filter(Boolean);

  let email = "";
  const phones: string[] = [];

  for (const part of parts) {
    if (part.includes('@')) {
      const match = part.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match) email = match[0];
    } else {
      const digits = part.replace(/[^0-9]/g, '');
      if (digits.length >= 7) {
        phones.push(part);
      }
    }
  }

  return {
    phones: phones.length > 0 ? phones : ["+56 9 9289 3145"],
    email: email || "comercial@nys.cl"
  };
}

export function Navbar({ topPhone, slogan }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const contact = parseTopContact(topPhone);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Quienes Somos", href: "/nosotros" },
    { name: "Equipo", href: "/equipo" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <header className="w-full bg-background relative z-50">
      
      {/* Top Header Section */}
      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo y Eslogan */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4 group">
            {/* Logo NYS Oficial */}
            <div className="relative h-14 w-20 shrink-0">
              <Image
                src="/logo-nys.png"
                alt="NyS Residencial"
                fill
                priority
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col border-l border-border pl-4">
              <span className="text-xl text-foreground tracking-widest font-light">
                RESIDENCIAL
              </span>
              <span className="text-[11px] text-muted-foreground line-clamp-1">
                {slogan || "Buscar la mejor opción es nuestro compromiso desde 1999"}
              </span>
            </div>
          </Link>
        </div>

        {/* Contact Info Right (WhatsApp y Mail interactivos) */}
        <div className="hidden md:flex flex-col items-end text-[12px] text-muted-foreground gap-1">
          {/* Teléfonos con WhatsApp */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {contact.phones.map((phone, idx) => {
              const cleanDigits = phone.replace(/[^0-9]/g, '');
              const waLink = `https://wa.me/${cleanDigits}`;
              return (
                <a
                  key={idx}
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-foreground hover:text-green-600 transition-colors font-medium px-2 py-0.5 rounded-md hover:bg-green-500/10 cursor-pointer"
                  title={`Abrir WhatsApp al ${phone}`}
                >
                  <svg className="w-3.5 h-3.5 text-green-600 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29" />
                  </svg>
                  <span className="text-xs">{phone}</span>
                </a>
              );
            })}
          </div>

          {/* Email con enlace mailto */}
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs px-2 py-0.5 rounded-md hover:bg-primary/5 cursor-pointer"
              title={`Enviar correo a ${contact.email}`}
            >
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{contact.email}</span>
            </a>
          )}
        </div>
      </div>

      {/* Navigation Links Bar */}
      <nav className="w-full border-t border-border">
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex justify-between items-center h-12 relative">
          
          <div className="md:hidden w-10"></div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-0 h-full mx-auto">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <div key={link.href} className="flex items-center h-full">
                  <Link
                    href={link.href}
                    className={cn(
                      "px-6 text-sm transition-colors h-full flex items-center border-b-2 hover:text-primary hover:border-primary font-medium",
                      isActive ? "text-primary border-primary" : "text-foreground border-transparent"
                    )}
                  >
                    {link.name}
                  </Link>
                  {index < navLinks.length - 1 && (
                    <span className="text-muted-foreground opacity-30 select-none">|</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Theme Toggle & Botones */}
          <div className="flex items-center ml-auto gap-2">
            <Link 
              href="/oficina-virtual" 
              className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border border-primary/25 shadow-xs cursor-pointer"
              title="Acceso exclusivo para clientes NyS"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Oficina Virtual</span>
            </Link>
            <Link 
              href="/admin/login" 
              className="hidden md:inline-flex items-center justify-center bg-muted/80 hover:bg-muted text-foreground hover:text-primary px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-border/80 shadow-sm"
            >
              Admin
            </Link>
            <button 
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted/50 cursor-pointer"
              title="Cambiar tema claro/oscuro"
            >
              {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              type="button"
              className="md:hidden text-foreground p-2 ml-1 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg flex flex-col z-50">
          <div className="p-3 bg-muted/30 border-b border-border">
            <Link 
              href="/oficina-virtual" 
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-bold shadow-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Lock className="w-4 h-4" />
              <span>Oficina Virtual de Clientes</span>
            </Link>
          </div>
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-foreground hover:text-primary py-3 px-4 border-b border-border last:border-none font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="p-4 border-t border-border flex flex-col gap-2 bg-muted/20">
            {contact.phones.map((phone, idx) => {
              const cleanDigits = phone.replace(/[^0-9]/g, '');
              return (
                <a
                  key={idx}
                  href={`https://wa.me/${cleanDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-green-600 py-1"
                >
                  <svg className="w-4 h-4 text-green-600 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.57c.13.17 1.76 2.68 4.26 3.76.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29" />
                  </svg>
                  <span>WhatsApp: {phone}</span>
                </a>
              );
            })}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary py-1"
              >
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>{contact.email}</span>
              </a>
            )}
          </div>
          <Link 
            href="/admin/login" 
            className="text-foreground font-semibold hover:text-primary py-3 px-4 border-t border-border bg-muted/40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Ingresar al Panel
          </Link>
        </div>
      )}
    </header>
  );
}
