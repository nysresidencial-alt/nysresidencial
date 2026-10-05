const fs = require('fs');
const path = './src/app/(public)/propiedades/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const mapSectionRegex = /<section className="bg-card border border-border rounded-xl p-6">\s*<h2 className="text-2xl font-bold mb-4">Ubicaci[oó]n<\/h2>[\s\S]*?<\/section>/;

const mapSectionNew = `{property.googleMapsLink && (
          <section className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-2xl font-bold">Ubicación de la Propiedad</h2>
            <p className="text-muted-foreground">
              Haz clic en el botón a continuación para abrir la ubicación exacta de esta propiedad directamente en Google Maps.
            </p>
            <a 
              href={property.googleMapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg hover:shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Ver ubicación exacta
            </a>
          </section>
          )}`;

content = content.replace(mapSectionRegex, mapSectionNew);
fs.writeFileSync(path, content, 'utf8');
