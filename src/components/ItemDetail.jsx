import { CATEGORIES, formatColones } from '../data';
import Badge from './Badge';
import ItemImage from './ItemImage';

export default function ItemDetail({ item, onClose }) {
  if (!item) return null;
  const cat = CATEGORIES.find((c) => c.id === item.categoria);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(30,28,25,0.55)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fffdf9",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 32px",
          width: "min(480px, 100vw)",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.2)",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <Badge tipo={item.tipo} />
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <ItemImage index={item.imagen} size={100} />
          <div>
            <h2 style={{ margin: "0 0 6px", fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2d2a26", lineHeight: 1.2 }}>
              {item.titulo}
            </h2>
            {item.precio && (
              <div style={{ fontSize: 22, fontWeight: 800, color: "#3D8B7A", fontFamily: "'Fraunces', serif" }}>
                {formatColones(item.precio)}
              </div>
            )}
          </div>
        </div>
        <p style={{ fontSize: 14, color: "#4a4641", lineHeight: 1.6, margin: "0 0 16px" }}>{item.descripcion}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "#f5f2ed",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2a26" }}>{item.autor}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{item.fecha}</div>
          </div>
          {cat && (
            <span style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}>
              {cat.icon} {cat.label}
            </span>
          )}
        </div>
        <button
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: "#3D8B7A",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Fraunces', serif",
          }}
        >
          Contactar a {item.autor} 💬
        </button>
      </div>
    </div>
  );
}
