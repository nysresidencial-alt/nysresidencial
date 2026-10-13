import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://nysresidencial.cl"),
  title: {
    default: "NYS Residencial | Corredora de Propiedades en Talca y Chile",
    template: "%s | NYS Residencial",
  },
  description:
    "Corredora de propiedades líder en Talca y Región del Maule. Venta y arriendo de departamentos, casas, parcelas, terrenos y predios agrícolas. Asesoría inmobiliaria personalizada desde 1999.",
  keywords: [
    "propiedades en Talca",
    "corredora de propiedades Talca",
    "venta de departamentos en Talca",
    "arriendo de departamentos en Talca",
    "casas en venta Talca",
    "casas en arriendo Talca",
    "departamentos Talca",
    "parcelas en Talca",
    "terrenos en venta Maule",
    "predios agricolas Maule",
    "corretaje de propiedades",
    "inmobiliaria Talca",
    "comprar departamento Talca",
    "arrendar casa Talca",
    "NYS Residencial",
    "NYS Inmobiliaria",
    "Las Rastras Talca",
    "El Golf Santiago propiedades",
    "tasacion de propiedades Talca",
  ],
  authors: [{ name: "NYS Residencial", url: "https://nysresidencial.cl" }],
  creator: "NYS Residencial",
  publisher: "NYS Residencial",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "https://nysresidencial.cl",
  },
  openGraph: {
    title: "NYS Residencial | Corredora de Propiedades en Talca y Chile",
    description:
      "Venta y arriendo de departamentos, casas, parcelas y terrenos en Talca y Chile. Más de 25 años de trayectoria inmobiliaria.",
    url: "https://nysresidencial.cl",
    siteName: "NYS Residencial",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&h=630&auto=format&fit=crop",
        width: 1200,
        height: 630,
        alt: "NYS Residencial - Propiedades en Talca",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NYS Residencial | Corredora de Propiedades en Talca",
    description: "Venta y arriendo de departamentos, casas y parcelas en Talca y Maule.",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&h=630&auto=format&fit=crop"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "NYS Residencial",
  "alternateName": "NyS Inmobiliaria",
  "url": "https://nysresidencial.cl",
  "logo": "https://nysresidencial.cl/favicon.ico",
  "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200",
  "description": "Corredora de propiedades y asesoría inmobiliaria especializada en venta y arriendo de departamentos, casas y terrenos en Talca y Chile.",
  "telephone": "+56 9 9289 3145",
  "email": "contacto@nys.cl",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 Sur 885, Piso 3",
    "addressLocality": "Talca",
    "addressRegion": "Región del Maule",
    "postalCode": "3460000",
    "addressCountry": "CL",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -35.4270136,
    "longitude": -71.6668005,
  },
  "areaServed": [
    { "@type": "City", "name": "Talca" },
    { "@type": "City", "name": "Curicó" },
    { "@type": "City", "name": "Linares" },
    { "@type": "City", "name": "Santiago" },
    { "@type": "AdministrativeArea", "name": "Región del Maule" },
  ],
  "priceRange": "$$",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
