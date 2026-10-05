const fs = require('fs');
let content = fs.readFileSync('./src/components/PropertiesGrid.tsx', 'utf8');

// Using a very broad regex to catch anything that says "Ver m...s" and replace it with "Ver más"
content = content.replace(/Ver m[^s]+s &rarr;/g, 'Ver más &rarr;');

fs.writeFileSync('./src/components/PropertiesGrid.tsx', content, 'utf8');

let pageContent = fs.readFileSync('./src/app/(public)/page.tsx', 'utf8');
pageContent = pageContent.replace(/im[^g]+genes del carrusel/g, 'imágenes del carrusel');
pageContent = pageContent.replace(/Talca, Regi[^n]+n del Maule/g, 'Talca, Región del Maule');
pageContent = pageContent.replace(/Predios Agr[^c]+colas y Forestales/g, 'Predios Agrícolas y Forestales');
pageContent = pageContent.replace(/Extensas hect[^r]+reas productivas/g, 'Extensas hectáreas productivas');
fs.writeFileSync('./src/app/(public)/page.tsx', pageContent, 'utf8');
