# 📱 PWA Icons

Este directorio contiene los iconos necesarios para la Progressive Web App (PWA).

## 🎨 Iconos Requeridos

Necesitas generar los siguientes iconos con tu logo:

- `icon-72x72.png` (72x72 px)
- `icon-96x96.png` (96x96 px)
- `icon-128x128.png` (128x128 px)
- `icon-144x144.png` (144x144 px)
- `icon-152x152.png` (152x152 px)
- `icon-192x192.png` (192x192 px)
- `icon-384x384.png` (384x384 px)
- `icon-512x512.png` (512x512 px)

## 🛠️ Generador Automático

Usa estas herramientas online para generar todos los tamaños automáticamente:

### Opción 1: PWA Asset Generator (Recomendado)
```bash
npx pwa-asset-generator logo.svg public/icons --icon-only
```

### Opción 2: RealFaviconGenerator
https://realfavicongenerator.net/

### Opción 3: Favicon.io
https://favicon.io/

## 📐 Especificaciones

- **Formato:** PNG (con fondo transparente si es posible)
- **Aspecto:** Cuadrado (1:1)
- **Resolución:** 72 DPI mínimo
- **Colores:** RGB (no CMYK)
- **Maskable:** Los iconos deben tener padding de 10% para maskable icons

## 🎯 Diseño Maskable

Para que los iconos se vean bien en todos los dispositivos (especialmente Android), asegúrate de:

1. Dejar 10% de padding alrededor del logo
2. Mantener el área segura dentro del 80% central
3. Probar con [Maskable.app](https://maskable.app/)

## ✅ Checklist

- [ ] Crear logo base en SVG o PNG de alta resolución (mínimo 1024x1024)
- [ ] Generar todos los tamaños requeridos
- [ ] Verificar que los iconos se vean bien en fondos claros y oscuros
- [ ] Probar en Maskable.app
- [ ] Reemplazar estos archivos en `public/icons/`

## 📝 Notas

Por ahora, este README sirve como placeholder. Los iconos deben ser generados con tu branding real antes del deploy a producción.

Para desarrollo, Next.js usará un icono por defecto, pero es importante tener iconos propios para producción.
