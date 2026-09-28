import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando limpieza de la base de datos...')
  
  // Limpiar todas las propiedades actuales
  await prisma.property.deleteMany({})
  console.log('✅ Todas las propiedades antiguas han sido eliminadas.')

  console.log('Cargando el nuevo portafolio de septiembre 2026...')

  const properties = [
    // PAGE 3 - CASAS
    { title: 'Casa Tejas Verdes 1', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 8590, builtArea: 191, landArea: 2500, beds: 4, baths: 4, city: 'Talca', sector: 'Tejas Verdes', description: 'Casa de 191 m² en 2.500 m² de terreno, 4 dormitorios, 4 baños y piscina.', publishedState: 'Publicado' },
    { title: 'Gran Casa 10 Oriente 1 y 2 Norte', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 11600, builtArea: 269, landArea: 799, beds: 4, baths: 4, city: 'Talca', sector: 'Centro', description: 'Gran casa de 269 m² construidos en 799 m² de terreno. 4 dormitorios, 4 baños, amplios espacios interiores, piscina con cascada y gran jardín. Excelente ubicación céntrica; uso de suelo comercial. (Opción Arriendo: UF 40)', publishedState: 'Publicado' },
    { title: 'Departamento Lago Colbún', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 6500, builtArea: 0, beds: 4, baths: 2, city: 'Colbún', sector: 'Lago Colbún', description: 'Departamento ubicado en Lago Colbún: 4 dormitorios, principal en suite; 2 baños, living comedor, cocina americana con cubierta de cuarzo, calefacción central con radiadores a gas, terraza, bodega, quincho, piscina y muelle flotante con acceso directo al lago.', publishedState: 'Publicado' },
    { title: 'Casa Solar del Parque', propertyType: 'Casa', operation: 'Venta', currency: 'CLP', price: 146900000, builtArea: 99, landArea: 200, beds: 3, baths: 2, city: 'Talca', sector: 'Solar del Parque', description: 'Casa de 99 m² en 200 m² de terreno, 3 dormitorios, 2 baños y amplio jardín. A pasos de Centro Comercial TUE.', publishedState: 'Publicado' },
    { title: 'Casa Parque San Valentín', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 5200, builtArea: 98, beds: 1, baths: 1, city: 'Talca', sector: 'Parque San Valentín', description: 'Casa de 98 m². Dormitorio principal con baño en suite, cocina amoblada, living comedor, estufa, sala de estar, clósets en dormitorios y logia techada.', publishedState: 'Publicado' },
    { title: 'Casa La Ponderosa', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 4100, city: 'Talca', sector: 'La Ponderosa', description: 'Activo residencial incorporado en el informe base.', publishedState: 'Publicado' },
    { title: 'Casa Loteo La Reina', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 14500, builtArea: 320, landArea: 5290, beds: 5, baths: 4, city: 'Talca', sector: 'Loteo La Reina', description: 'Casa de 320 m² en 5.290 m² de terreno, 5 dormitorios en suite, 4 baños, amplio living, comedor, cocina, terraza, quincho y piscina.', publishedState: 'Publicado' },
    { title: 'Casa Tejas Verdes', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 23000, builtArea: 405, landArea: 2290, beds: 5, baths: 5, city: 'Talca', sector: 'Tejas Verdes', description: 'Casa de 405 m² en terreno de 2.290 m². 5 dormitorios más dormitorio de servicio con baño, sala de estar, lavandería en subterráneo, estudio con terraza en tercer piso, amplios espacios, agua potable y alcantarillado, cierre perimetral, dos norias, portón automático, jardines y caldera a pellet. (Opción Arriendo: UF 65)', publishedState: 'Publicado' },

    // PAGE 4
    { title: 'Casa Loteo Pencahue', propertyType: 'Casa', operation: 'Venta', currency: 'UF', price: 11900, builtArea: 340, landArea: 5000, beds: 5, baths: 4, city: 'Pencahue', sector: 'Loteo Pencahue', description: 'Casa en loteo exclusivo: 5D + 4B + servicio. Construcción 340 m² / terreno 5.000 m² + quincho 90 m², ventanas termopanel, calefacción por radiadores a petróleo y piscina.', publishedState: 'Publicado' },

    // PAGE 5
    { title: 'Departamento Edificio Amalfi (46m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1930, builtArea: 46, beds: 2, baths: 2, city: 'Talca', sector: 'Centro', description: '2 dormitorios, 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento Edificio Amalfi (43m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1792, builtArea: 43, beds: 2, baths: 1, city: 'Talca', sector: 'Centro', description: '2 dormitorios, 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Edificio Amalfi (32m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1550, builtArea: 32, beds: 1, baths: 1, city: 'Talca', sector: 'Centro', description: '1 dormitorio, 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Edificio Amalfi (40m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1790, builtArea: 40, beds: 2, baths: 1, city: 'Talca', sector: 'Centro', description: '2 dormitorios, 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Torre Talca', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 2190, builtArea: 108, beds: 3, baths: 2, city: 'Talca', sector: 'Centro', description: '108 m², 3 dormitorios, 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento Marín de Poveda', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 2550, builtArea: 72, beds: 2, baths: 2, city: 'Talca', sector: 'Marín de Poveda', description: '72 m², 2 dormitorios, 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento San Francisco', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 2100, builtArea: 42, beds: 1, baths: 1, city: 'Talca', sector: 'San Francisco', description: '42 m², 1 dormitorio, 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Edificio Aire Urbano (Paz)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1550, builtArea: 30, beds: 1, baths: 1, city: 'Talca', sector: 'Centro', description: '30 m², 1 dormitorio, 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Don Isidoro', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 11900, builtArea: 205, beds: 3, baths: 3, parking: 2, city: 'Talca', sector: 'Don Isidoro', description: '205 m² construidos, 3 dormitorios, 3 baños, dormitorio de servicio con baño, 2 estacionamientos y 2 bodegas. Remodelado.', publishedState: 'Publicado' },
    { title: 'Departamento Doña Isidora', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 5690, builtArea: 140, beds: 4, baths: 4, parking: 2, city: 'Talca', sector: 'Doña Isidora', description: '140 m² construidos + 30 m² de terraza, 4 dormitorios, 4 baños, 2 estacionamientos y 1 bodega.', publishedState: 'Publicado' },

    // PAGE 6
    { title: 'Estacionamientos Ed. Amalfi y Ed. Aire Urbano', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 310, city: 'Talca', sector: 'Centro', description: 'Estacionamientos disponibles según informe base.', publishedState: 'Publicado' },
    { title: 'Departamento Condominio El Libertador (66m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 2000, builtArea: 66, beds: 3, baths: 2, city: 'Talca', sector: 'El Libertador', description: '3 dormitorios + 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento Condominio El Libertador (44m2)', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1400, builtArea: 44, beds: 2, baths: 1, city: 'Talca', sector: 'El Libertador', description: '2 dormitorios + 1 baño.', publishedState: 'Publicado' },
    { title: 'Departamento Marbella', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 2690, builtArea: 61, beds: 2, baths: 2, city: 'Talca', sector: 'Marbella', description: '61 m², 2 dormitorios + 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento Costa Azul', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 1800, builtArea: 45, beds: 2, baths: 2, city: 'Talca', sector: 'Costa Azul', description: '45 m², 2 dormitorios + 2 baños.', publishedState: 'Publicado' },
    { title: 'Departamento Los Dominicos', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 5690, builtArea: 109, beds: 3, baths: 2, city: 'Talca', sector: 'Los Dominicos', description: '109 m², 3 dormitorios + 2 baños.', publishedState: 'Publicado' },

    // PAGE 7 (Santiago)
    { title: 'Departamento Lyon', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 8500, builtArea: 110, beds: 3, parking: 1, city: 'Santiago', sector: 'Providencia', description: 'Departamento de 110 m², 3 dormitorios. Incluye bodega y estacionamiento. Edificio con salón de eventos, gimnasio y jardines.', publishedState: 'Publicado' },
    { title: 'Departamento Av. Vespucio Oriente', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 9600, builtArea: 113, beds: 3, baths: 2, parking: 2, city: 'Santiago', sector: 'La Reina', description: 'Departamento de 113 m² totales, incluyendo 9 m² de terraza en dormitorios. 3 dormitorios, 2 baños, sala de estar, recibidor, 2 estacionamientos y 1 bodega.', publishedState: 'Publicado' },
    { title: 'Departamento El Golf', propertyType: 'Departamento', operation: 'Venta', currency: 'UF', price: 15000, builtArea: 246, beds: 4, baths: 4, parking: 2, city: 'Santiago', sector: 'Las Condes', description: 'Departamento de 210 m² + 36 m² de terraza, 4 dormitorios, 4 baños y 2 estacionamientos.', publishedState: 'Publicado' },

    // PAGE 8 (Loteos)
    { title: 'Parcela Loteo Alto del Llano (Lote 4)', propertyType: 'Parcela', operation: 'Venta', currency: 'CLP', price: 55000000, landArea: 5000, city: 'San Clemente', sector: 'Camino a San Clemente', description: 'Camino a San Clemente. Lotes de 5.000 m², tipo condominio, solo 13 sitios, agua potable, canalización subterránea de electricidad y portón automático con vigilancia vía cámaras de seguridad.', publishedState: 'Publicado' },
    { title: 'Parcela Loteo Alto del Llano (Lote 8)', propertyType: 'Parcela', operation: 'Venta', currency: 'CLP', price: 60000000, landArea: 5000, city: 'San Clemente', sector: 'Camino a San Clemente', description: 'Camino a San Clemente. Lotes de 5.000 m², tipo condominio, solo 13 sitios, agua potable, canalización subterránea de electricidad y portón automático con vigilancia vía cámaras de seguridad.', publishedState: 'Publicado' },

    // PAGE 9 (Arriendos Comerciales)
    { title: 'Oficinas Galería Manquehue', propertyType: 'Oficina', operation: 'Arriendo', currency: 'CLP', price: 360000, city: 'Talca', sector: 'Centro', description: 'Varias oficinas disponibles: OF.2 $750.000 (95 m²), OF.3 $450.000 (52 m²), OF.5 $360.000 (38 m²), OF.6 $380.000 (41 m²), OF.8 $370.000 (41 m²). Bodegas: BO.1 $420.000 (105 m²), BO.2 $420.000 (103 m²).', publishedState: 'Publicado' },
    { title: 'Local 4 Doña Adriana', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 30, builtArea: 51, baths: 1, city: 'Talca', sector: 'Centro', description: '51 m² + 1 baño + 1 bodega. Ubicado en calle 2 Sur, primer piso.', publishedState: 'Publicado' },
    { title: 'Local 104 Ed. Manuel Solar', propertyType: 'Comercial', operation: 'Arriendo', currency: 'CLP', price: 350000, builtArea: 20, baths: 1, city: 'Talca', sector: 'Centro', description: '20 m² + 1 baño + bodega. Calle 6 Oriente entre 2 y 3 Sur, con salida directa a 6 Oriente.', publishedState: 'Publicado' },
    { title: 'Local Ex Habitat (1 Sur)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 190, builtArea: 500, city: 'Talca', sector: 'Centro', description: 'Primer piso 350 m², segundo piso 150 m². Ideal para oficinas. 1 Sur entre 1 y 2 Oriente.', publishedState: 'Publicado' },
    { title: 'Local Las Brisas (Esquina premium)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 140, city: 'Talca', sector: 'Centro', description: 'Ubicación premium, esquina 5 Oriente con 1 Norte. Expandible a 140 m².', publishedState: 'Publicado' },
    { title: 'Locales Las Brisas (Segundo piso)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 12, builtArea: 36, city: 'Talca', sector: 'Centro', description: 'Locales disponibles de 36 m², segundo piso por calle 1 Norte.', publishedState: 'Publicado' },
    { title: 'Locales Autoplanet (Sector automotriz)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 160, builtArea: 380, city: 'Talca', sector: 'Centro', description: 'Dos locales (4 y 5) que suman 380 m². Se arriendan juntos.', publishedState: 'Publicado' },

    // PAGE 10 (Otros activos comerciales)
    { title: 'Local Ex Hiper 1 (Calle 18 Oriente)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 220, builtArea: 700, parking: 12, city: 'Talca', sector: '18 Oriente', description: '700 m² distribuidos en 2 pisos. Opción de venta. 12 estacionamientos disponibles.', publishedState: 'Publicado' },
    { title: 'Local Mayorista HU (Calle 18 Oriente)', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 80, builtArea: 414, landArea: 1157, city: 'Talca', sector: '18 Oriente', description: '158 m² interiores + 256 m² de galpón, 1.157 m² de terreno total.', publishedState: 'Publicado' },
    { title: 'Local Portal Maule', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 210, builtArea: 700, parking: 12, city: 'Talca', sector: 'Portal Maule', description: '700 m² distribuidos en 2 pisos (0,3 UF/m²). Opción de venta. 12 estacionamientos disponibles.', publishedState: 'Publicado' },
    { title: 'Planta Libre Edificio Doña Adriana', propertyType: 'Oficina', operation: 'Arriendo', currency: 'UF', price: 35, builtArea: 234, baths: 2, city: 'Talca', sector: 'Centro', description: 'Planta libre de 234 m², 2 baños, segundo piso con acceso por calle 2 Sur esquina 6 Oriente. 20% de descuento los 6 primeros meses.', publishedState: 'Publicado' },
    { title: 'Casa Comercial Tejas Verdes', propertyType: 'Comercial', operation: 'Arriendo', currency: 'UF', price: 65, builtArea: 405, landArea: 2290, beds: 5, city: 'Talca', sector: 'Tejas Verdes', description: 'Casa de 405 m² en terreno de 2.290 m², con 5 dormitorios más servicio, amplios espacios, dos norias, portón automático, jardines y caldera a pellet. Ideal uso comercial.', publishedState: 'Publicado' },
    { title: 'Terreno Comercial 9 Oriente 1 Norte', propertyType: 'Terreno', operation: 'Arriendo', currency: 'UF', price: 30, builtArea: 185, city: 'Talca', sector: 'Centro', description: '185 m² totales. Ideal para foodtruck o negocio de paso. Terreno parejo, cierre perimetral con reja, esquina de alto flujo peatonal y vehicular.', publishedState: 'Publicado' },

    // PAGE 11 (Terrenos)
    { title: 'Lote 1 Uso urbano', propertyType: 'Terreno', operation: 'Venta', currency: 'UF', price: 52000, landArea: 65000, city: 'Talca', sector: 'Urbano', description: '65.000 m². Valor: 0,80 UF/m².', publishedState: 'Publicado' },
    { title: 'Lote 2 Uso rural', propertyType: 'Terreno', operation: 'Venta', currency: 'UF', price: 38400, landArea: 128000, city: 'Maule', sector: 'Rural', description: '128.000 m². Valor: 0,30 UF/m².', publishedState: 'Publicado' },
    { title: 'Terrenos Ruta 5 Sur (Lotes A3B / A4)', propertyType: 'Terreno', operation: 'Venta', currency: 'UF', price: 47981, landArea: 95962, city: 'Maule', sector: 'Ruta 5 Sur', description: 'Terreno carretera Ruta 5 Sur, altura Copec Maule. Lote A3B: 32.370 m² / Lote A4: 63.592 m². Valor: 0,5 UF/m². (Precio estimado total).', publishedState: 'Publicado' },
    { title: 'Terreno Quinta Junge', propertyType: 'Terreno', operation: 'Venta', currency: 'UF', price: 33551, landArea: 4793, city: 'Concepción', sector: 'Quinta Junge', description: 'Antes: 10 UF/m². Ahora 7 UF/m². Terreno para edificación en altura, 4.793 m².', publishedState: 'Publicado' },
    { title: 'Terreno 9 Oriente', propertyType: 'Terreno', operation: 'Venta', currency: 'UF', price: 6600, landArea: 185, city: 'Talca', sector: 'Centro', description: '185 m² totales. Se vende con proyecto de arquitectura, alcantarillado y eléctrico de 5 locales comerciales.', publishedState: 'Publicado' },

    // PAGE 12 (Agrícolas)
    { title: 'Predio Agrícola Melozal (350 ha)', propertyType: 'Agricola', operation: 'Venta', currency: 'CLP', price: 3850000000, landArea: 3500000, city: 'Melozal', sector: 'Melozal', description: '350 hectáreas. $11 MM/ha. Apto para olivo y avellano europeo. Agua: 200 acciones inscritas (250 ha con riego). Suelo III y IV riego, plano. Energía eléctrica, orilla de camino, sin plantaciones.', publishedState: 'Publicado' },
    { title: 'Predio Agrícola San Rafael (102 ha)', propertyType: 'Agricola', operation: 'Venta', currency: 'CLP', price: 224400000, landArea: 1020000, city: 'San Rafael', sector: 'San Rafael', description: '102 hectáreas. $2,2 MM/ha. Predio incorporado en el informe base.', publishedState: 'Publicado' },
    { title: 'Predio Forestal Botalcura (300 ha)', propertyType: 'Agricola', operation: 'Venta', currency: 'CLP', price: 660000000, landArea: 3000000, city: 'Botalcura', sector: 'Botalcura', description: '300 hectáreas. $2,2 MM/ha. Apto forestal. Sin agua. Suelo V y VI secano, con ladera y cerro. Orilla de camino y caminos interiores.', publishedState: 'Publicado' },
    { title: 'Predio Agrícola San Javier (300 ha)', propertyType: 'Agricola', operation: 'Venta', currency: 'CLP', price: 2250000000, landArea: 3000000, city: 'San Javier', sector: 'San Javier', description: '300 hectáreas. $7,5 MM/ha. Actualmente con viña, olivo y pinos. Agua: 100 acciones río Maule, con riego tecnificado. Suelo III de riego y VI en sector con pinos de 12 años. Buenos accesos.', publishedState: 'Publicado' },

    // PAGE 13 (Inmuebles con Renta)
    { title: 'Local Comercial (Con Renta)', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 29100, builtArea: 114, city: 'Talca', sector: 'Avenida Principal', description: 'Renta: $1.100.000. Superficie: 114 m² construidos. Remodelada para local comercial, en avenida principal.', publishedState: 'Publicado' },
    { title: 'Local 2 Sur 6 Oriente (Con Renta)', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 5100, builtArea: 70, baths: 1, city: 'Talca', sector: 'Centro', description: 'Renta: $900.000 - $1.100.000. Local de 70 m², 1 baño, primer piso, acceso por calle 2 Sur.', publishedState: 'Publicado' },
    { title: 'Edificio + Terreno Talca (Con Renta)', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 20500, builtArea: 610, landArea: 1014, city: 'Talca', sector: 'Centro', description: 'Renta: $4.900.000. Terreno: 1.014 m². Construcción: 610 m² en dos pisos.', publishedState: 'Publicado' },
    { title: '1 Norte 9 Oriente (Con Renta)', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 25000, builtArea: 512, landArea: 419, city: 'Talca', sector: 'Centro', description: 'Renta: $6.100.000. Terreno: 419,49 m². Construcción: 512,68 m². Esquina con alta plusvalía, ubicada en avenida totalmente comercial.', publishedState: 'Publicado' },
    { title: 'Piso Edificio Médico Talca (Con Renta)', propertyType: 'Comercial', operation: 'Venta', currency: 'UF', price: 5000, builtArea: 479, city: 'Talca', sector: 'Centro', description: 'Renta: $6.900.000. Superficie: 479 m². Actualmente arrendado a empresa médica, con factibilidad de uso para 18 consultas independientes con baño y sala de espera.', publishedState: 'Publicado' },
  ]

  console.log(`Se insertarán ${properties.length} propiedades...`)
  
  let successCount = 0;
  for (const p of properties) {
    try {
      await prisma.property.create({ data: p })
      successCount++;
    } catch (e) {
      console.error(`Error al insertar propiedad: ${p.title}`, e)
    }
  }

  console.log(`✅ ¡Se han insertado exitosamente ${successCount} propiedades!`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
