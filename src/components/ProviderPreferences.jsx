import { useState, useEffect } from 'react';
import { CATEGORIES, TIPOS } from '../data';
import { saveAlerts } from '../services/firestore';

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

const ALERT_EXAMPLES = [
  "Busco madera para construir cerca",
  "Necesito muebles para mi casa",
  "Ropa de niño talla 10-12",
  "Electrodomésticos que funcionen",
  "Abono o tierra para huerta",
  "Materiales de construcción baratos",
];

export default function ProviderPreferences({ open, onClose, userId, savedAlerts = [] }) {
  const [alerts, setAlerts] = useState([{ texto: "", categorias: [], tipos: [], activo: true }]);
  const [editingIndex, setEditingIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Sync state when modal opens with fresh data from Firestore
  useEffect(() => {
    if (open) {
      if (savedAlerts.length > 0) {
        setAlerts(savedAlerts);
        setEditingIndex(null);
      } else {
        setAlerts([{ texto: "", categorias: [], tipos: [], activo: true }]);
        setEditingIndex(0);
      }
    }
  }, [open]);

  if (!open) return null;

  const addAlert = () => {
    const newAlert = { texto: "", categorias: [], tipos: [], activo: true };
    setAlerts(prev => [...prev, newAlert]);
    setEditingIndex(alerts.length);
  };

  const updateAlert = (index, field, value) => {
    setAlerts(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const toggleCategoria = (index, catId) => {
    setAlerts(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const cats = a.categorias.includes(catId)
        ? a.categorias.filter(c => c !== catId)
        : [...a.categorias, catId];
      return { ...a, categorias: cats };
    }));
  };

  const toggleTipo = (index, tipoId) => {
    setAlerts(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const tipos = a.tipos.includes(tipoId)
        ? a.tipos.filter(t => t !== tipoId)
        : [...a.tipos, tipoId];
      return { ...a, tipos };
    }));
  };

  const removeAlert = (index) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const toggleActive = (index) => {
    setAlerts(prev => prev.map((a, i) => i === index ? { ...a, activo: !a.activo } : a));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validAlerts = alerts.filter(a => a.texto.trim() || a.categorias.length > 0);
      // Clean up alert objects before saving (remove Firestore IDs)
      const cleanAlerts = validAlerts.map(a => ({
        texto: a.texto || "",
        categorias: a.categorias || [],
        tipos: a.tipos || [],
        activo: a.activo !== false,
      }));
      await saveAlerts(userId, cleanAlerts);
      onClose();
    } catch (err) {
      console.error("Error saving alerts:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(30,28,25,0.55)", backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fffdf9", borderRadius: 20,
          padding: "24px 20px 20px",
          width: "min(460px, 94vw)", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2d2a26" }}>
              Mis alertas
            </h2>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: "#8a847d", margin: "0 0 16px", lineHeight: 1.4 }}>
          Decile a la IA qué estás buscando. Cuando alguien publique algo que coincida, te notificamos al toque.
        </p>

        {/* Existing alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
          {alerts.map((alert, index) => (
            <div
              key={index}
              style={{
                borderRadius: 14,
                border: editingIndex === index ? "2px solid #3D8B7A" : "1.5px solid #e0dbd4",
                background: alert.activo ? "#fffdf9" : "#f5f2ed",
                overflow: "hidden",
                opacity: alert.activo ? 1 : 0.6,
                transition: "all 0.2s",
              }}
            >
              {/* Alert header - collapsed view */}
              <div
                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: "#2d2a26",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {alert.texto || (alert.categorias.length > 0
                      ? alert.categorias.map(c => CATEGORIES.find(cat => cat.id === c)?.icon).join(" ") + " " +
                        alert.categorias.map(c => CATEGORIES.find(cat => cat.id === c)?.label).join(", ")
                      : "Nueva alerta..."
                    )}
                  </div>
                  {alert.texto && alert.categorias.length > 0 && (
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                      {alert.categorias.map(c => CATEGORIES.find(cat => cat.id === c)?.icon).join(" ")}
                      {alert.tipos.length > 0 && " · " + alert.tipos.map(t => TIPOS.find(tipo => tipo.id === t)?.label).join(", ")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleActive(index); }}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: "none",
                      background: alert.activo ? "#3D8B7A" : "#ccc",
                      position: "relative", cursor: "pointer", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 8, background: "#fff",
                      position: "absolute", top: 2,
                      left: alert.activo ? 18 : 2,
                      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                  <span style={{ fontSize: 16 }}>{editingIndex === index ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Expanded edit view */}
              {editingIndex === index && (
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0ede8" }}>
                  {/* Text description */}
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>¿Qué estás buscando?</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 56, resize: "vertical" }}
                      placeholder="Describí lo que necesitás..."
                      value={alert.texto}
                      onChange={e => updateAlert(index, "texto", e.target.value)}
                    />
                    {!alert.texto && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                        {ALERT_EXAMPLES.slice(0, 3).map((ex, i) => (
                          <button
                            key={i}
                            onClick={() => updateAlert(index, "texto", ex)}
                            style={{
                              padding: "3px 8px", borderRadius: 6,
                              border: "1px solid #e0dbd4", background: "#faf8f5",
                              fontSize: 11, color: "#8a847d", cursor: "pointer",
                            }}
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Categorías de interés</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {CATEGORIES.map(cat => {
                        const active = alert.categorias.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategoria(index, cat.id)}
                            style={{
                              padding: "5px 10px", borderRadius: 16,
                              border: active ? `2px solid ${cat.color}` : "1.5px solid #d5d0c8",
                              background: active ? cat.color + "15" : "transparent",
                              fontSize: 12, cursor: "pointer",
                              color: active ? cat.color : "#6b6560",
                              fontWeight: active ? 700 : 400,
                              transition: "all 0.15s",
                            }}
                          >
                            {cat.icon} {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Types */}
                  <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Solo me interesan</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {TIPOS.map(tipo => {
                        const active = alert.tipos.includes(tipo.id);
                        return (
                          <button
                            key={tipo.id}
                            onClick={() => toggleTipo(index, tipo.id)}
                            style={{
                              flex: 1, padding: "6px 0", borderRadius: 8,
                              border: active ? `2px solid ${tipo.color}` : "1.5px solid #d5d0c8",
                              background: active ? tipo.color + "12" : "transparent",
                              fontSize: 12, fontWeight: active ? 700 : 400,
                              cursor: "pointer", color: active ? tipo.color : "#8a847d",
                              transition: "all 0.15s",
                            }}
                          >
                            {tipo.label}
                          </button>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 10, color: "#bbb", margin: "4px 0 0" }}>
                      Dejá todo sin seleccionar para recibir alertas de cualquier tipo
                    </p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeAlert(index)}
                    style={{
                      marginTop: 12, padding: "6px 12px", borderRadius: 8,
                      border: "1px solid #E07A5F40", background: "#FFF0ED",
                      fontSize: 12, color: "#C44D3D", cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    🗑 Eliminar alerta
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add alert button */}
        <button
          onClick={addAlert}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            border: "1.5px dashed #d5d0c8", background: "transparent",
            fontSize: 13, color: "#8a847d", cursor: "pointer",
            fontWeight: 600, marginBottom: 16,
            transition: "all 0.15s",
          }}
        >
          + Agregar otra alerta
        </button>

        {/* How it works */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, background: "#f5f2ed",
          marginBottom: 16, fontSize: 12, color: "#6b6560", lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "#2d2a26" }}>¿Cómo funciona?</div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>1.</span> Vos describís lo que buscás
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontWeight: 700 }}>2.</span> Cuando alguien publica algo nuevo, Gemma 4 analiza si coincide con tus alertas
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>3.</span> Si hay match, te mandamos notificación al toque 🔔
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
            background: saving ? "#aaa" : "#3D8B7A",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            fontFamily: "'Fraunces', serif",
          }}
        >
          {saving ? "Guardando..." : "Guardar alertas 🔔"}
        </button>
      </div>
    </div>
  );
}
