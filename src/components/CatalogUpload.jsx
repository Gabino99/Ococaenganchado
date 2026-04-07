import { useState, useRef } from 'react';
import { CATEGORIES, TIPOS } from '../data';
import { addItem } from '../services/firestore';

const GEMMA_PROMPT = `Sos un asistente para un marketplace de economía circular en Ococa, Acosta, Costa Rica.
Tu trabajo es extraer artículos de la información que te doy y devolver SOLO un JSON array válido.

Categorías válidas: materiales, electronica, ropa, muebles, organico, varios
Tipos válidos: venta, trueque, donacion

Para cada artículo extraído, devolvé este formato exacto:
[
  {
    "titulo": "Nombre corto del artículo",
    "descripcion": "Descripción detallada en español costarricense natural, 1-2 oraciones",
    "categoria": "una de las categorías válidas",
    "tipo": "venta o trueque o donacion",
    "precio": 5000
  }
]

Si no hay precio claro, usá null en precio y "donacion" como tipo.
Si es para intercambio, usá "trueque".
Precios en colones costarricenses.
Respondé SOLO con el JSON array, sin texto adicional, sin backticks, sin explicaciones.`;

async function callGemma(apiKey, content, imageBase64 = null) {
  const parts = [];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: imageBase64.type,
        data: imageBase64.data,
      }
    });
    parts.push({ text: GEMMA_PROMPT + "\n\nDescribí los productos que ves en la imagen y extraé artículos:" });
  } else {
    parts.push({ text: GEMMA_PROMPT + "\n\nExtraé artículos de este catálogo:\n\n" + content });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-27b-it:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse JSON from response
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({ data: base64, type: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

export default function CatalogUpload({ open, onClose, user, profile }) {
  const [step, setStep] = useState("upload"); // upload | processing | preview | settings
  const [files, setFiles] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [generatedItems, setGeneratedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("ococa_gemma_key") || ""; } catch { return ""; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const saveApiKey = (key) => {
    setApiKey(key);
    try { localStorage.setItem("ococa_gemma_key", key); } catch {}
  };

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setProcessing(true);
    setError(null);
    setGeneratedItems([]);

    try {
      let allItems = [];

      // Process text input
      if (textInput.trim()) {
        setProgress("Procesando texto con Gemma 4...");
        const items = await callGemma(apiKey, textInput);
        allItems = [...allItems, ...items];
      }

      // Process files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Procesando ${file.name} (${i + 1}/${files.length})...`);

        if (file.type.startsWith("image/")) {
          const base64 = await readFileAsBase64(file);
          const items = await callGemma(apiKey, null, base64);
          allItems = [...allItems, ...items];
        } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
          const text = await readFileAsText(file);
          const items = await callGemma(apiKey, text);
          allItems = [...allItems, ...items];
        } else {
          // For other files, try reading as text
          try {
            const text = await readFileAsText(file);
            const items = await callGemma(apiKey, text.substring(0, 8000));
            allItems = [...allItems, ...items];
          } catch {
            setError(prev => (prev || "") + `\nNo se pudo leer ${file.name}. Probá con CSV o imagen.`);
          }
        }
      }

      if (allItems.length > 0) {
        // Add IDs and metadata
        const autorNombre = profile?.nombre || user?.displayName || "";
        const itemsWithMeta = allItems.map((item, i) => ({
          ...item,
          id: Date.now() + i,
          fecha: "Justo ahora",
          imagen: Math.floor(Math.random() * 8),
          autor: autorNombre,
          _selected: true,
        }));
        setGeneratedItems(itemsWithMeta);
        setSelectedItems(new Set(itemsWithMeta.map(it => it.id)));
        setStep("preview");
      } else {
        setError("No se pudieron extraer artículos. Intentá con otro formato.");
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("API key")) {
        setError("API key inválida. Revisá la configuración.");
        setShowSettings(true);
      } else if (err.message.includes("JSON")) {
        setError("La IA no devolvió un formato válido. Intentá de nuevo.");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setProcessing(false);
      setProgress("");
    }
  };

  const toggleItem = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmItems = async () => {
    const confirmed = generatedItems
      .filter(it => selectedItems.has(it.id))
      .map(it => ({ ...it, _selected: undefined }));

    try {
      for (const item of confirmed) {
        await addItem({
          titulo: item.titulo,
          descripcion: item.descripcion,
          categoria: item.categoria,
          tipo: item.tipo,
          precio: item.precio,
          imagen: item.imagen,
          autorId: user?.uid || "anon",
          autorNombre: item.autor || profile?.nombre || user?.displayName || "Anónimo",
          autorTelefono: profile?.telefono || "",
          autorEmail: user?.email || "",
          fecha: "Justo ahora",
        });
      }
      resetAndClose();
    } catch (err) {
      console.error(err);
      setError("Error al publicar. Intentá de nuevo.");
    }
  };

  const resetAndClose = () => {
    setStep("upload");
    setFiles([]);
    setTextInput("");
    setGeneratedItems([]);
    setSelectedItems(new Set());
    setError(null);
    setShowSettings(false);
    onClose();
  };

  const getCatInfo = (id) => CATEGORIES.find(c => c.id === id);
  const getTipoInfo = (id) => TIPOS.find(t => t.id === id);

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
          width: "min(460px, 94vw)", maxHeight: "88vh", overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2d2a26" }}>
              {step === "preview" ? "Vista previa" : "Subir catálogo"}
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Configurar API Key"
              style={{
                background: "none", border: "none", fontSize: 18, cursor: "pointer",
                color: apiKey ? "#3D8B7A" : "#E07A5F", padding: 4,
              }}
            >⚙️</button>
            <button onClick={resetAndClose}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div style={{
            background: "#f5f2ed", borderRadius: 12, padding: 16, marginBottom: 16,
            border: "1px solid #e0dbd4",
          }}>
            <label style={labelStyle}>API Key de Google AI Studio</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => saveApiKey(e.target.value)}
            />
            <p style={{ fontSize: 11, color: "#8a847d", margin: "8px 0 0", lineHeight: 1.4 }}>
              Gratis en{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener"
                style={{ color: "#3D8B7A", fontWeight: 600 }}>
                aistudio.google.com/apikey
              </a>
              {" "}→ Crear API Key → copiar y pegar acá.
              <br />Se usa Gemma 4 para procesar tus catálogos.
            </p>
            {apiKey && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#3D8B7A", fontWeight: 600 }}>
                ✓ API Key guardada
              </div>
            )}
          </div>
        )}

        {/* ── UPLOAD STEP ── */}
        {step === "upload" && (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #d5d0c8", borderRadius: 16, padding: "28px 16px",
                textAlign: "center", cursor: "pointer",
                background: files.length > 0 ? "#f0faf7" : "#faf8f5",
                transition: "all 0.2s",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>
                {files.length > 0 ? "📎" : "📤"}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#2d2a26", margin: "0 0 4px" }}>
                {files.length > 0 ? `${files.length} archivo(s) seleccionado(s)` : "Tocá para subir archivos"}
              </p>
              <p style={{ fontSize: 12, color: "#8a847d", margin: 0 }}>
                Fotos, Excel (.csv), texto — lo que tengás
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.csv,.tsv,.txt,.xlsx"
                onChange={handleFiles}
                style={{ display: "none" }}
              />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 10px", background: "#f5f2ed", borderRadius: 8, fontSize: 13,
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {f.type.startsWith("image/") ? "📷" : "📄"} {f.name}
                    </span>
                    <button onClick={() => removeFile(i)}
                      style={{ background: "none", border: "none", color: "#E07A5F", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
              <div style={{ flex: 1, height: 1, background: "#e0dbd4" }} />
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600 }}>O ESCRIBÍ DIRECTO</span>
              <div style={{ flex: 1, height: 1, background: "#e0dbd4" }} />
            </div>

            {/* Text input */}
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical", marginBottom: 12 }}
              placeholder={"Ejemplo:\n- 10 bolsas de cemento, ₡5000 c/u\n- Mesa de madera, la cambio por sillas\n- Ropa de niño talla 8, la regalo"}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 12px", borderRadius: 10, background: "#FFF0ED",
                border: "1px solid #E07A5F40", fontSize: 13, color: "#C44D3D",
                marginBottom: 12, lineHeight: 1.4,
              }}>
                {error}
              </div>
            )}

            {/* Process button */}
            <button
              onClick={processFiles}
              disabled={processing || (files.length === 0 && !textInput.trim())}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                background: processing || (files.length === 0 && !textInput.trim()) ? "#ccc"
                  : "linear-gradient(135deg, #3D8B7A, #2d7466)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: processing ? "wait" : (files.length === 0 && !textInput.trim()) ? "not-allowed" : "pointer",
                fontFamily: "'Fraunces', serif",
                transition: "all 0.2s",
              }}
            >
              {processing ? (
                <span>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: 8 }}>⚙️</span>
                  {progress || "Procesando..."}
                </span>
              ) : (
                "Procesar con Gemma 4 🤖"
              )}
            </button>

            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

            {/* Info */}
            <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "10px 0 0", lineHeight: 1.4 }}>
              Gemma 4 analiza tu catálogo y genera artículos automáticamente.
              <br />Podés revisar todo antes de publicar.
            </p>
          </>
        )}

        {/* ── PREVIEW STEP ── */}
        {step === "preview" && (
          <>
            <div style={{
              padding: "10px 12px", borderRadius: 10, background: "#E8F5E9",
              border: "1px solid #6A994E40", fontSize: 13, color: "#3D7A3E",
              marginBottom: 12, fontWeight: 600,
            }}>
              ✓ Gemma 4 encontró {generatedItems.length} artículo(s). Revisá y confirmá.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "#8a847d" }}>
                {selectedItems.size} de {generatedItems.length} seleccionados
              </span>
              <button
                onClick={() => {
                  if (selectedItems.size === generatedItems.length) setSelectedItems(new Set());
                  else setSelectedItems(new Set(generatedItems.map(it => it.id)));
                }}
                style={{
                  background: "none", border: "1px solid #d5d0c8", borderRadius: 8,
                  padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#6b6560",
                }}
              >
                {selectedItems.size === generatedItems.length ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, maxHeight: "40vh", overflowY: "auto" }}>
              {generatedItems.map(item => {
                const cat = getCatInfo(item.categoria);
                const tipo = getTipoInfo(item.tipo);
                const selected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    style={{
                      display: "flex", gap: 10, padding: 10,
                      background: selected ? "#f0faf7" : "#faf8f5",
                      borderRadius: 12, cursor: "pointer",
                      border: selected ? "2px solid #3D8B7A" : "1.5px solid #e0dbd4",
                      transition: "all 0.15s",
                      opacity: selected ? 1 : 0.6,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: selected ? "#3D8B7A" : "#e0dbd4",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 2,
                    }}>
                      {selected ? "✓" : ""}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                        {tipo && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                            color: tipo.color, letterSpacing: "0.5px",
                          }}>{tipo.label}</span>
                        )}
                        {cat && (
                          <span style={{ fontSize: 10, color: "#aaa" }}>{cat.icon} {cat.label}</span>
                        )}
                      </div>
                      <div style={{
                        fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700,
                        color: "#2d2a26", lineHeight: 1.2, marginBottom: 2,
                      }}>
                        {item.titulo}
                      </div>
                      <div style={{ fontSize: 12, color: "#7a756f", lineHeight: 1.3 }}>
                        {item.descripcion}
                      </div>
                      {item.precio && (
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#3D8B7A", fontFamily: "'Fraunces', serif", marginTop: 3 }}>
                          ₡{item.precio.toLocaleString("es-CR")}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Author input */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Tu nombre (para todos los artículos) *</label>
              <input
                style={inputStyle}
                placeholder="¿Cómo te conocen en Ococa?"
                value={generatedItems[0]?.autor || ""}
                onChange={e => {
                  const nombre = e.target.value;
                  setGeneratedItems(prev => prev.map(it => ({ ...it, autor: nombre })));
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setStep("upload"); setGeneratedItems([]); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid #d5d0c8", background: "transparent",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#6b6560",
                }}
              >
                ← Volver
              </button>
              <button
                onClick={confirmItems}
                disabled={selectedItems.size === 0 || !generatedItems[0]?.autor}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 12, border: "none",
                  background: selectedItems.size === 0 || !generatedItems[0]?.autor ? "#ccc" : "#3D8B7A",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: selectedItems.size === 0 ? "not-allowed" : "pointer",
                  fontFamily: "'Fraunces', serif",
                }}
              >
                Publicar {selectedItems.size} artículo(s) ♻️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
