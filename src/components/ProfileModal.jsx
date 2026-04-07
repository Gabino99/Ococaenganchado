import { useState } from 'react';
import { updateUserProfile } from '../services/firestore';

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
  fontSize: 11,
  fontWeight: 700,
  color: "#6b6560",
  marginBottom: 4,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
};

export default function ProfileModal({ open, onClose, user, profile, onLogout, itemCount = 0 }) {
  const [editing, setEditing] = useState(false);
  const [comunidad, setComunidad] = useState(profile?.comunidad || "");
  const [telefono, setTelefono] = useState(profile?.telefono || "");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const displayName = profile?.nombre || user?.displayName || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "—";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { comunidad: comunidad.trim(), telefono: telefono.trim() });
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setComunidad(profile?.comunidad || "");
    setTelefono(profile?.telefono || "");
    setEditing(false);
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
          position: "relative",
          background: "#fffdf9", borderRadius: 20,
          padding: "28px 22px 22px",
          width: "min(400px, 92vw)", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#999", padding: 4,
          }}
        >✕</button>

        {/* Avatar + nombre */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 28, fontWeight: 800,
            fontFamily: "'Fraunces', serif",
            boxShadow: "0 4px 16px rgba(61,139,122,0.3)",
          }}>
            {initial}
          </div>
          <h2 style={{
            margin: "0 0 4px", fontFamily: "'Fraunces', serif",
            fontSize: 22, fontWeight: 800, color: "#2d2a26",
          }}>
            {displayName}
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: "#8a847d" }}>
            {user?.email}
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 20,
        }}>
          <div style={{
            flex: 1, padding: "12px 10px", borderRadius: 12,
            background: "linear-gradient(135deg, #3D8B7A15, #6A994E15)",
            border: "1px solid #3D8B7A20", textAlign: "center",
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#3D8B7A", fontFamily: "'Fraunces', serif" }}>
              {itemCount}
            </div>
            <div style={{ fontSize: 11, color: "#6b6560", fontWeight: 600, marginTop: 2 }}>
              Artículos publicados
            </div>
          </div>
          <div style={{
            flex: 1, padding: "12px 10px", borderRadius: 12,
            background: "#f5f2ed", border: "1px solid #e0dbd4", textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2d2a26", marginBottom: 2 }}>
              Miembro desde
            </div>
            <div style={{ fontSize: 12, color: "#6b6560", lineHeight: 1.3 }}>
              {formatDate(profile?.creadoEn)}
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div style={{
          borderRadius: 14, border: "1.5px solid #e0dbd4",
          overflow: "hidden", marginBottom: 16,
        }}>
          {/* Comunidad */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderBottom: "1px solid #f0ede8",
          }}>
            <div>
              <div style={labelStyle}>Comunidad / Barrio</div>
              {editing ? (
                <input
                  style={{ ...inputStyle, marginTop: 4, fontSize: 13, padding: "7px 10px" }}
                  placeholder="Ej: Ococa Centro, La Legua..."
                  value={comunidad}
                  onChange={e => setComunidad(e.target.value)}
                />
              ) : (
                <div style={{ fontSize: 14, color: profile?.comunidad ? "#2d2a26" : "#bbb", marginTop: 2 }}>
                  {profile?.comunidad || "Sin especificar"}
                </div>
              )}
            </div>
            {!editing && (
              <span style={{ fontSize: 16 }}>🏘️</span>
            )}
          </div>

          {/* Teléfono */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderBottom: "1px solid #f0ede8",
          }}>
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>WhatsApp</div>
              {editing ? (
                <input
                  style={{ ...inputStyle, marginTop: 4, fontSize: 13, padding: "7px 10px" }}
                  placeholder="Ej: 8888-1234"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  type="tel"
                />
              ) : (
                <div style={{ fontSize: 14, color: profile?.telefono ? "#2d2a26" : "#bbb", marginTop: 2 }}>
                  {profile?.telefono || "Sin especificar"}
                </div>
              )}
            </div>
            {!editing && (
              <span style={{ fontSize: 16 }}>💬</span>
            )}
          </div>

          {/* Email (solo lectura) */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px",
          }}>
            <div>
              <div style={labelStyle}>Correo electrónico</div>
              <div style={{ fontSize: 14, color: "#2d2a26", marginTop: 2 }}>
                {user?.email}
              </div>
            </div>
            <span style={{ fontSize: 16 }}>✉️</span>
          </div>
        </div>

        {/* Edit actions */}
        {editing ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={handleCancel}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                border: "1.5px solid #d5d0c8", background: "transparent",
                fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#6b6560",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
                background: saving ? "#aaa" : "linear-gradient(135deg, #3D8B7A, #2d7466)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: saving ? "wait" : "pointer",
                fontFamily: "'Fraunces', serif",
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 10, marginBottom: 12,
              border: "1.5px solid #3D8B7A40", background: "#f0faf7",
              fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#3D8B7A",
            }}
          >
            ✏️ Editar perfil
          </button>
        )}

        {/* Logout */}
        <button
          onClick={() => { onLogout(); onClose(); }}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
            background: "#FFF0ED",
            fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#C44D3D",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
