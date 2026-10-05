const fs = require('fs');
const path = './src/app/(public)/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const mapRegex = /\{\/\* Mapa Interactivo \*\/\}[\s\S]*?<\/section>/;

const newOfficeMap = `{/* Oficina y Contacto */}
      <section className="w-full py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-secondary uppercase">
                Visita Nuestra Oficina
              </h2>
              <p className="text-muted-foreground text-lg">
                Te invitamos a tomarte un café con nosotros. En NyS Residencial estamos listos para asesorarte de manera presencial, con la confianza y el profesionalismo que nos caracteriza.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold">Dirección Central</h4>
                    <p className="text-muted-foreground">Región del Maule, Chile</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold">Contáctanos</h4>
                    <p className="text-muted-foreground">Escríbenos o agenda tu visita</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-xl border border-border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src="https://maps.google.com/maps?q=Talca,Chile&t=&z=14&ie=UTF8&iwloc=&output=embed"
              ></iframe>
            </div>
          </div>
        </div>
      </section>`;

content = content.replace(mapRegex, newOfficeMap);

// Remove the import of GlobalMap
content = content.replace(/import \{ GlobalMap \} from "@\/components\/GlobalMap";\n/, '');

// Remove the latitude/longitude fetching to avoid Prisma errors since we removed them from schema
const prismaFetchRegex = /latitude: \{ not: null \},\s*longitude: \{ not: null \},/;
content = content.replace(prismaFetchRegex, '');

const selectRegex = /latitude: true,\s*longitude: true,/;
content = content.replace(selectRegex, '');

fs.writeFileSync(path, content, 'utf8');
