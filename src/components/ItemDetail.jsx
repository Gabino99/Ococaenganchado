import { useState } from 'react';
import { CATEGORIES, formatColones } from '../data';
import ItemImage from './ItemImage';
import Badge from './Badge';

export default function ItemDetail({ item, onClose }) {
  const [activePhoto, setActivePhoto] = useState(0);

  if (!item) return null;

  const fotos = item.fotos && item.fotos.length > 0 ? item.fotos : null;
  const cat = CATEGORIES.find((c) => c.id === item.categoria);

  const formatDate = (fecha) => {
    if (!fecha) return "Reciente";
    if (typeof fecha === "string") return fecha;
    if (fecha.toDate) {
      const d = fecha.toDate();
      const now = new Date();
      const diff = now - d;
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `Hace ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `Hace ${hrs}h`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `Hace ${days} día${days > 1 ? "s" : ""}`;
      return d.toLocaleDateString("es-CR");
    }
    return "Reciente";
  };

  const handleWhatsApp = () => {
    const phone = (item.autorTelefono || "").replace(/[^0-9]/g, "");
    if (!phone) {
      alert("Este vendedor no dejó número de WhatsApp. Podés contactarlo por otros medios.");
      return;
    }
    const costaRicaPhone = phone.length === 8 ? `506${phone}` : phone;
    const msg = encodeURIComponent(
      `¡Hola! Vi tu artículo "${item.titulo}" en Ococa Enganchado y me interesa. ¿Está disponible? 🌿`
    );
    window.open(`https://wa.me/${costaRicaPhone}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    if (!item.autorEmail) return;
    const subject = encodeURIComponent(`Sobre "${item.titulo}" en Ococa Enganchado`);
    const body = encodeURIComponent(
      `¡Hola! Vi tu artículo "${item.titulo}" en Ococa Enganchado y me interesa. ¿Está disponible?`
    );
    window.open(`mailto:${item.autorEmail}?subject=${subject}&body=${body}`);
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
          padding: "20px 18px",
          width: "min(440px, 94vw)", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Close */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>

        {/* Photo gallery */}
        {fotos ? (
          <div style={{ marginBottom: 16 }}>
            {/* Main photo */}
            <div style={{
              borderRadius: 14, overflow: "hidden",
              width: "100%", aspectRatio: "4/3",
              background: "#f0ede8", marginBottom: 8,
            }}>
              <img
                src={fotos[activePhoto]}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            {/* Thumbnails */}
            {fotos.length > 1 && (
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {fotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: 52, height: 52, flexShrink: 0, borderRadius: 8, overflow: "hidden",
                      border: activePhoto === i ? "2.5px solid #3D8B7A" : "2px solid transparent",
                      padding: 0, cursor: "pointer", background: "none",
                      opacity: activePhoto === i ? 1 : 0.65,
                      transition: "all 0.15s",
                    }}
                  >
                    <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ItemImage index={item.imagen} size={160} />
          </div>
        )}

        {/* Badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <Badge tipo={item.tipo} />
          {cat && <span style={{ fontSize: 12, color: "#8a847d" }}>{cat.icon} {cat.label}</span>}
        </div>

        {/* Title */}
        <h2 style={{
          margin: "0 0 6px", fontFamily: "'Fraunces', serif",
          fontSize: 22, fontWeight: 800, color: "#2d2a26", lineHeight: 1.2,
        }}>
          {item.titulo}
        </h2>

        {/* Price */}
        {item.precio && (
          <div style={{
            fontSize: 22, fontWeight: 800, color: "#3D8B7A",
            fontFamily: "'Fraunces', serif", marginBottom: 8,
          }}>
            {formatColones(item.precio)}
          </div>
        )}

        {/* Description */}
        <p style={{
          fontSize: 14, color: "#5a5650", lineHeight: 1.6,
          margin: "0 0 16px", whiteSpace: "pre-wrap",
        }}>
          {item.descripcion}
        </p>

        {/* Seller info */}
        <div style={{
          padding: "12px 14px", borderRadius: 12, background: "#f5f2ed",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: "#8a847d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
            Publicado por
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "'Fraunces', serif",
            }}>
              {(item.autorNombre || item.autor || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2d2a26" }}>
                {item.autorNombre || item.autor}
              </div>
              <div style={{ fontSize: 12, color: "#8a847d" }}>
                {formatDate(item.creadoEn || item.fecha)}
              </div>
            </div>
          </div>
        </div>

        {/* Contact buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            style={{
              flex: 2, padding: "13px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Fraunces', serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 3px 14px rgba(37,211,102,0.3)",
              transition: "all 0.2s",
            }}
          >
            💬 WhatsApp
          </button>

          {/* Email button */}
          {item.autorEmail && (
            <button
              onClick={handleEmail}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12,
                border: "1.5px solid #d5d0c8", background: "transparent",
                color: "#6b6560", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              ✉️ Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
