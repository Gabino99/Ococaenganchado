export const CATEGORIES = [
  { id: "materiales", label: "Materiales", icon: "🧱", color: "#E07A5F" },
  { id: "electronica", label: "Electrónica", icon: "⚡", color: "#3D8B7A" },
  { id: "ropa", label: "Ropa y Textiles", icon: "👕", color: "#7B68A8" },
  { id: "muebles", label: "Muebles", icon: "🪑", color: "#C4823A" },
  { id: "organico", label: "Orgánico / Compost", icon: "🌱", color: "#6A994E" },
  { id: "varios", label: "Varios", icon: "📦", color: "#457B9D" },
];

export const TIPOS = [
  { id: "venta", label: "Venta", color: "#3D8B7A" },
  { id: "trueque", label: "Trueque", color: "#E07A5F" },
  { id: "donacion", label: "Donación", color: "#6A994E" },
];

export const ITEM_COLORS = [
  ["#E07A5F", "#F2CC8F"],
  ["#3D8B7A", "#81B29A"],
  ["#7B68A8", "#B8A9D4"],
  ["#C4823A", "#E8C07A"],
  ["#6A994E", "#A7C957"],
  ["#457B9D", "#89B0C8"],
  ["#D4726A", "#F4A89A"],
  ["#5B8A72", "#9DC4A8"],
];

export const SAMPLE_ITEMS = [
  {
    id: 1,
    titulo: "Madera de construcción reutilizada",
    categoria: "materiales",
    tipo: "venta",
    precio: 15000,
    descripcion: "Tablas de cedro en buen estado, ideales para proyectos pequeños. Aproximadamente 12 unidades de 2m.",
    autor: "Carlos M.",
    fecha: "Hace 2 horas",
    imagen: 0,
  },
  {
    id: 2,
    titulo: "Monitor Dell 22\" funcionando",
    categoria: "electronica",
    tipo: "trueque",
    precio: null,
    descripcion: "Monitor en perfecto estado. Busco intercambiar por herramientas de jardín o similar.",
    autor: "Ana L.",
    fecha: "Hace 5 horas",
    imagen: 1,
  },
  {
    id: 3,
    titulo: "Ropa infantil tallas 4-6",
    categoria: "ropa",
    tipo: "donacion",
    precio: null,
    descripcion: "Lote de ropa para niño/a en buen estado. Incluye camisetas, pantalones y un par de zapatos.",
    autor: "María F.",
    fecha: "Ayer",
    imagen: 2,
  },
  {
    id: 4,
    titulo: "Mesa de comedor rústica",
    categoria: "muebles",
    tipo: "venta",
    precio: 35000,
    descripcion: "Mesa de madera maciza para 6 personas. Tiene marcas de uso pero está sólida.",
    autor: "Jorge R.",
    fecha: "Hace 2 días",
    imagen: 3,
  },
  {
    id: 5,
    titulo: "Abono orgánico listo",
    categoria: "organico",
    tipo: "venta",
    precio: 3000,
    descripcion: "Saco de 25kg de compost maduro, perfecto para huertas. Producido en Ococa.",
    autor: "Don Rodrigo",
    fecha: "Hace 3 días",
    imagen: 4,
  },
  {
    id: 6,
    titulo: "Láminas de zinc usadas",
    categoria: "materiales",
    tipo: "donacion",
    precio: null,
    descripcion: "8 láminas de zinc #28, algunas con huecos menores. Sirven para cercas o techos de bodega.",
    autor: "Familia Solano",
    fecha: "Hace 4 días",
    imagen: 5,
  },
  {
    id: 7,
    titulo: "Bicicleta de montaña para reparar",
    categoria: "varios",
    tipo: "trueque",
    precio: null,
    descripcion: "Bici aro 26, necesita cadena y frenos nuevos. Cuadro en buen estado. Cambio por electrodoméstico.",
    autor: "Luis A.",
    fecha: "Hace 5 días",
    imagen: 6,
  },
  {
    id: 8,
    titulo: "Sillas plásticas (juego de 4)",
    categoria: "muebles",
    tipo: "venta",
    precio: 8000,
    descripcion: "4 sillas plásticas blancas, apilables. Buen estado, ideales para actividades comunitarias.",
    autor: "Doña Carmen",
    fecha: "Hace 1 semana",
    imagen: 7,
  },
];

export function formatColones(n) {
  if (!n) return null;
  return "₡" + n.toLocaleString("es-CR");
}
