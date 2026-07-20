import { useState, useEffect } from 'react';
import { OFICIOS } from '../data';
import { subscribePeones, addPeon, updatePeon, deletePeon } from '../services/firestore';

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

function oficioInfo(id) {
  return OFICIOS.find(o => o.id === id) || OFICIOS[OFICIOS.length - 1];
}

function formatDateShort(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function whatsappLink(telefono, msg) {
  const phone = (telefono || "").replace(/[^0-9]/g, "");
  if (!phone) return null;
  const costaRicaPhone = phone.length === 8 ? `506${phone}` : phone;
  return `https://wa.me/${costaRicaPhone}?text=${encodeURIComponent(msg)}`;
}

export default function PeonesModal({ open, onClose, user, profile }) {
  const [peones, setPeones] = useState([]);
  const [tab, setTab] = useState('oferta'); // 'oferta' | 'busqueda'
  const [filterDate, setFilterDate] = useState('');
  const [mode, setMode] = useState('list'); // 'list' | 'form'

  // Form state
  const [tipo, setTipo] = useState('oferta');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [oficio, setOficio] = useState('');
  const [comunidad, setComunidad] = useState(profile?.comunidad || '');
  const [telefono, setTelefono] = useState(profile?.telefono || '');
  const [fechas, setFechas] = useState([]);
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const unsub = subscribePeones(setPeones);
    return unsub;
  }, [open]);

  if (!open) return null;

  const filtered = peones.filter((p) => {
    if (p.tipo !== tab) return false;
    if (p.estado === 'cerrado' && p.autorId !== user?.uid) return false;
    if (filterDate && !(p.fechas || []).includes(filterDate)) return false;
    return true;
  });

  const addFecha = () => {
    if (!dateInput) return;
    setFechas(prev => prev.includes(dateInput) ? prev : [...prev, dateInput].sort());
    setDateInput('');
  };

  const removeFecha = (f) => setFechas(prev => prev.filter(x => x !== f));

  const resetForm = () => {
    setTipo('oferta');
    setTitulo('');
    setDescripcion('');
    setOficio('');
    setComunidad(profile?.comunidad || '');
    setTelefono(profile?.telefono || '');
    setFechas([]);
    setDateInput('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !oficio) {
      setError('Completá el título y el oficio');
      return;
    }
    if (fechas.length === 0) {
      setError('Agregá al menos una fecha');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addPeon({
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        oficio,
        comunidad: comunidad.trim(),
        fechas,
        autorId: user.uid,
        autorNombre: profile?.nombre || user.displayName || 'Anónimo',
        autorTelefono: telefono.trim(),
      });
      resetForm();
      setTab(tipo);
      setMode('list');
    } catch (err) {
      console.error(err);
      setError('Error al publicar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    resetForm();
    setMode('list');
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
      onClick={closeModal}
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2d2a26" }}>
            👷 Mano de obra
          </h2>
          <button onClick={closeModal}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>

        {mode === 'form' ? (
          <>
            {/* Tipo */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>¿Qué querés publicar?</label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: 'oferta', label: 'Me ofrezco' },
                  { id: 'busqueda', label: 'Busco un peón' },
                ].map(t => {
                  const active = tipo === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTipo(t.id)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8,
                        border: active ? "2px solid #2C4778" : "1.5px solid #d5d0c8",
                        background: active ? "#2C477815" : "transparent",
                        fontSize: 13, fontWeight: active ? 700 : 400,
                        cursor: "pointer", color: active ? "#2C4778" : "#8a847d",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Título *</label>
              <input
                style={inputStyle}
                placeholder={tipo === 'oferta' ? 'Ej: Peón para lo que se necesite' : 'Ej: Necesito ayuda con la cosecha'}
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
              />
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                placeholder="Detalles del trabajo, experiencia, pago..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>

            {/* Oficio */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Oficio *</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {OFICIOS.map(o => {
                  const active = oficio === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setOficio(o.id)}
                      style={{
                        padding: "5px 10px", borderRadius: 16,
                        border: active ? "2px solid #2C4778" : "1.5px solid #d5d0c8",
                        background: active ? "#2C477815" : "transparent",
                        fontSize: 12, cursor: "pointer",
                        color: active ? "#2C4778" : "#6b6560",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {o.icon} {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fechas */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>
                {tipo === 'oferta' ? 'Días disponibles *' : 'Días que necesitás ayuda *'}
              </label>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input
                  type="date"
                  style={{ ...inputStyle, flex: 1 }}
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                />
                <button
                  onClick={addFecha}
                  style={{
                    padding: "0 16px", borderRadius: 10, border: "none",
                    background: "#2C4778", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Agregar
                </button>
              </div>
              {fechas.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {fechas.map(f => (
                    <span key={f} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 8px", borderRadius: 8,
                      background: "#EBEFF6", border: "1px solid #3B5FA130",
                      fontSize: 12, color: "#3B5FA1", fontWeight: 600,
                    }}>
                      {formatDateShort(f)}
                      <button
                        onClick={() => removeFecha(f)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#3B5FA1", fontSize: 12, padding: 0, lineHeight: 1 }}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Comunidad + teléfono */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Comunidad / Barrio</label>
              <input
                style={inputStyle}
                placeholder="Ej: Ococa Centro, La Legua..."
                value={comunidad}
                onChange={e => setComunidad(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>WhatsApp para contacto *</label>
              <input
                style={inputStyle}
                type="tel"
                placeholder="Ej: 8888-1234"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 12px", borderRadius: 10, background: "#F8ECEB",
                border: "1px solid #BB403640", fontSize: 13, color: "#BB4036",
                marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { resetForm(); setMode('list'); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid #d5d0c8", background: "transparent",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#6b6560",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !telefono.trim()}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
                  background: saving ? "#aaa" : "linear-gradient(135deg, #2C4778, #223A61)",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                  fontFamily: "'Fraunces', serif",
                }}
              >
                {saving ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[
                { id: 'oferta', label: 'Disponibles' },
                { id: 'busqueda', label: 'Se busca' },
              ].map(t => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: active ? "2px solid #2C4778" : "1.5px solid #d5d0c8",
                      background: active ? "#2C477815" : "transparent",
                      fontSize: 13, fontWeight: active ? 700 : 400,
                      cursor: "pointer", color: active ? "#2C4778" : "#8a847d",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Date filter */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Filtrar por fecha</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="date"
                  style={{ ...inputStyle, flex: 1 }}
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    style={{
                      padding: "0 14px", borderRadius: 10, border: "1.5px solid #d5d0c8",
                      background: "transparent", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", color: "#6b6560",
                    }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "#999" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👷</div>
                <p style={{ fontSize: 13 }}>
                  {tab === 'oferta' ? 'No hay peones disponibles todavía' : 'Nadie está buscando peón todavía'}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {filtered.map((p) => {
                  const of = oficioInfo(p.oficio);
                  const isMine = p.autorId === user?.uid;
                  const msg = p.tipo === 'oferta'
                    ? `¡Hola! Vi que estás disponible como peón en Ococa Enganchado y me interesa contactarte.`
                    : `¡Hola! Vi tu publicación buscando un peón en Ococa Enganchado y quiero ofrecerme.`;
                  const link = whatsappLink(p.autorTelefono, msg);
                  return (
                    <div key={p.id} style={{
                      padding: 12, borderRadius: 14,
                      background: p.estado === 'cerrado' ? "#f5f2ed" : "#fff",
                      border: "1.5px solid #e0dbd4",
                      opacity: p.estado === 'cerrado' ? 0.7 : 1,
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: "#2C4778", fontWeight: 700 }}>{of.icon} {of.label}</span>
                            {p.estado === 'cerrado' && (
                              <span style={{ fontSize: 10, color: "#8a847d", fontWeight: 700 }}>· CERRADO</span>
                            )}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#2d2a26" }}>{p.titulo}</div>
                          {p.descripcion && (
                            <div style={{ fontSize: 12, color: "#7a756f", marginTop: 2 }}>{p.descripcion}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                        {(p.fechas || []).map(f => (
                          <span key={f} style={{
                            padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                            background: filterDate === f ? "#2C4778" : "#EBEFF6",
                            color: filterDate === f ? "#fff" : "#3B5FA1",
                          }}>
                            {formatDateShort(f)}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "#b0aaa3" }}>
                          {p.autorNombre}{p.comunidad ? ` · ${p.comunidad}` : ""}
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isMine ? (
                            <>
                              {p.estado !== 'cerrado' && (
                                <button
                                  onClick={() => updatePeon(p.id, { estado: 'cerrado' })}
                                  style={{
                                    padding: "5px 9px", borderRadius: 7, border: "none",
                                    background: "#f0ede8", color: "#6b6560", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                  }}
                                >
                                  Cerrar
                                </button>
                              )}
                              <button
                                onClick={() => { if (confirm("¿Eliminar esta publicación?")) deletePeon(p.id); }}
                                style={{
                                  padding: "5px 9px", borderRadius: 7, border: "none",
                                  background: "#F8ECEB", color: "#BB4036", fontSize: 11, fontWeight: 700, cursor: "pointer",
                                }}
                              >
                                Borrar
                              </button>
                            </>
                          ) : link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: "5px 10px", borderRadius: 7, textDecoration: "none",
                                background: "linear-gradient(135deg, #25D366, #128C7E)",
                                color: "#fff", fontSize: 11, fontWeight: 700,
                              }}
                            >
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => { setTipo(tab); setMode('form'); }}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #2C4778, #223A61)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Fraunces', serif",
              }}
            >
              + Publicar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
