# Sistema de Carrito de Compras

## Arquitectura Implementada

### 1. Estado del Cliente (Zustand)
**Archivo**: `src/lib/store/cart.ts`

- **Persistencia**: Utiliza `localStorage` con el middleware `persist`
- **Estado**: Array de `CartItem` (producto + cantidad)
- **Acciones**:
  - `addItem(product, quantity)`: Agrega o incrementa cantidad
  - `removeItem(productId)`: Elimina un producto del carrito
  - `updateQuantity(productId, quantity)`: Actualiza cantidad específica
  - `clearCart()`: Vacía el carrito completamente
  - `setItems(items)`: Reemplaza todo el carrito (para hidratación)

### 2. Server Actions
**Archivo**: `src/actions/cart.ts`

#### `addToCart(productId: number, quantity: number)`
- Busca o crea el carrito del usuario en la base de datos
- Si el producto ya existe, incrementa la cantidad
- Si no existe, crea un nuevo `cartItem`
- Retorna `{ success: true }` o `{ error: string }`

#### `getCart()`
- Obtiene el carrito del usuario autenticado
- Incluye la información completa del producto mediante relaciones
- Formatea los datos como `CartItem[]` para sincronizar con Zustand
- Retorna `null` si no hay usuario o `[]` si el carrito está vacío

### 3. Componentes del Cliente

#### `AddToCartButton`
**Archivo**: `src/components/shared/AddToCartButton.tsx`

**Patrón de UI Optimista**:
1. **Actualización inmediata**: Llama a `addItem()` de Zustand
2. **Feedback visual**: Muestra toast de éxito con `sonner`
3. **Sincronización**: Llama a `addToCart()` Server Action en segundo plano
4. **Manejo de errores**: Si falla el servidor, muestra toast de error

```tsx
const handleAddToCart = () => {
  // 1. UI Optimista
  addItem(product);
  toast.success(`${product.name} añadido al carrito.`);

  // 2. Sincronización en segundo plano
  startTransition(async () => {
    const result = await addToCart(product.id);
    if (result?.error) {
      toast.error(result.error);
      // TODO: revertir cambio optimista
    }
  });
};
```

#### `CartIcon`
**Archivo**: `src/components/shared/CartIcon.tsx`

- Lee el estado de Zustand para obtener el contador de items
- Usa `useEffect` + `useState` para evitar mismatch de hidratación
- Muestra badge con el número de productos (o "9+" si hay más de 9)
- Es un link a `/cart`

#### `CartHydrator`
**Archivo**: `src/components/shared/CartHydrator.tsx`

- Recibe `serverCart` como prop desde el layout
- Sincroniza el carrito del servidor con Zustand al montar
- Usa `useRef` para evitar múltiples hidraciones
- No renderiza nada (solo efecto secundario)

### 4. Integración en el Layout
**Archivo**: `src/app/(store)/layout.tsx`

```tsx
export default async function StoreLayout({ children }) {
  const serverCart = await getCart(); // Obtener carrito del servidor

  return (
    <div>
      <Navbar />
      <CartHydrator serverCart={serverCart} /> {/* Sincronizar */}
      <main>{children}</main>
      <Toaster richColors position="top-right" /> {/* Notificaciones */}
    </div>
  );
}
```

## Flujo de Datos

### Agregar al Carrito
```
Usuario hace click en "Agregar al Carrito"
  ↓
Zustand actualiza estado local (instantáneo)
  ↓
Toast muestra "Producto añadido" (instantáneo)
  ↓
Server Action persiste en PostgreSQL (background)
  ↓
Si hay error, muestra toast de error
```

### Cargar Página
```
Layout se renderiza en el servidor
  ↓
getCart() obtiene carrito desde PostgreSQL
  ↓
CartHydrator recibe serverCart como prop
  ↓
useEffect llama a setItems(serverCart)
  ↓
Zustand se sincroniza con el servidor
  ↓
CartIcon muestra el contador actualizado
```

## Ventajas de Esta Arquitectura

1. **Experiencia Instantánea**: El usuario ve cambios inmediatamente sin esperar al servidor
2. **Sincronización Automática**: Al cargar la página, el carrito se sincroniza desde el servidor
3. **Persistencia Dual**:
   - `localStorage`: Mantiene el carrito entre sesiones (sin login)
   - PostgreSQL: Guarda el carrito del usuario autenticado
4. **Feedback Claro**: Toasts para cada acción (éxito/error)
5. **Sin Mismatch de Hidratación**: CartIcon y CartHydrator manejan correctamente SSR

## Siguientes Pasos

- [ ] Implementar página `/cart` con lista completa de productos
- [ ] Agregar funcionalidad de eliminar/actualizar cantidad desde el carrito
- [ ] Implementar lógica de revertir en caso de error del servidor
- [ ] Agregar validación de stock antes de agregar al carrito
- [ ] Implementar proceso de checkout
