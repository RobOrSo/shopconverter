# ShopConverter

Calculadora USD → MXN con listas de compras para tus compras en Estados Unidos.

## Características

- **Calculadora**: Convierte USD a MXN con tipo de cambio guardado y override manual
- **Conversión rápida**: Tabla de montos comunes ($5 a $1000)
- **Listas por tienda**: Walmart, Costco, Sam's, H-E-B, Target (configurables)
- **Listas libres**: Sin categoría de tienda
- **Productos**: Nombre, precio USD, cantidad y subtotal MXN automático
- **Persistencia**: Todo se guarda en el dispositivo (sin servidor)
- **Exportar**: Descarga tus datos en JSON

## Instalar en iPhone (iOS)

1. Abre **Safari** en tu iPhone
2. Ve a: `https://TU_USUARIO.github.io/shopconverter/`
3. Toca el botón de compartir ⬆
4. Selecciona **"Agregar a pantalla de inicio"**
5. Toca **"Agregar"** → la app aparece como ícono en tu pantalla

## Deploy en GitHub Pages

1. Crea un repositorio público en GitHub (ej. `shopconverter`)
2. Sube `index.html`, `manifest.json` y los íconos (`icon-192.png`, `icon-512.png`)
3. Ve a **Settings → Pages → Source: main branch / root**
4. Accede a `https://TU_USUARIO.github.io/shopconverter/`

## Íconos

Para que funcione como PWA en iOS necesitas dos imágenes PNG:
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Puedes generarlos gratis en: https://favicon.io/

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `index.html` | App completa (todo en un solo archivo) |
| `manifest.json` | Configuración PWA para instalación en iOS/Android |
| `icon-192.png` | Ícono de app (192px) — tú lo provees |
| `icon-512.png` | Ícono de app (512px) — tú lo provees |

