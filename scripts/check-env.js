// scripts/check-env.js
// Script para verificar que las variables de entorno estén configuradas correctamente

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de variables de entorno...\n');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.local.example');

// Verificar si existe .env.local
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: No se encontró el archivo .env.local\n');
  console.log('📝 Solución:');
  console.log('   1. Copia el archivo de ejemplo:');
  console.log('      cp .env.local.example .env.local\n');
  console.log('   2. Edita .env.local con tus credenciales reales de Supabase\n');
  console.log('📖 Lee CONFIGURACION_ENV.md para más detalles\n');
  process.exit(1);
}

console.log('✅ Archivo .env.local encontrado\n');

// Leer y parsear .env.local
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key] = valueParts.join('=');
  }
});

// Variables requeridas
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL'
];

let hasErrors = false;

// Validar cada variable
requiredVars.forEach(varName => {
  const value = envVars[varName];
  
  if (!value) {
    console.error(`❌ ${varName}: No configurada`);
    hasErrors = true;
    return;
  }

  // Detectar placeholders comunes
  const placeholders = [
    'your_',
    'here',
    '[TU-',
    '[password]',
    'xxxxxxxxxxxx'
  ];

  const hasPlaceholder = placeholders.some(p => value.includes(p));
  
  if (hasPlaceholder) {
    console.error(`❌ ${varName}: Contiene valores de ejemplo`);
    console.log(`   Valor actual: ${value.substring(0, 50)}...`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configurada`);
  }
});

console.log('');

if (hasErrors) {
  console.error('⚠️  ERRORES ENCONTRADOS\n');
  console.log('📝 Para corregir:');
  console.log('   1. Ve a https://supabase.com/dashboard');
  console.log('   2. Selecciona tu proyecto Mhorp');
  console.log('   3. Ve a Settings → API para URL y Anon Key');
  console.log('   4. Ve a Settings → Database para DATABASE_URL');
  console.log('   5. Copia los valores REALES a tu .env.local\n');
  console.log('📖 Guía completa: CONFIGURACION_ENV.md\n');
  process.exit(1);
} else {
  console.log('🎉 ¡Configuración correcta!\n');
  console.log('✅ Puedes ejecutar:');
  console.log('   pnpm run drizzle:push  # Para crear tablas');
  console.log('   pnpm run db:seed       # Para poblar con datos');
  console.log('   pnpm run dev           # Para iniciar servidor\n');
}
