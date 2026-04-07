import { useState, useEffect } from 'react';
import { subscribeSellerReviews, submitReview, getSellerProfile } from '../services/firestore';
import StarRating, { calcRating } from './StarRating';

const RATING_LABELS = { 1: "Muy malo", 2: "Malo", 3: "Regular", 4: "Bueno", 5: "Excelente" };

function formatDate(ts) {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: "#8a847d", width: 8, textAlign: "right" }}>{star}</span>
      <span style={{ fontSize: 11, color: "#F4B942" }}>★</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#f0ede8", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #F4B942, #e8a830)",
          borderRadius: 3, transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#bbb", width: 16, textAlign: "right" }}>{count}</span>
    </div>
  );
}

export default function SellerModal({ open, onClose, sellerId, sellerName, currentUser, currentProfile, contextItem }) {
  const [reviews, setReviews] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!open || !sellerId) return;
    setLoading(true);
    setShowForm(false);

    // Fetch seller profile
    getSellerProfile(sellerId).then(p => setSellerProfile(p));

    // Subscribe to reviews
    const unsub = subscribeSellerReviews(sellerId, (r) => {
      setReviews(r);
      setLoading(false);
    });
    return unsub;
  }, [open, sellerId]);

  if (!open) return null;

  const { avg, count } = calcRating(reviews);
  const displayName = sellerProfile?.nombre || sellerName || "Vendedor";
  const myReview = currentUser ? reviews.find(r => r.buyerId === currentUser.uid) : null;
  const canReview = currentUser && currentUser.uid !== sellerId;

  // Count per star for the bar chart
  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));

  const handleSubmit = async () => {
    if (rating === 0) { setFormError("Seleccioná una calificación"); return; }
    setSaving(true);
    setFormError(null);
    try {
      const buyerName = currentProfile?.nombre || currentUser.displayName || "Anónimo";
      await submitReview(sellerId, currentUser.uid, buyerName, rating, comment, contextItem || null);
      setShowForm(false);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error(err);
      setFormError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1010,
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
          padding: "24px 20px 20px",
          width: "min(460px, 94vw)", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", fontSize: 20,
          cursor: "pointer", color: "#999", padding: 4,
        }}>✕</button>

        {/* Seller header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 10px",
            background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 26, fontWeight: 800,
            fontFamily: "'Fraunces', serif",
            boxShadow: "0 4px 16px rgba(61,139,122,0.3)",
          }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h2 style={{
            margin: "0 0 2px", fontFamily: "'Fraunces', serif",
            fontSize: 20, fontWeight: 800, color: "#2d2a26",
          }}>
            {displayName}
          </h2>
          {sellerProfile?.comunidad && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#8a847d" }}>
              📍 {sellerProfile.comunidad}
            </p>
          )}
          {/* Avg rating summary */}
          {count > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <StarRating value={avg} size={18} />
              <span style={{ fontSize: 15, fontWeight: 800, color: "#2d2a26" }}>{avg.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: "#8a847d" }}>({count} {count === 1 ? "reseña" : "reseñas"})</span>
            </div>
          )}
        </div>

        {/* Rating breakdown */}
        {count > 0 && (
          <div style={{
            padding: "14px 16px", borderRadius: 14, background: "#f5f2ed",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: "#2d2a26", fontFamily: "'Fraunces', serif", lineHeight: 1 }}>
                  {avg.toFixed(1)}
                </div>
                <StarRating value={avg} size={13} />
              </div>
              <div style={{ flex: 1 }}>
                {starCounts.map(({ star, count: c }) => (
                  <RatingBar key={star} star={star} count={c} total={count} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leave review button / form */}
        {canReview && !showForm && (
          <button
            onClick={() => {
              setRating(myReview?.rating || 0);
              setComment(myReview?.comment || "");
              setShowForm(true);
            }}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 12, marginBottom: 16,
              border: myReview ? "1.5px solid #3D8B7A40" : "none",
              background: myReview ? "#f0faf7" : "linear-gradient(135deg, #3D8B7A, #2d7466)",
              color: myReview ? "#3D8B7A" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Fraunces', serif",
            }}
          >
            {myReview ? `✏️ Editar tu reseña (${myReview.rating}★)` : "⭐ Calificar a este vendedor"}
          </button>
        )}

        {/* Review form */}
        {showForm && (
          <div style={{
            padding: "16px", borderRadius: 14, marginBottom: 16,
            border: "1.5px solid #3D8B7A40", background: "#f0faf7",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2a26", marginBottom: 12, textAlign: "center" }}>
              {myReview ? "Editá tu reseña" : `¿Cómo fue tu experiencia con ${displayName}?`}
            </div>

            {/* Star selector */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12, gap: 6 }}>
              <StarRating value={rating} onChange={setRating} size={34} />
              {rating > 0 && (
                <span style={{ fontSize: 12, color: "#3D8B7A", fontWeight: 600 }}>
                  {RATING_LABELS[rating]}
                </span>
              )}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Contá tu experiencia (opcional)..."
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: "1.5px solid #d5d0c8", background: "#faf8f5",
                fontSize: 14, fontFamily: "'Source Sans 3', sans-serif",
                color: "#2d2a26", outline: "none", resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            {formError && (
              <div style={{
                padding: "8px 10px", borderRadius: 8, background: "#FFF0ED",
                border: "1px solid #E07A5F40", fontSize: 12, color: "#C44D3D",
                marginTop: 8,
              }}>
                {formError}
              </div>
            )}

            {contextItem && (
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
                Sobre: <em>{contextItem.titulo}</em>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setShowForm(false); setFormError(null); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: "1.5px solid #d5d0c8", background: "transparent",
                  fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#6b6560",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || rating === 0}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
                  background: rating === 0 || saving ? "#ccc" : "linear-gradient(135deg, #3D8B7A, #2d7466)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: rating === 0 || saving ? "default" : "pointer",
                  fontFamily: "'Fraunces', serif",
                }}
              >
                {saving ? "Guardando..." : myReview ? "Actualizar reseña" : "Publicar reseña"}
              </button>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#bbb", fontSize: 13 }}>
            Cargando reseñas...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: "#aaa", marginBottom: 4 }}>
              Sin reseñas todavía
            </div>
            <div style={{ fontSize: 12, color: "#bbb" }}>
              {canReview ? "¡Sé el primero en calificar a este vendedor!" : "Este vendedor aún no tiene reseñas."}
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#8a847d",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
            }}>
              Reseñas ({count})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: r.buyerId === currentUser?.uid ? "#f0faf7" : "#f5f2ed",
                    border: r.buyerId === currentUser?.uid ? "1px solid #3D8B7A20" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: "linear-gradient(135deg, #457B9D, #2d5f80)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 800,
                        fontFamily: "'Fraunces', serif",
                      }}>
                        {r.buyerName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2a26", lineHeight: 1.2 }}>
                          {r.buyerName}
                          {r.buyerId === currentUser?.uid && (
                            <span style={{ fontSize: 10, color: "#3D8B7A", marginLeft: 6, fontWeight: 600 }}>Tú</span>
                          )}
                        </div>
                        <StarRating value={r.rating} size={11} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#bbb", textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                      {formatDate(r.creadoEn)}
                    </div>
                  </div>
                  {r.comment && (
                    <p style={{ margin: 0, fontSize: 13, color: "#5a5650", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {r.comment}
                    </p>
                  )}
                  {r.itemTitulo && (
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>
                      Sobre: {r.itemTitulo}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
