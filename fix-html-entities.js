const fs = require('fs');

let content = fs.readFileSync('./src/components/PropertiesGrid.tsx', 'utf8');
content = content.replace(/Ver m[^s]+s &rarr;/g, 'Ver m&aacute;s &rarr;');
fs.writeFileSync('./src/components/PropertiesGrid.tsx', content, 'utf8');

let pageContent = fs.readFileSync('./src/app/(public)/page.tsx', 'utf8');
pageContent = pageContent.replace(/im[^g]+genes del carrusel/g, 'im&aacute;genes del carrusel');
pageContent = pageContent.replace(/Talca, Regi[^n]+n del Maule/g, 'Talca, Regi&oacute;n del Maule');
pageContent = pageContent.replace(/Predios Agr[^c]+colas y Forestales/g, 'Predios Agr&iacute;colas y Forestales');
pageContent = pageContent.replace(/Extensas hect[^r]+reas productivas/g, 'Extensas hect&aacute;reas productivas');
fs.writeFileSync('./src/app/(public)/page.tsx', pageContent, 'utf8');
