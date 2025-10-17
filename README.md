# Mhorp - E-commerce Platform

Plataforma de e-commerce construida con Next.js 15, TypeScript, Tailwind CSS, Drizzle ORM y Supabase.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Autenticación**: Supabase Auth
- **Estado**: Zustand (con persistencia en localStorage)
- **UI Components**: shadcn/ui
- **Notificaciones**: Sonner

## 📋 Prerrequisitos

- Node.js 18+ 
- pnpm (recomendado) o npm
- Cuenta en [Supabase](https://supabase.com)

## ⚙️ Configuración Inicial

### 1. Clonar e Instalar Dependencias

```bash
git clone https://github.com/mat-l-dev/Mhorp.git
cd Mhorp
pnpm install
```

### 2. Configurar Variables de Entorno

**📖 [Ver guía completa de configuración](./CONFIGURACION_ENV.md)**

```bash
# Copiar archivo de ejemplo
cp .env.local.example .env.local

# Editar .env.local con tus credenciales de Supabase
```

Necesitas configurar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

### 3. Configurar Base de Datos

```bash
# Ejecutar migraciones de Drizzle
pnpm run drizzle:push

# Poblar con datos de ejemplo
pnpm run db:seed
```

### 4. Iniciar Servidor de Desarrollo

```bash
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
src/
├── actions/          # Server Actions (auth, cart, order)
├── app/             # App Router de Next.js
│   ├── (auth)/      # Rutas de autenticación
│   ├── (store)/     # Rutas de la tienda
│   └── api/         # API Routes
├── components/      # Componentes React
│   ├── shared/      # Componentes compartidos
│   └── ui/          # Componentes de shadcn/ui
└── lib/             # Utilidades y configuración
    ├── db/          # Drizzle ORM (schema, cliente)
    ├── store/       # Zustand stores
    └── supabase/    # Cliente de Supabase
```

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios con email
- Login/Logout
- Confirmación por email
- Rutas protegidas

### ✅ Carrito de Compras
- Agregar/eliminar productos
- UI optimista (actualización instantánea)
- Persistencia en localStorage
- Sincronización con base de datos
- Contador en tiempo real

### ✅ Checkout y Pedidos
- Formulario de dirección de envío
- Creación transaccional de pedidos
- Máquina de estados (awaiting_payment, etc.)
- Página de confirmación con instrucciones de pago

### ✅ Productos
- Listado de productos
- Imágenes optimizadas con Next.js Image
- Precios y stock
- Botón "Agregar al carrito"

## 📚 Documentación Adicional

- [Configuración de Variables de Entorno](./CONFIGURACION_ENV.md)
- [Sistema de Carrito](./CART_SYSTEM.md)
- [Configuración de Base de Datos](./SETUP_DATABASE.md)

## 🛠️ Scripts Disponibles

```bash
pnpm run dev          # Iniciar servidor de desarrollo
pnpm run build        # Construir para producción
pnpm run start        # Iniciar servidor de producción
pnpm run lint         # Ejecutar ESLint
pnpm run drizzle:push # Sincronizar schema con base de datos
pnpm run db:seed      # Poblar base de datos con datos de ejemplo
pnpm run drizzle:studio # Abrir Drizzle Studio (GUI para DB)
```

## 🔐 Seguridad

- Variables de entorno en `.env.local` (no se suben a GitHub)
- Autenticación manejada por Supabase
- Server Actions para operaciones críticas
- Validación en servidor y cliente

## 🚧 En Desarrollo

- [ ] Subida de comprobantes de pago
- [ ] Panel de administración
- [ ] Historial de pedidos del usuario
- [ ] Sistema de roles (admin/usuario)
- [ ] Pasarela de pagos integrada

## 📝 Licencia

Este proyecto es privado y está en desarrollo.

## 👨‍💻 Autor

Mathew - [@mat-l-dev](https://github.com/mat-l-dev)
