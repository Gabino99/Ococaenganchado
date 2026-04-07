import { useState, useEffect, useRef } from 'react';
import { subscribeMessages, sendMessage } from '../services/firestore';

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDateSeparator(current, prev) {
  if (!prev) return true;
  const a = current.creadoEn?.toDate ? current.creadoEn.toDate() : null;
  const b = prev.creadoEn?.toDate ? prev.creadoEn.toDate() : null;
  if (!a || !b) return false;
  return a.toDateString() !== b.toDateString();
}

function DateSeparator({ ts }) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  let label;
  const diff = Math.floor((now - d) / 86400000);
  if (d.toDateString() === now.toDateString()) label = "Hoy";
  else if (diff === 1) label = "Ayer";
  else label = d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      margin: "12px 0 8px",
    }}>
      <div style={{ flex: 1, height: 1, background: "#e8e4de" }} />
      <span style={{
        fontSize: 11, color: "#aaa", fontWeight: 600,
        textTransform: "capitalize", whiteSpace: "nowrap",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#e8e4de" }} />
    </div>
  );
}

export default function ChatModal({ open, onClose, user, profile, onMarkRead }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const unsub = subscribeMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [open]);

  // Scroll to bottom when messages arrive, only if user was already at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // On open: scroll to bottom immediately + mark as read
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView(), 80);
      onMarkRead?.();
    }
  }, [open]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    setText("");
    isAtBottomRef.current = true;
    try {
      const nombre = profile?.nombre || user.displayName || "Anónimo";
      await sendMessage(user.uid, nombre, trimmed);
    } catch (err) {
      console.error(err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  const displayName = profile?.nombre || user?.displayName || "Anónimo";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(30,28,25,0.45)", backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fffdf9",
          borderRadius: "20px 20px 0 0",
          width: "min(520px, 100vw)",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 12px",
          borderBottom: "1px solid #f0ede8",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17,
            }}>💬</div>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: "#2d2a26" }}>
                Plaza Ococa
              </div>
              <div style={{ fontSize: 11, color: "#8a847d", fontWeight: 500 }}>
                Chat comunitario · Acosta
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}
          >✕</button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 14px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: 13 }}>Cargando mensajes...</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🌿</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: "#aaa", marginBottom: 4 }}>
                ¡Nadie ha escrito todavía!
              </div>
              <div style={{ fontSize: 12 }}>Sé el primero en saludar a la comunidad</div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = user && msg.autorId === user.uid;
              const prev = messages[i - 1];
              const showSeparator = shouldShowDateSeparator(msg, prev);
              const showAvatar = !isMine && (i === 0 || messages[i - 1]?.autorId !== msg.autorId || showSeparator);
              const showName = showAvatar;

              return (
                <div key={msg.id}>
                  {showSeparator && <DateSeparator ts={msg.creadoEn} />}

                  <div style={{
                    display: "flex",
                    flexDirection: isMine ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 6,
                    marginBottom: 4,
                  }}>
                    {/* Avatar (others only) */}
                    {!isMine && (
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: showAvatar
                          ? "linear-gradient(135deg, #3D8B7A, #6A994E)"
                          : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 12, fontWeight: 800,
                        fontFamily: "'Fraunces', serif",
                        alignSelf: "flex-end",
                        marginBottom: 2,
                      }}>
                        {showAvatar ? msg.autorNombre?.charAt(0).toUpperCase() : ""}
                      </div>
                    )}

                    <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                      {showName && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a847d", marginBottom: 3, paddingLeft: 2 }}>
                          {msg.autorNombre}
                        </div>
                      )}
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: isMine
                          ? "linear-gradient(135deg, #3D8B7A, #2d7466)"
                          : "#f0ede8",
                        color: isMine ? "#fff" : "#2d2a26",
                        fontSize: 14,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}>
                        {msg.texto}
                      </div>
                      <div style={{
                        fontSize: 10, color: "#bbb", marginTop: 3,
                        paddingLeft: isMine ? 0 : 2, paddingRight: isMine ? 2 : 0,
                      }}>
                        {formatTime(msg.creadoEn)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "10px 14px 14px",
          borderTop: "1px solid #f0ede8",
          flexShrink: 0,
        }}>
          {user ? (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 800,
                fontFamily: "'Fraunces', serif",
                marginBottom: 2,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí algo..."
                rows={1}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1.5px solid #d5d0c8",
                  background: "#faf8f5",
                  fontSize: 14,
                  fontFamily: "'Source Sans 3', sans-serif",
                  color: "#2d2a26",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.4,
                  maxHeight: 100,
                  overflowY: "auto",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  border: "none",
                  background: text.trim() ? "linear-gradient(135deg, #3D8B7A, #2d7466)" : "#e0dbd4",
                  color: "#fff", fontSize: 16, cursor: text.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                  marginBottom: 1,
                }}
              >
                ➤
              </button>
            </div>
          ) : (
            <div style={{
              textAlign: "center", padding: "10px 0", fontSize: 13, color: "#8a847d",
            }}>
              <span>Iniciá sesión para participar en el chat</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
