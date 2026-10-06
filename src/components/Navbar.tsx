'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Menu, X, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

export function Navbar({ topPhone }: { topPhone?: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
        
        {/* Logo and Titles */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4">
            {/* Logo NYS */}
            <div className="flex items-center">
              <span className="text-[50px] font-thin leading-none text-primary tracking-tighter" style={{ fontFamily: 'Times New Roman, serif' }}>
                N<span className="text-[40px] align-top">Y</span>S
              </span>
            </div>
            <div className="flex flex-col border-l border-border pl-4">
              <span className="text-xl text-foreground tracking-widest font-light">
                RESIDENCIAL
              </span>
              <span className="text-[11px] text-muted-foreground">
                Buscar la mejor opci&oacute;n es nuestro compromiso desde 1999
              </span>
            </div>
          </Link>
        </div>

        {/* Contact Info Right */}
        <div className="hidden md:flex flex-col items-end text-[12px] text-muted-foreground">
          <Phone className="w-4 h-4 text-foreground mb-1" />
          <span>+56 9 9289 3145 | +56 9 7387 7812</span>
          <span>contacto@nys.cl</span>
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
                      "px-6 text-sm transition-colors h-full flex items-center border-b-2 hover:text-primary hover:border-primary",
                      isActive ? "text-primary border-primary" : "text-foreground border-transparent"
                    )}
                  >
                    {link.name}
                  </Link>
                  {index < navLinks.length - 1 && (
                    <span className="text-muted-foreground opacity-50">|</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center ml-auto gap-2">
            <Link 
              href="/admin/login" 
              className="hidden md:inline-flex items-center justify-center bg-muted-foreground/10 hover:bg-muted-foreground/20 text-foreground px-4 py-1.5 rounded-sm text-xs font-semibold transition-colors border border-border"
            >
              Ingresar
            </Link>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              title="Cambiar tema"
            >
              {mounted && theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              className="md:hidden text-foreground p-2 ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg flex flex-col z-50">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className="text-foreground hover:text-primary py-3 px-4 border-b border-border last:border-none"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            href="/admin/login" 
            className="text-foreground font-semibold hover:text-primary py-3 px-4 border-t border-border bg-muted/50"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Ingresar al Panel
          </Link>
        </div>
      )}
    </header>
  );
}
