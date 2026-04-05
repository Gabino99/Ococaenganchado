import { useState } from 'react';
import { CATEGORIES, TIPOS } from '../data';

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1.5px solid #d5d0c8",
  fontSize: 14,
  fontFamily: "'Source Sans 3', sans-serif",
  background: "#faf8f5",
  color: "#2d2a26",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#6b6560",
  marginBottom: 4,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

export default function NewItemModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    categoria: "",
    tipo: "venta",
    precio: "",
    autor: "",
  });

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.titulo || !form.categoria || !form.autor) return;
    onSubmit({
      ...form,
      id: Date.now(),
      precio: form.precio ? parseInt(form.precio) : null,
      fecha: "Justo ahora",
      imagen: Math.floor(Math.random() * 8),
    });
    setForm({ titulo: "", descripcion: "", categoria: "", tipo: "venta", precio: "", autor: "" });
    onClose();
  };

  const canSubmit = form.titulo && form.categoria && form.autor;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
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
          borderRadius: 20,
          padding: "28px 24px 20px",
          width: "min(420px, 92vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 22, color: "#2d2a26" }}>Publicar artículo</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Título *</label>
            <input style={inputStyle} placeholder="¿Qué estás ofreciendo?" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} placeholder="Detalle del estado, cantidad, etc." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Categoría *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setForm({ ...form, categoria: c.id })}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: form.categoria === c.id ? `2px solid ${c.color}` : "1.5px solid #d5d0c8",
                    background: form.categoria === c.id ? c.color + "15" : "transparent",
                    fontSize: 13,
                    cursor: "pointer",
                    color: form.categoria === c.id ? c.color : "#6b6560",
                    fontWeight: form.categoria === c.id ? 700 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Tipo de intercambio</label>
            <div style={{ display: "flex", gap: 8 }}>
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm({ ...form, tipo: t.id })}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 10,
                    border: form.tipo === t.id ? `2px solid ${t.color}` : "1.5px solid #d5d0c8",
                    background: form.tipo === t.id ? t.color + "15" : "transparent",
                    fontSize: 13,
                    fontWeight: form.tipo === t.id ? 700 : 400,
                    cursor: "pointer",
                    color: form.tipo === t.id ? t.color : "#6b6560",
                    transition: "all 0.15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {form.tipo === "venta" && (
            <div>
              <label style={labelStyle}>Precio (₡)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 5000" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Tu nombre *</label>
            <input style={inputStyle} placeholder="¿Cómo te conocen en Ococa?" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: !canSubmit ? "#ccc" : "#3D8B7A",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: !canSubmit ? "not-allowed" : "pointer",
            fontFamily: "'Fraunces', serif",
            letterSpacing: "0.3px",
            transition: "background 0.2s",
          }}
        >
          Publicar ♻️
        </button>
      </div>
    </div>
  );
}
