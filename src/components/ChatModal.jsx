import { useState, useEffect, useRef } from 'react';
import { subscribeChatMessages, sendChatMessage } from '../services/firestore';

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" }) +
    " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDateSeparator(curr, prev) {
  if (!prev) return true;
  const a = curr.creadoEn?.toDate?.();
  const b = prev.creadoEn?.toDate?.();
  if (!a || !b) return false;
  return a.toDateString() !== b.toDateString();
}

function DateSep({ ts }) {
  if (!ts?.toDate) return null;
  const d = ts.toDate();
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  let label;
  if (d.toDateString() === now.toDateString()) label = "Hoy";
  else if (diff === 1) label = "Ayer";
  else label = d.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
      <div style={{ flex: 1, height: 1, background: "#e8e4de" }} />
      <span style={{ fontSize: 10, color: "#bbb", fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#e8e4de" }} />
    </div>
  );
}

// chatData: { itemTitulo, itemFoto, otherName, otherId }
export default function ChatModal({ chatId, chatData, onClose, onBack, user, profile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    const unsub = subscribeChatMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatId) setTimeout(() => bottomRef.current?.scrollIntoView(), 80);
  }, [chatId]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    setText("");
    atBottomRef.current = true;
    try {
      await sendChatMessage(chatId, user.uid, trimmed);
    } catch (err) {
      console.error(err);
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!chatId) return null;

  const myName = profile?.nombre || user?.displayName || "Yo";
  const otherName = chatData?.otherName || "Vendedor";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1010,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(30,28,25,0.45)", backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fffdf9",
          borderRadius: "20px 20px 0 0",
          width: "min(520px, 100vw)",
          height: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px 12px",
          borderBottom: "1px solid #f0ede8",
          flexShrink: 0,
        }}>
          {onBack && (
            <button onClick={onBack} style={{
              background: "none", border: "none", fontSize: 18,
              cursor: "pointer", color: "#8a847d", padding: "0 4px 0 0", lineHeight: 1,
            }}>←</button>
          )}
          {/* Item thumbnail */}
          {chatData?.itemFoto ? (
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
              <img src={chatData.itemFoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🛍️</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 800, color: "#2d2a26",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {otherName}
            </div>
            <div style={{
              fontSize: 11, color: "#8a847d",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {chatData?.itemTitulo}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#999", padding: 4, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "8px 14px", display: "flex", flexDirection: "column" }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>
              <div style={{ fontSize: 12 }}>Cargando...</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👋</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: "#aaa", marginBottom: 4 }}>
                ¡Escribile al {otherName}!
              </div>
              <div style={{ fontSize: 12, color: "#bbb" }}>
                Preguntá por "{chatData?.itemTitulo}"
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMine = msg.autorId === user?.uid;
              const prev = messages[i - 1];
              const showSep = shouldShowDateSeparator(msg, prev);
              const showName = !isMine && (showSep || messages[i - 1]?.autorId !== msg.autorId);
              return (
                <div key={msg.id}>
                  {showSep && <DateSep ts={msg.creadoEn} />}
                  <div style={{
                    display: "flex",
                    flexDirection: isMine ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 6,
                    marginBottom: 4,
                  }}>
                    {!isMine && (
                      <div style={{
                        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                        background: showName ? "linear-gradient(135deg, #3D8B7A, #6A994E)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 11, fontWeight: 800,
                        fontFamily: "'Fraunces', serif", alignSelf: "flex-end", marginBottom: 2,
                      }}>
                        {showName ? otherName.charAt(0).toUpperCase() : ""}
                      </div>
                    )}
                    <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                      {showName && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#8a847d", marginBottom: 3, paddingLeft: 2 }}>
                          {otherName}
                        </div>
                      )}
                      <div style={{
                        padding: "8px 12px",
                        borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: isMine ? "linear-gradient(135deg, #3D8B7A, #2d7466)" : "#f0ede8",
                        color: isMine ? "#fff" : "#2d2a26",
                        fontSize: 14, lineHeight: 1.45,
                        wordBreak: "break-word", whiteSpace: "pre-wrap",
                      }}>
                        {msg.texto}
                      </div>
                      <div style={{ fontSize: 10, color: "#bbb", marginTop: 3, paddingLeft: isMine ? 0 : 2 }}>
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
        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #f0ede8", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: "linear-gradient(135deg, #457B9D, #2d5f80)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 11, fontWeight: 800,
              fontFamily: "'Fraunces', serif", marginBottom: 2,
            }}>
              {myName.charAt(0).toUpperCase()}
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu mensaje..."
              rows={1}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 12,
                border: "1.5px solid #d5d0c8", background: "#faf8f5",
                fontSize: 14, fontFamily: "'Source Sans 3', sans-serif",
                color: "#2d2a26", outline: "none", resize: "none",
                lineHeight: 1.4, maxHeight: 100, overflowY: "auto",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0, border: "none",
                background: text.trim() ? "linear-gradient(135deg, #3D8B7A, #2d7466)" : "#e0dbd4",
                color: "#fff", fontSize: 16,
                cursor: text.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", marginBottom: 1,
              }}
            >➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
