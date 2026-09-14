"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Property } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

// Fix Leaflet's default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapComponentProps {
  properties: Property[];
}

export default function MapComponent({ properties }: MapComponentProps) {
  // Filter properties that have valid latitude and longitude
  const mappedProperties = properties.filter(
    (p) => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude))
  );

  // Center on Talca/Maule area by default
  const center: [number, number] = [-35.4264, -71.6554];

  if (mappedProperties.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 rounded-2xl border-2 border-dashed border-border text-center p-8">
        <h3 className="text-xl font-bold mb-2">Aún no hay propiedades en el mapa</h3>
        <p className="text-muted-foreground">
          Añade la latitud y longitud a tus propiedades desde el panel de administrador para que aparezcan aquí.
        </p>
      </div>
    );
  }

  return (
    <MapContainer 
      center={center} 
      zoom={9} 
      scrollWheelZoom={false}
      preferCanvas={true}
      className="w-full h-full z-0 rounded-2xl shadow-md border border-border"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {mappedProperties.map((prop) => (
        <Marker
          key={prop.id}
          position={[parseFloat(prop.latitude!), parseFloat(prop.longitude!)]}
        >
          <Popup className="custom-popup">
            <div className="w-48 overflow-hidden rounded-lg flex flex-col gap-2 p-1">
              {prop.images && prop.images.length > 0 && (
                <div className="relative w-full h-24 rounded-md overflow-hidden bg-muted">
                  <Image
                    src={prop.images[0]}
                    alt={prop.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <h4 className="font-bold text-sm leading-tight text-foreground">{prop.title}</h4>
              <p className="text-xs text-muted-foreground m-0">{prop.sector}, {prop.city}</p>
              <p className="font-bold text-primary m-0 mt-1">{prop.currency} {prop.price.toLocaleString("es-CL")}</p>
              <Link 
                href={`/propiedades/${prop.id}`}
                className="mt-2 w-full text-center bg-primary text-primary-foreground text-xs py-1.5 rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Ver Propiedad
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
