const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // page.tsx
  content = content.replace(/imǟgenes/g, 'imágenes');
  content = content.replace(/Regiǟn/g, 'Región');
  content = content.replace(/Agrǟ''colas/g, 'Agrícolas');
  content = content.replace(/hectǟ''reas/g, 'hectáreas');
  
  // PropertiesGrid.tsx
  content = content.replace(/Ver mǟ'Ń\?Tǟ\?s's/g, 'Ver más');
  content = content.replace(/Ver mǟ''s/g, 'Ver más');
  content = content.replace(/Ver mÃƒÂÆ’Ã‚Â¡s/g, 'Ver más'); // Extra safe
  
  fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('./src/app/(public)/page.tsx');
fixFile('./src/components/PropertiesGrid.tsx');
