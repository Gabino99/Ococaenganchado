# ♻️ Ococa Enganchado

Marketplace de **economía circular** para la comunidad de Ococa, Acosta, Costa Rica.

Plataforma donde vecinos pueden publicar artículos para venta, trueque o donación, promoviendo la reutilización y reduciendo residuos en la comunidad.

## Funcionalidades

- **Marketplace** con tres tipos de intercambio: venta (₡), trueque y donación
- **6 categorías**: Materiales, Electrónica, Ropa y Textiles, Muebles, Orgánico/Compost, Varios
- **Búsqueda y filtros** por categoría y tipo de intercambio
- **Publicación de artículos** con formulario completo
- **Vista detalle** con botón de contacto
- **Diseño mobile-first** optimizado para celular

## Tecnologías

- React 18
- Vite
- CSS-in-JS (inline styles)
- Google Fonts (Fraunces + Source Sans 3)

## Inicio rápido

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`

## Build para producción

```bash
npm run build
```

Los archivos de producción se generan en la carpeta `dist/`.

## Despliegue

Compatible con GitHub Pages, Vercel, Netlify u cualquier hosting estático.

## Estructura del proyecto

```
src/
├── main.jsx              # Entry point
├── index.css             # Global styles
├── App.jsx               # Componente principal
├── data.js               # Constantes, datos de ejemplo, utilidades
└── components/
    ├── Badge.jsx          # Badge de tipo (Venta/Trueque/Donación)
    ├── ItemImage.jsx      # Ilustraciones SVG generativas
    ├── ItemDetail.jsx     # Modal de detalle de artículo
    └── NewItemModal.jsx   # Formulario de publicación
```

## Asociación de Desarrollo de Ococa

Proyecto impulsado por la Asociación de Desarrollo Integral de Ococa para fortalecer la economía circular en el cantón de Acosta.

---

Hecho con 💚 en Ococa, Acosta
