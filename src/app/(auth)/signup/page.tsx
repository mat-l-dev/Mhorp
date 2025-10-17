// src/app/(auth)/signup/page.tsx
// Propósito: Página de registro (signup) para nuevos usuarios.

export default function SignupPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-card border rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Crear Cuenta</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90"
          >
            Crear Cuenta
          </button>
        </form>
        {/* TODO: Implementar lógica de registro con Server Actions */}
      </div>
    </div>
  );
}
