'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { UFWidget } from "@/components/UFWidget";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar({ topPhone }: { topPhone?: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top Phone Bar */}
      {topPhone && (
        <div className="bg-primary/90 text-primary-foreground text-xs font-medium py-1.5 px-4 text-center z-[60] relative">
          <div dangerouslySetInnerHTML={{ __html: topPhone }} className="inline-flex items-center justify-center gap-4 prose prose-sm prose-invert [&>p]:m-0" />
        </div>
      )}

      <nav
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-300 border-b",
          topPhone ? "top-[28px]" : "top-0",
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-border shadow-sm py-4"
            : "bg-transparent border-transparent py-6"
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span
                className={cn(
                  "text-2xl font-bold tracking-tight transition-colors",
                  isScrolled ? "text-foreground" : "text-white"
                )}
              >
                NYS
                <span className="font-light text-primary">Residencial</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isScrolled ? "text-muted-foreground" : "text-white/90"
                )}
              >
                Inicio
              </Link>
              <Link
                href="/propiedades"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isScrolled ? "text-muted-foreground" : "text-white/90"
                )}
              >
                Propiedades
              </Link>
              <Link
                href="/nosotros"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isScrolled ? "text-muted-foreground" : "text-white/90"
                )}
              >
                Quiénes Somos
              </Link>
              <Link
                href="/contacto"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isScrolled ? "text-muted-foreground" : "text-white/90"
                )}
              >
                Contacto
              </Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="mr-2">
                <UFWidget />
              </div>
              
              <Button
                variant={isScrolled ? "ghost" : "link"}
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={isScrolled ? "" : "text-white hover:text-white/80"}
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button variant={isScrolled ? "default" : "secondary"}>
                Publicar Propiedad
              </Button>
              <Link
                href="/admin/login"
                className={cn(
                  "hidden md:inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition-colors border",
                  isScrolled 
                    ? "bg-zinc-950 text-white border-zinc-800 hover:bg-zinc-800" 
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md"
                )}
              >
                Ingresar
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={isScrolled ? "" : "text-white"}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-4 shadow-lg flex flex-col space-y-4">
              <Link href="/" className="text-foreground hover:text-primary py-2">
                Inicio
              </Link>
              <Link href="/propiedades" className="text-foreground hover:text-primary py-2">
                Propiedades
              </Link>
              <Link href="/nosotros" className="text-foreground hover:text-primary py-2">
                Quiénes Somos
              </Link>
              <Link href="/contacto" className="text-foreground hover:text-primary py-2">
                Contacto
              </Link>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
                <Button>Publicar Propiedad</Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
