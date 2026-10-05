const fs = require('fs');
const path = './src/app/(public)/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldIframeStr = `<div className="relative h-[400px] w-full rounded-3xl overflow-hidden shadow-xl border border-border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src="https://maps.google.com/maps?q=Talca,Chile&t=&z=14&ie=UTF8&iwloc=&output=embed"
              ></iframe>
            </div>`;

const newMapStr = `<div className="flex flex-col gap-4">
              <div className="relative h-[300px] w-full rounded-3xl overflow-hidden shadow-xl border border-border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src="https://maps.google.com/maps?q=Talca,Chile&t=&z=14&ie=UTF8&iwloc=&output=embed"
                ></iframe>
              </div>
              <a 
                href="https://maps.google.com/?q=Talca,Chile"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg hover:shadow-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Visitar Oficina
              </a>
            </div>`;

content = content.replace(oldIframeStr, newMapStr);
fs.writeFileSync(path, content, 'utf8');
