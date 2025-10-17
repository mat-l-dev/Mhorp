// scripts/seed.ts
// Propósito: Poblar la base de datos con datos de muestra.

import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import 'dotenv/config';

async function main() {
  console.log('🌱 Empezando el sembrado de la base de datos...');

  const sampleProducts = [
    {
      name: 'Kit Starlink Residencial',
      description: 'Internet de alta velocidad para zonas rurales. Incluye antena, router y cableado.',
      price: '599.99',
      images: ['/placeholders/starlink-kit.png'],
    },
    {
      name: 'Kit 4 Cámaras de Seguridad Hikvision',
      description: 'Vigilancia 24/7 con 4 cámaras Full HD, DVR y disco duro de 1TB.',
      price: '349.50',
      images: ['/placeholders/hikvision-kit.png'],
    },
    {
        name: 'Panel Solar para Kit Starlink',
        description: 'Autonomía energética para tu conexión a internet. Panel de 150W y batería de ciclo profundo.',
        price: '450.00',
        images: ['/placeholders/solar-panel.png'],
    }
  ];

  console.log('Insertando productos de muestra...');
  await db.insert(products).values(sampleProducts);

  console.log('✅ Sembrado completado exitosamente!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error durante el sembrado:', err);
  process.exit(1);
});
