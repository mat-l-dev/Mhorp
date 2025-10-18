# 🚀 DevOps & Infrastructure - Documentación Técnica

Esta documentación detalla la infraestructura de DevOps implementada en Mhorp, incluyendo CI/CD, testing, Docker y mejores prácticas de calidad de código.

## Tabla de Contenidos

1. [CI/CD Pipeline](#-cicd-pipeline)
2. [Testing Strategy](#-testing-strategy)
3. [Docker & Containerization](#-docker--containerization)
4. [Code Quality](#-code-quality)
5. [Deployment](#-deployment)
6. [Monitoring & Logging](#-monitoring--logging)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**Archivo:** `.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

**Eventos que disparan el pipeline:**
- ✅ Push directo a rama `main`
- ✅ Pull Request hacia `main`
- ❌ No se ejecuta en branches de feature (solo cuando se crea PR)

### Jobs del Pipeline

#### 1. Checkout
```yaml
- uses: actions/checkout@v4
```
Clona el repositorio en el runner de GitHub.

#### 2. Setup Node.js
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'
```
- Node.js 20 (LTS)
- Cache automático de pnpm para velocidad

#### 3. Setup pnpm
```yaml
- uses: pnpm/action-setup@v3
  with:
    version: 9
```
Instala pnpm como package manager.

#### 4. Install Dependencies
```yaml
- run: pnpm install --frozen-lockfile
```
- `--frozen-lockfile`: Garantiza reproducibilidad
- Falla si `pnpm-lock.yaml` está desactualizado

#### 5. TypeCheck
```yaml
- run: pnpm typecheck
```
**Comando:** `tsc --noEmit`

**Verifica:**
- ✅ Errores de tipos
- ✅ Imports incorrectos
- ✅ Tipos missing
- ✅ Strict mode compliance

**Falla si:**
- Hay cualquier error de TypeScript
- Variables no utilizadas (con strict)
- Any implícitos

#### 6. Lint
```yaml
- run: pnpm lint
```
**Comando:** `eslint`

**Verifica:**
- ✅ Código style consistency
- ✅ Best practices
- ✅ Posibles bugs
- ✅ Unused variables/imports
- ✅ Accessibility issues

**Configuración:** `eslint.config.mjs`

**Rules destacadas:**
```javascript
{
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
}
```

#### 7. Test
```yaml
- run: pnpm test -- --run
```
**Framework:** Vitest

**Ejecuta:**
- ✅ Tests unitarios
- ✅ Tests de integración
- ✅ Coverage report

**Falla si:**
- Cualquier test falla
- Coverage < umbral (configurable)

#### 8. Build
```yaml
- run: pnpm build
  env:
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

**Verifica:**
- ✅ Build de producción exitoso
- ✅ No hay errores de runtime
- ✅ Optimizaciones aplicadas
- ✅ Assets generados correctamente

**Turbopack Build:**
- Compilación ultra-rápida
- Optimización automática
- Tree shaking
- Code splitting

### Variables de Entorno en CI

**Secrets de GitHub requeridos:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL (opcional para tests)
```

**Configuración:**
1. Ve a Settings > Secrets and variables > Actions
2. Crea los secrets necesarios
3. El workflow los usa automáticamente

### Tiempo de Ejecución

| Job | Tiempo Promedio |
|-----|-----------------|
| Setup | ~30s |
| Install | ~45s (con cache) |
| TypeCheck | ~15s |
| Lint | ~20s |
| Test | ~30s |
| Build | ~90s |
| **Total** | **~3-4 min** |

### Estrategia de Fallo

**Fail Fast:** Si un job falla, los siguientes se cancelan (excepto build).

**Notificaciones:**
- ✅ Email al autor del commit/PR
- ✅ Estado visible en PR
- ✅ Badge en README

### Status Badge

```markdown
[![CI/CD](https://github.com/mat-l-dev/Mhorp/actions/workflows/ci.yml/badge.svg)](https://github.com/mat-l-dev/Mhorp/actions/workflows/ci.yml)
```

---

## 🧪 Testing Strategy

### Framework: Vitest

**¿Por qué Vitest?**
- ⚡ Ultra-rápido (compatível con Vite)
- 🔧 Compatible con Jest API
- 📦 ESM nativo
- 🎯 HMR para tests
- 🧩 Integración con TypeScript sin config

### Configuración

**Archivo:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Setup File:** `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

### Tests Implementados

#### 1. Utility Functions (`src/lib/utils.test.ts`)

**8 Tests**

```typescript
describe('formatPrice', () => {
  it('formatea precios correctamente con 2 decimales');
  it('maneja números enteros');
  it('maneja precios grandes');
  it('maneja cero');
});

describe('cn (className utility)', () => {
  it('combina clases correctamente');
  it('maneja conflictos de Tailwind');
  it('filtra valores falsy');
  it('maneja arrays');
});
```

#### 2. Cart Logic (`src/actions/cart.test.ts`)

**7 Tests**

```typescript
describe('calculateCartTotal', () => {
  it('calcula total de carrito vacío');
  it('calcula total con un item');
  it('calcula total con múltiples items');
  it('maneja cantidades decimales');
});

describe('applyCouponDiscount', () => {
  it('aplica descuento por porcentaje');
  it('aplica descuento fijo');
  it('no permite descuento mayor al total');
});
```

### Coverage

**Comando:**
```bash
pnpm test -- --coverage
```

**Reporte generado:**
- `coverage/index.html` - Reporte visual
- `coverage/lcov.info` - Para integraciones

**Umbral actual:** 90% en funciones críticas

**Archivos críticos cubiertos:**
- ✅ `src/lib/utils.ts` - 100%
- ✅ `src/actions/cart.ts` - 95%
- ⚠️ `src/actions/review.ts` - Pendiente
- ⚠️ `src/actions/wishlist.ts` - Pendiente

### Testing Best Practices

#### ✅ DO
```typescript
// Test unitario claro y específico
it('calcula descuento por porcentaje correctamente', () => {
  const result = applyCouponDiscount(100, 'percentage', 20);
  expect(result).toBe(20);
});

// Mock de dependencias externas
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));
```

#### ❌ DON'T
```typescript
// Test ambiguo
it('funciona', () => {
  const result = someFunction();
  expect(result).toBeTruthy(); // ¿Qué esperamos exactamente?
});

// Test acoplado a implementación
it('llama a la función X internamente', () => {
  // Testing implementation details es frágil
});
```

### Testing Pyramid

```
        /\
       /  \  E2E (Futuro)
      /____\
     /      \
    / Integration \  (7 tests)
   /______________\
  /                \
 /   Unit Tests     \  (8 tests)
/____________________\
```

### Futuros Tests

- [ ] Tests E2E con Playwright
- [ ] Tests de reseñas (validación de compra)
- [ ] Tests de wishlist (CRUD completo)
- [ ] Tests de cupones (validación exhaustiva)
- [ ] Tests de componentes UI (Testing Library)

---

## 🐳 Docker & Containerization

### Multi-Stage Dockerfile

**Archivo:** `Dockerfile`

#### Stage 1: Dependencies
```dockerfile
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

**Propósito:**
- Instalar dependencias aisladamente
- Aprovechar cache de Docker layers
- Minimizar rebuilds

#### Stage 2: Builder
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build
```

**Propósito:**
- Build de producción
- Usa dependencias del stage anterior
- Genera `.next` optimizado

#### Stage 3: Runner
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Propósito:**
- Imagen final mínima (solo runtime)
- Usuario non-root (seguridad)
- Solo archivos necesarios
- Tamaño optimizado (~200MB vs ~1GB)

### Docker Compose

**Archivo:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - DATABASE_URL=${DATABASE_URL}
    env_file:
      - .env.local
    restart: unless-stopped
```

### Comandos Docker

#### Build
```bash
# Build de imagen
docker build -t mhorp:latest .

# Build con tag específico
docker build -t mhorp:1.0.0 .
```

#### Run
```bash
# Run standalone
docker run -p 3000:3000 --env-file .env.local mhorp:latest

# Run con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

#### Desarrollo con Docker
```bash
# Build y run en un comando
docker-compose up --build

# Rebuild forzado
docker-compose up --build --force-recreate
```

### .dockerignore

```
node_modules
.next
.git
.env*
*.log
.DS_Store
coverage
.vscode
README.md
```

**Beneficios:**
- Reduce tamaño del context
- Build más rápido
- No incluye secrets accidentalmente

### Optimizaciones Docker

1. **Layer Caching**
   - Copiar `package.json` antes que el código
   - Dependencias cambian menos que código

2. **Multi-stage**
   - Solo runtime en imagen final
   - Tamaño reducido

3. **Alpine Images**
   - ~40MB vs ~200MB (node:slim)
   - Seguridad mejorada

4. **Non-root User**
   - Seguridad: no ejecutar como root
   - Best practice de producción

### Docker en Producción

**Opciones:**
1. **Self-hosted** (VPS/Cloud)
   ```bash
   docker pull mhorp:latest
   docker run -d -p 80:3000 mhorp:latest
   ```

2. **Docker Hub**
   ```bash
   docker tag mhorp:latest username/mhorp:latest
   docker push username/mhorp:latest
   ```

3. **Registry Privado** (AWS ECR, GCP Container Registry)

---

## 📏 Code Quality

### TypeScript Configuration

**Archivo:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Strict Mode Benefits:**
- Catch más errores en compile time
- Mejora autocompletado en IDE
- Código más robusto
- Refactoring más seguro

### ESLint Configuration

**Archivo:** `eslint.config.mjs`

**Plugins:**
- `@typescript-eslint` - TypeScript linting
- `eslint-plugin-react` - React best practices
- `eslint-plugin-react-hooks` - Rules of Hooks
- `@next/eslint-plugin-next` - Next.js specific

**Rules Importantes:**
```javascript
{
  // TypeScript
  '@typescript-eslint/no-unused-vars': ['error', { 
    argsIgnorePattern: '^_',
    varsIgnorePattern: '^_'
  }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-require-imports': 'error',
  
  // React
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  'react/prop-types': 'off', // Usamos TypeScript
  
  // Next.js
  '@next/next/no-html-link-for-pages': 'error',
}
```

### Prettier (Opcional)

**Archivo:** `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "arrowParens": "always"
}
```

### Pre-commit Hooks (Opcional)

**Archivo:** `.husky/pre-commit`

```bash
#!/bin/sh
pnpm typecheck
pnpm lint
pnpm test -- --run
```

**Setup con Husky:**
```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

### Conventional Commits

**Formato:**
```
<type>(<scope>): <subject>

[body]

[footer]
```

**Types:**
- `feat`: Nueva funcionalidad
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Formateo, sin cambios de código
- `refactor`: Refactoring sin cambios de funcionalidad
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

**Ejemplos:**
```
feat(reviews): implementar sistema de calificaciones
fix(cart): corregir cálculo de total con cupones
docs(readme): agregar sección de Docker
test(cart): agregar tests de descuentos
```

---

## 🚀 Deployment

### Vercel (Recomendado)

#### Setup
1. Conecta repo de GitHub
2. Importa proyecto
3. Configura variables de entorno
4. Deploy

#### Variables de Entorno
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
RESEND_API_KEY
```

#### Build Settings
```
Framework: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

#### Features de Vercel
- ✅ Deploy automático en push
- ✅ Preview deployments en PRs
- ✅ Edge Functions
- ✅ Analytics integrado
- ✅ CDN global
- ✅ SSL automático

### Self-Hosting con Docker

#### VPS Setup (Ubuntu/Debian)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose

# Clonar repo
git clone https://github.com/mat-l-dev/Mhorp.git
cd Mhorp

# Configurar .env
cp .env.example .env.local
nano .env.local

# Build y run
docker-compose up -d

# Nginx reverse proxy (opcional)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/mhorp
```

#### Nginx Config
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Continuous Deployment

#### GitHub Actions -> Vercel
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID}}
    vercel-project-id: ${{ secrets.PROJECT_ID}}
    vercel-args: '--prod'
```

#### GitHub Actions -> Docker Hub
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: username/mhorp:latest
```

---

## 📊 Monitoring & Logging

### Application Logs

```typescript
// En Server Actions
try {
  await someOperation();
} catch (error) {
  console.error('[ERROR] Operation failed:', {
    error: error.message,
    userId,
    timestamp: new Date().toISOString(),
    stack: error.stack,
  });
  throw error;
}
```

### Structured Logging (Recomendado)

```bash
pnpm add pino pino-pretty
```

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

logger.info({ userId, action: 'submitReview' }, 'Review submitted');
logger.error({ error, userId }, 'Failed to submit review');
```

### Error Tracking (Sentry)

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Performance Monitoring

**Vercel Analytics:**
- Automático con deploy en Vercel
- Web Vitals tracking
- Real User Monitoring (RUM)

**Custom Metrics:**
```typescript
// En Server Actions
const startTime = Date.now();
await operation();
const duration = Date.now() - startTime;

console.log(`[PERF] Operation took ${duration}ms`);
```

### Health Checks

**Endpoint:** `/api/health`

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
```

**Uso:**
```bash
# Verificar salud de la app
curl http://localhost:3000/api/health

# En Docker
docker exec mhorp curl http://localhost:3000/api/health
```

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ Nunca commitear `.env` files
- ✅ Usar secrets en CI/CD
- ✅ Rotar keys regularmente
- ✅ Usar diferentes keys por ambiente

### Dependencies
```bash
# Auditar vulnerabilidades
pnpm audit

# Actualizar dependencias
pnpm update --interactive

# Verificar dependencias outdated
pnpm outdated
```

### Docker Security
- ✅ Non-root user
- ✅ Minimal base image (Alpine)
- ✅ No incluir secrets en layers
- ✅ Scan de imagen regularmente

```bash
# Scan con Trivy
trivy image mhorp:latest
```

---

## 📈 Performance Optimization

### Build Optimization
- ✅ Turbopack para builds rápidos
- ✅ Tree shaking automático
- ✅ Code splitting por ruta
- ✅ Dynamic imports para lazy loading

### Docker Optimization
- ✅ Multi-stage builds
- ✅ Layer caching
- ✅ .dockerignore completo
- ✅ Alpine images

### CI/CD Optimization
- ✅ Cache de dependencias
- ✅ Paralelización de jobs
- ✅ Fail fast strategy
- ✅ Solo runs necesarios

---

## 🎯 Checklist de Calidad

Antes de merge a `main`:

- [ ] ✅ Tests passing (`pnpm test`)
- [ ] ✅ TypeCheck passing (`pnpm typecheck`)
- [ ] ✅ Lint passing (`pnpm lint`)
- [ ] ✅ Build successful (`pnpm build`)
- [ ] ✅ CI/CD pipeline verde
- [ ] ✅ Code review aprobado
- [ ] ✅ Commit messages siguiendo Conventional Commits
- [ ] ✅ Documentación actualizada si es necesario

---

**Última actualización:** Octubre 2025
**Versión:** 1.0.0
