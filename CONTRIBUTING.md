# Contributing to Mhorp

¡Gracias por tu interés en contribuir a Mhorp! 🎉

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Guías de Estilo](#guías-de-estilo)
- [Proceso de Pull Request](#proceso-de-pull-request)

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código. Por favor reporta comportamiento inaceptable a los maintainers del proyecto.

## 🤝 ¿Cómo puedo contribuir?

### Reportando Bugs

Antes de crear un issue de bug:

- Verifica que no exista un issue similar ya reportado
- Recopila información sobre el bug:
  - Stack trace
  - Sistema operativo y versión
  - Versión de Node.js
  - Pasos para reproducir

Usa la plantilla de issue para bugs cuando crees uno nuevo.

### Sugiriendo Mejoras

Las sugerencias de mejoras son bienvenidas! Para ello:

1. Verifica que no exista una sugerencia similar
2. Proporciona una descripción clara y detallada
3. Explica por qué esta mejora sería útil

### Pull Requests

¡Los pull requests son siempre bienvenidos! Para grandes cambios:

1. Abre primero un issue para discutir los cambios
2. Espera feedback antes de invertir mucho tiempo

## 🛠️ Configuración del Entorno de Desarrollo

### Requisitos

- Node.js 20.x o superior
- pnpm 9.x o superior
- Una cuenta de Supabase (para base de datos)
- Una cuenta de Resend (para emails)

### Setup

1. **Fork y clona el repositorio**

```bash
git clone https://github.com/tu-usuario/Mhorp.git
cd Mhorp
```

2. **Instala las dependencias**

```bash
pnpm install
```

3. **Configura las variables de entorno**

Copia `.env.example` a `.env.local` y completa las variables:

```bash
cp .env.example .env.local
```

4. **Push del schema a la base de datos**

```bash
pnpm run drizzle:push
```

5. **Inicia el servidor de desarrollo**

```bash
pnpm dev
```

### Con Docker

```bash
docker-compose up -d
```

## 🔄 Proceso de Desarrollo

### Ramas

- `main`: Rama de producción, siempre debe estar estable
- `feature/*`: Para nuevas funcionalidades
- `fix/*`: Para correcciones de bugs
- `docs/*`: Para cambios en documentación

### Workflow

1. Crea una rama desde `main`:

```bash
git checkout -b feature/mi-nueva-funcionalidad
```

2. Haz tus cambios siguiendo las guías de estilo

3. Escribe o actualiza tests si es necesario

4. Ejecuta los checks localmente:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

5. Commit con mensajes descriptivos (seguimos Conventional Commits):

```bash
git commit -m "feat: agregar funcionalidad X"
git commit -m "fix: corregir bug en Y"
git commit -m "docs: actualizar README"
```

6. Push a tu fork:

```bash
git push origin feature/mi-nueva-funcionalidad
```

7. Abre un Pull Request

## 🎨 Guías de Estilo

### TypeScript

- Usa TypeScript para todo el código
- Define tipos explícitos cuando sea necesario
- Evita `any`, usa `unknown` cuando sea apropiado

### Código

- Usa 2 espacios para indentación
- Usa comillas simples para strings
- Agrega punto y coma al final de cada statement
- Usa camelCase para variables y funciones
- Usa PascalCase para componentes y clases

### Componentes React

- Un componente por archivo
- Componentes funcionales con hooks
- Usa TypeScript para props
- Documenta componentes complejos

```typescript
type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}
```

### Server Actions

- Siempre marca con `'use server'`
- Valida inputs con Zod
- Maneja errores apropiadamente
- Usa `revalidatePath` cuando sea necesario

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo, punto y coma faltante, etc.
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Actualizar dependencias, configuración, etc.

### Tests

- Escribe tests para lógica de negocio crítica
- Usa nombres descriptivos para los tests
- Sigue el patrón AAA (Arrange, Act, Assert)

```typescript
describe('calculateTotal', () => {
  it('should calculate total correctly for multiple items', () => {
    // Arrange
    const items = [/* ... */];
    
    // Act
    const total = calculateTotal(items);
    
    // Assert
    expect(total).toBe(100);
  });
});
```

## 🚀 Proceso de Pull Request

1. **Completa la plantilla de PR**

   La plantilla te guiará para proporcionar toda la información necesaria

2. **Asegúrate de que los checks pasen**

   - TypeScript: ✅
   - Linting: ✅
   - Tests: ✅
   - Build: ✅

3. **Solicita review**

   Un maintainer revisará tu PR. Puede haber feedback o solicitudes de cambios

4. **Responde al feedback**

   Haz los cambios solicitados y push nuevamente

5. **Merge**

   Una vez aprobado, un maintainer hará merge de tu PR

### Checklist antes de enviar PR

- [ ] Mi código sigue el estilo del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código en áreas complejas
- [ ] He actualizado la documentación si es necesario
- [ ] Mis cambios no generan nuevos warnings
- [ ] He agregado tests que prueban mi fix/funcionalidad
- [ ] Tests unitarios nuevos y existentes pasan localmente
- [ ] El build se completa exitosamente

## 📞 ¿Necesitas ayuda?

- Abre un issue con la etiqueta `question`
- Revisa la documentación existente
- Contacta a los maintainers

## 🙏 Agradecimientos

¡Gracias por contribuir a Mhorp y hacer de esta plataforma algo mejor! 

---

*Este documento fue inspirado en las mejores prácticas de proyectos open source populares.*
