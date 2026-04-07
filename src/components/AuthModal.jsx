import { useState } from 'react';

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1.5px solid #d5d0c8",
  fontSize: 14,
  fontFamily: "'Source Sans 3', sans-serif",
  background: "#faf8f5",
  color: "#2d2a26",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 10,
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

export default function AuthModal({ open, onClose, onRegister, onLogin }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [comunidad, setComunidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (!nombre.trim()) { setError("Escribí tu nombre"); setLoading(false); return; }
        await onRegister(email, password, nombre.trim(), comunidad.trim(), telefono.trim());
      } else {
        await onLogin(email, password);
      }
      resetAndClose();
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Ya existe una cuenta con ese correo. Probá iniciar sesión.");
      } else if (err.code === "auth/invalid-email") {
        setError("El correo electrónico no es válido.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(err.message || "Ocurrió un error. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setEmail("");
    setPassword("");
    setNombre("");
    setComunidad("");
    setTelefono("");
    setError(null);
    setMode("login");
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
          padding: "28px 22px 22px",
          width: "min(420px, 92vw)", maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 4px 16px rgba(61,139,122,0.3)",
          }}>
            {mode === "login" ? "👋" : "🌱"}
          </div>
          <h2 style={{
            margin: "0 0 4px", fontFamily: "'Fraunces', serif",
            fontSize: 22, fontWeight: 800, color: "#2d2a26",
          }}>
            {mode === "login" ? "¡Bienvenido de vuelta!" : "Únete a la comunidad"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#8a847d", lineHeight: 1.4 }}>
            {mode === "login"
              ? "Iniciá sesión para publicar y contactar vendedores"
              : "Creá tu cuenta para ser parte de Ococa Enganchado"
            }
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 12px", borderRadius: 10, background: "#FFF0ED",
            border: "1px solid #E07A5F40", fontSize: 13, color: "#C44D3D",
            marginBottom: 12, lineHeight: 1.4, textAlign: "center",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label style={labelStyle}>Tu nombre *</label>
              <input
                style={inputStyle}
                placeholder="¿Cómo te conocen en Ococa?"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />

              <label style={labelStyle}>Comunidad / Barrio</label>
              <input
                style={inputStyle}
                placeholder="Ej: Ococa Centro, La Legua, Cangrejal..."
                value={comunidad}
                onChange={e => setComunidad(e.target.value)}
              />

              <label style={labelStyle}>Teléfono (WhatsApp)</label>
              <input
                style={inputStyle}
                placeholder="Ej: 8888-1234"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                type="tel"
              />
            </>
          )}

          <label style={labelStyle}>Correo electrónico *</label>
          <input
            style={inputStyle}
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            required
          />

          <label style={labelStyle}>Contraseña *</label>
          <input
            style={inputStyle}
            placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
              background: loading ? "#aaa" : "linear-gradient(135deg, #3D8B7A, #2d7466)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "'Fraunces', serif",
              marginTop: 6,
              transition: "all 0.2s",
            }}
          >
            {loading
              ? "Cargando..."
              : mode === "login" ? "Iniciar sesión" : "Crear mi cuenta ♻️"
            }
          </button>
        </form>

        {/* Switch mode */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#8a847d" }}>
          {mode === "login" ? (
            <span>
              ¿No tenés cuenta?{" "}
              <button
                onClick={() => { setMode("register"); setError(null); }}
                style={{
                  background: "none", border: "none", color: "#3D8B7A",
                  fontWeight: 700, cursor: "pointer", fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Registrate acá
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tenés cuenta?{" "}
              <button
                onClick={() => { setMode("login"); setError(null); }}
                style={{
                  background: "none", border: "none", color: "#3D8B7A",
                  fontWeight: 700, cursor: "pointer", fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Iniciá sesión
              </button>
            </span>
          )}
        </div>

        {/* Close */}
        <button
          onClick={resetAndClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#999", padding: 4,
          }}
        >✕</button>
      </div>
    </div>
  );
}
