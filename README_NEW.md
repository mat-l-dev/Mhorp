# 🛍️ Mhorp - Modern E-commerce Platform

[![CI/CD](https://github.com/mat-l-dev/Mhorp/actions/workflows/ci.yml/badge.svg)](https://github.com/mat-l-dev/Mhorp/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Plataforma moderna de e-commerce construida con las últimas tecnologías web, diseñada para ofrecer una experiencia de compra excepcional con funcionalidades avanzadas de engagement y marketing.

## ✨ Características Principales

### 🛒 Core E-commerce
- ✅ Catálogo de productos con categorías
- ✅ Carrito de compras persistente
- ✅ Sistema de órdenes con estados
- ✅ Gestión de inventario
- ✅ Búsqueda de productos

### 👥 Gestión de Usuarios
- ✅ Autenticación con Supabase Auth
- ✅ Perfiles de usuario
- ✅ Roles (cliente/admin)
- ✅ Historial de órdenes

### 💝 Engagement & Marketing
- ✅ **Sistema de Reseñas**: Calificaciones y comentarios de productos
- ✅ **Lista de Deseos**: Guardar productos favoritos
- ✅ **Cupones de Descuento**: Sistema completo de promociones
- ✅ **Notificaciones por Email**: Emails transaccionales con Resend

### 🎨 UI/UX
- ✅ Diseño responsive y moderno
- ✅ Tema claro/oscuro
- ✅ Animaciones smooth
- ✅ Componentes reutilizables con shadcn/ui

### 👨‍💼 Panel de Administración
- ✅ Dashboard con métricas reales
- ✅ CRUD de productos y categorías
- ✅ Gestión de órdenes
- ✅ Administración de cupones
- ✅ Carga de imágenes a Supabase Storage

## 🏗️ Stack Tecnológico

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS 3](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Iconos**: [Lucide React](https://lucide.dev/)

### Backend & Database
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) (vía Supabase)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Autenticación**: [Supabase Auth](https://supabase.com/auth)
- **Storage**: [Supabase Storage](https://supabase.com/storage)

### Servicios Externos
- **Emails**: [Resend](https://resend.com/) + [React Email](https://react.email/)
- **Hosting**: Vercel (recomendado)

### DevOps & Testing
- **Testing**: [Vitest](https://vitest.dev/) + Testing Library
- **CI/CD**: GitHub Actions
- **Contenedorización**: Docker
- **Linting**: ESLint + TypeScript ESLint
- **Formateo**: Prettier

## 📦 Instalación y Configuración

### Requisitos Previos

- Node.js 20+
- pnpm 9+ (recomendado)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Resend](https://resend.com) (opcional)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/mat-l-dev/Mhorp.git
cd Mhorp
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa las variables en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="tu_url_de_supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu_anon_key"
DATABASE_URL="tu_database_url"

# Resend (Opcional - para emails)
RESEND_API_KEY="tu_resend_api_key"
```

### 4. Configurar la Base de Datos

Pushea el schema a tu base de datos de Supabase:

```bash
pnpm run drizzle:push
```

### 5. (Opcional) Poblar con Datos de Prueba

```bash
pnpm run db:seed
```

### 6. Iniciar el Servidor de Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🐳 Docker

### Build de la Imagen

```bash
docker build -t mhorp .
```

### Ejecutar con Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testing

Ejecutar tests:

```bash
pnpm test
```

Ejecutar tests en modo UI:

```bash
pnpm test --ui
```

Ejecutar tests con coverage:

```bash
pnpm test --coverage
```

## 🚀 Despliegue

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mat-l-dev/Mhorp)

1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno
3. Deploy

### Docker

```bash
docker build -t mhorp .
docker run -p 3000:3000 --env-file .env.local mhorp
```

## 📁 Estructura del Proyecto

```
mhorp/
├── .github/
│   ├── workflows/           # GitHub Actions CI/CD
│   ├── ISSUE_TEMPLATE/      # Templates de issues
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                  # Assets estáticos
├── src/
│   ├── actions/            # Server Actions
│   │   ├── cart.ts
│   │   ├── coupon.ts
│   │   ├── order.ts
│   │   ├── review.ts
│   │   └── wishlist.ts
│   ├── app/
│   │   ├── (admin)/        # Rutas de administración
│   │   ├── (store)/        # Rutas de la tienda
│   │   └── layout.tsx
│   ├── components/
│   │   ├── admin/          # Componentes de admin
│   │   ├── shared/         # Componentes compartidos
│   │   ├── ui/             # Componentes UI base
│   │   └── emails/         # Templates de email
│   ├── lib/
│   │   ├── db/             # Configuración de DB
│   │   │   ├── schema.ts   # Schema de Drizzle
│   │   │   └── index.ts
│   │   ├── supabase/       # Cliente de Supabase
│   │   └── utils.ts
│   ├── stores/             # Zustand stores
│   └── test/               # Setup de tests
├── Dockerfile
├── docker-compose.yml
├── vitest.config.ts
└── package.json
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia servidor de desarrollo
pnpm build            # Build de producción
pnpm start            # Inicia servidor de producción

# Calidad de Código
pnpm lint             # Ejecuta ESLint
pnpm typecheck        # Verifica tipos con TypeScript
pnpm test             # Ejecuta tests con Vitest

# Base de Datos
pnpm drizzle:push     # Push schema a DB
pnpm drizzle:studio   # UI visual de DB
pnpm db:seed          # Poblar con datos de prueba
```

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor lee [CONTRIBUTING.md](./CONTRIBUTING.md) para detalles sobre nuestro código de conducta y el proceso para enviar pull requests.

### Pasos Rápidos

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](./LICENSE) para más detalles.

## 👨‍💻 Autor

**mat-l-dev**
- GitHub: [@mat-l-dev](https://github.com/mat-l-dev)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)
- Todos los contribuidores que han ayudado a este proyecto

## 📊 Estado del Proyecto

- ✅ MVP Completado
- ✅ Funcionalidades de Engagement
- ✅ CI/CD Implementado
- ✅ Testing Configurado
- ✅ Dockerizado
- 🚧 En desarrollo activo

---

<p align="center">
  Hecho con ❤️ usando Next.js y TypeScript
</p>
