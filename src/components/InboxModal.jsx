import { useState, useEffect } from 'react';
import { subscribeUserChats } from '../services/firestore';

const READ_KEY = (chatId) => `cr_${chatId}`;

function getReadTs(chatId) {
  return parseInt(localStorage.getItem(READ_KEY(chatId)) || '0', 10);
}

function isUnread(chat, userId) {
  if (!chat.lastMessage || !chat.lastMessageAt) return false;
  if (chat.lastAutorId === userId) return false;
  const ts = chat.lastMessageAt?.toMillis ? chat.lastMessageAt.toMillis() : 0;
  return ts > getReadTs(chat.id);
}

function formatLastTime(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "ahora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("es-CR", { weekday: "short" });
  return d.toLocaleDateString("es-CR", { day: "numeric", month: "short" });
}

export default function InboxModal({ open, onClose, user, onOpenChat, unreadCount }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const unsub = subscribeUserChats(user.uid, (c) => {
      setChats(c);
      setLoading(false);
    });
    return unsub;
  }, [open, user]);

  if (!open) return null;

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
          background: "#fffdf9",
          borderRadius: "20px 20px 0 0",
          width: "min(520px, 100vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px 14px",
          borderBottom: "1px solid #f0ede8",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: "#2d2a26" }}>
                Mensajes
              </div>
              {unreadCount > 0 && (
                <div style={{ fontSize: 11, color: "#3D8B7A", fontWeight: 600 }}>
                  {unreadCount} sin leer
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20,
            cursor: "pointer", color: "#999", padding: 4,
          }}>✕</button>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb", fontSize: 13 }}>
              Cargando mensajes...
            </div>
          ) : chats.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: "#aaa", marginBottom: 6 }}>
                Sin conversaciones todavía
              </div>
              <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.4 }}>
                Cuando contactés a un vendedor o alguien te escriba, las conversaciones aparecen acá.
              </div>
            </div>
          ) : (
            chats.map((chat) => {
              const unread = isUnread(chat, user.uid);
              const otherName = chat.names
                ? Object.entries(chat.names).find(([uid]) => uid !== user.uid)?.[1] || "Usuario"
                : "Usuario";

              return (
                <div
                  key={chat.id}
                  onClick={() => onOpenChat(chat)}
                  style={{
                    display: "flex", gap: 12, padding: "12px 18px",
                    borderBottom: "1px solid #f5f2ed",
                    cursor: "pointer",
                    background: unread ? "#f0faf7" : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Item thumbnail */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {chat.itemFoto ? (
                      <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden" }}>
                        <img src={chat.itemFoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      }}>🛍️</div>
                    )}
                    {/* Avatar overlay */}
                    <div style={{
                      position: "absolute", bottom: -4, right: -4,
                      width: 20, height: 20, borderRadius: 6,
                      background: "linear-gradient(135deg, #457B9D, #2d5f80)",
                      border: "2px solid #fffdf9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 9, fontWeight: 800,
                      fontFamily: "'Fraunces', serif",
                    }}>
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                      <div style={{
                        fontSize: 14, fontWeight: unread ? 800 : 600, color: "#2d2a26",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8,
                      }}>
                        {otherName}
                      </div>
                      <div style={{ fontSize: 11, color: unread ? "#3D8B7A" : "#bbb", fontWeight: unread ? 700 : 400, flexShrink: 0 }}>
                        {formatLastTime(chat.lastMessageAt)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12, color: "#aaa", fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      marginBottom: 2,
                    }}>
                      {chat.itemTitulo}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{
                        fontSize: 13, color: unread ? "#2d2a26" : "#8a847d",
                        fontWeight: unread ? 600 : 400,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      }}>
                        {chat.lastMessage || "Nueva conversación"}
                      </div>
                      {unread && (
                        <div style={{
                          width: 8, height: 8, borderRadius: 4,
                          background: "#3D8B7A", flexShrink: 0, marginLeft: 8,
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export { getReadTs, isUnread };
