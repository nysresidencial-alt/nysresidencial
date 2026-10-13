import { SolicitudForm } from "./SolicitudForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender mi Propiedad o Trabajar con Nosotros",
  description: "Publica y consigna tu propiedad con expertos inmobiliarios en Talca, o postula para formar parte de nuestro equipo comercial.",
};

export default async function SolicitudPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const initialType = tipo === "trabajar" ? "trabajar" : "vender";

  return (
    <div className="pt-8 pb-16 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        
        {/* Enlace para volver */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>

        <SolicitudForm initialType={initialType} />
      </div>
    </div>
  );
}
