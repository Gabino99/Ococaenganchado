import { useState } from 'react';
import { CATEGORIES, TIPOS } from '../data';
import { addItem } from '../services/firestore';

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

export default function NewItemModal({ open, onClose, user, profile }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipo, setTipo] = useState("venta");
  const [precio, setPrecio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!titulo.trim() || !categoria) {
      setError("Completá el título y la categoría");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const item = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria,
        tipo,
        precio: tipo === "venta" && precio ? parseInt(precio, 10) : null,
        imagen: Math.floor(Math.random() * 8),
        autorId: user.uid,
        autorNombre: profile?.nombre || user.displayName || "Anónimo",
        autorTelefono: profile?.telefono || "",
        autorEmail: user.email || "",
        fecha: "Justo ahora",
      };

      await addItem(item);
      resetAndClose();
    } catch (err) {
      console.error(err);
      setError("Error al publicar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setTitulo("");
    setDescripcion("");
    setCategoria("");
    setTipo("venta");
    setPrecio("");
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(30,28,25,0.55)", backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={resetAndClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fffdf9", borderRadius: 20,
          padding: "24px 20px 20px",
          width: "min(440px, 94vw)", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2d2a26" }}>
            Publicar artículo
          </h2>
          <button onClick={resetAndClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>

        {/* Publishing as */}
        <div style={{
          padding: "8px 12px", borderRadius: 10, background: "#f0faf7",
          border: "1px solid #3D8B7A30", fontSize: 12, color: "#3D7A3E",
          marginBottom: 14, fontWeight: 600,
        }}>
          📝 Publicando como <strong>{profile?.nombre || user?.displayName || "Usuario"}</strong>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Título del artículo *</label>
          <input
            style={inputStyle}
            placeholder="Ej: Mesa de comedor rústica"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            placeholder="Describí el artículo, condición, medidas..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Categoría *</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {CATEGORIES.map(cat => {
              const active = categoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoria(cat.id)}
                  style={{
                    padding: "5px 10px", borderRadius: 16,
                    border: active ? `2px solid ${cat.color}` : "1.5px solid #d5d0c8",
                    background: active ? cat.color + "15" : "transparent",
                    fontSize: 12, cursor: "pointer",
                    color: active ? cat.color : "#6b6560",
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Type */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Tipo de intercambio</label>
          <div style={{ display: "flex", gap: 6 }}>
            {TIPOS.map(t => {
              const active = tipo === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTipo(t.id)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 8,
                    border: active ? `2px solid ${t.color}` : "1.5px solid #d5d0c8",
                    background: active ? t.color + "12" : "transparent",
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    cursor: "pointer", color: active ? t.color : "#8a847d",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price (only for sale) */}
        {tipo === "venta" && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Precio (₡)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Ej: 5000"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 12px", borderRadius: 10, background: "#FFF0ED",
            border: "1px solid #E07A5F40", fontSize: 13, color: "#C44D3D",
            marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
            background: saving ? "#aaa" : "linear-gradient(135deg, #3D8B7A, #2d7466)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            fontFamily: "'Fraunces', serif",
          }}
        >
          {saving ? "Publicando..." : "Publicar artículo ♻️"}
        </button>
      </div>
    </div>
  );
}
