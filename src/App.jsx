import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES, TIPOS, SAMPLE_ITEMS, formatColones } from './data';
import ItemImage from './components/ItemImage';
import Badge from './components/Badge';
import NewItemModal from './components/NewItemModal';
import ItemDetail from './components/ItemDetail';
import CatalogUpload from './components/CatalogUpload';
import ProviderPreferences from './components/ProviderPreferences';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ChatModal from './components/ChatModal';
import InboxModal from './components/InboxModal';
import SellerModal from './components/SellerModal';
import useAuth from './hooks/useAuth';
import { subscribeItems, subscribeAlerts, subscribeUserChats, getOrCreateChat } from './services/firestore';
import { isUnread, getReadTs } from './components/InboxModal';

export default function App() {
  const { user, profile, loading: authLoading, register, login, logout , refreshProfileh} = useAuth();
  const [items, setItems] = useState([]);
  const [firebaseItems, setFirebaseItems] = useState(null); // null = loading
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [showNewItem, setShowNewItem] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [sellerData, setSellerData] = useState(null); // { sellerId, sellerName, contextItem }
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatData, setActiveChatData] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [savedAlerts, setSavedAlerts] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Subscribe to Firestore items in real time
  useEffect(() => {
    const unsub = subscribeItems((firestoreItems) => {
      setFirebaseItems(firestoreItems);
    });
    return unsub;
  }, []);

  // Use Firestore items if available, otherwise show sample items
  useEffect(() => {
    if (firebaseItems !== null) {
      if (firebaseItems.length > 0) {
        setItems(firebaseItems);
      } else {
        setItems(SAMPLE_ITEMS);
      }
    }
  }, [firebaseItems]);

  // Subscribe to alerts when user is logged in
  useEffect(() => {
    if (!user) {
      setSavedAlerts([]);
      return;
    }
    const unsub = subscribeAlerts(user.uid, (alerts) => {
      setSavedAlerts(alerts);
    });
    return unsub;
  }, [user]);

  // Subscribe to user's private chats for unread count + browser notifications
  useEffect(() => {
    if (!user) { setUnreadChat(0); return; }
    let initialized = false;
    const unsub = subscribeUserChats(user.uid, (chats) => {
      const count = chats.filter(c => isUnread(c, user.uid)).length;
      setUnreadChat(count);

      // Browser notification on new message (after initial load)
      if (initialized && Notification.permission === "granted" && document.visibilityState !== "visible") {
        const newChats = chats.filter(c => {
          if (!c.lastMessageAt || c.lastAutorId === user.uid) return false;
          const ts = c.lastMessageAt?.toMillis ? c.lastMessageAt.toMillis() : 0;
          return ts > getReadTs(c.id);
        });
        newChats.forEach(c => {
          const senderName = c.names
            ? Object.entries(c.names).find(([uid]) => uid !== user.uid)?.[1] || "Alguien"
            : "Alguien";
          new Notification(`${senderName} te escribió`, {
            body: c.lastMessage || "",
            icon: c.itemFoto || "/icons/icon-192.png",
            tag: `chat_${c.id}`,
          });
        });
      }
      initialized = true;
    });
    return unsub;
  }, [user]);

  const filtered = useMemo(() => items.filter((item) => {
    if (filtroCategoria && item.categoria !== filtroCategoria) return false;
    if (filtroTipo && item.tipo !== filtroTipo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!item.titulo.toLowerCase().includes(q) && !item.descripcion.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [items, filtroCategoria, filtroTipo, busqueda]);

  // Sort: active first, then by date
  const sortedItems = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSold = a.status === "vendido";
      const bSold = b.status === "vendido";
      if (aSold && !bSold) return 1;
      if (!aSold && bSold) return -1;
      return 0; // maintain date order from firestore
    });
  }, [filtered]);

  const requireAuth = () => {
    if (!user) {
      setShowAuth(true);
      return false;
    }
    return true;
  };

  const handlePublish = () => {
    if (requireAuth()) setShowNewItem(true);
  };

  const handleCatalog = () => {
    if (requireAuth()) setShowCatalog(true);
  };

  const handleAlerts = () => {
    if (requireAuth()) setShowAlerts(true);
  };

  const displayName = profile?.nombre || user?.displayName || "Usuario";

  const openInbox = () => {
    if (!user) { setShowAuth(true); return; }
    if (Notification.permission === "default") Notification.requestPermission();
    setShowInbox(true);
  };

  const handleOpenChat = (chat) => {
    const otherUid = chat.participants?.find(uid => uid !== user?.uid);
    const otherName = chat.names?.[otherUid] || "Usuario";
    setActiveChatData({
      itemTitulo: chat.itemTitulo,
      itemFoto: chat.itemFoto || null,
      otherName,
      otherId: otherUid,
    });
    localStorage.setItem(`cr_${chat.id}`, String(Date.now()));
    setActiveChatId(chat.id);
    setShowInbox(false);
  };

  const handleStartChat = async (item) => {
    if (!user) { setShowAuth(true); return; }
    setSelectedItem(null);
    const myName = profile?.nombre || user.displayName || "Anónimo";
    const chatId = await getOrCreateChat(user.uid, myName, item.autorId, item.autorNombre, item);
    localStorage.setItem(`cr_${chatId}`, String(Date.now()));
    setActiveChatData({
      itemTitulo: item.titulo,
      itemFoto: item.fotos?.[0] || null,
      otherName: item.autorNombre || "Vendedor",
      otherId: item.autorId,
    });
    setActiveChatId(chatId);
  };

  const handleViewSeller = (item) => {
    setSellerData({
      sellerId: item.autorId,
      sellerName: item.autorNombre || item.autor,
      contextItem: item,
    });
  };

  const goHome = () => {
    setFiltroCategoria(null);
    setFiltroTipo(null);
    setBusqueda("");
  };

  const userItems = useMemo(() => {
    if (!user) return [];
    return items.filter(it => it.autorId === user.uid);
  }, [items, user]);

  const userItemCount = userItems.length;

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes floatIn { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .item-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
        .item-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .item-card:active { transform: scale(0.98); }
        .cat-btn { transition: all 0.15s ease; }
        .cat-btn:hover { transform: scale(1.05); }
        .fab { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .fab:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(61,139,122,0.45) !important; }
        .fab:active { transform: scale(0.95); }
        .auth-btn { transition: all 0.15s ease; }
        .auth-btn:hover { opacity: 0.85; }
      `}</style>

      {/* Background texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(106,153,78,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, rgba(61,139,122,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(224,122,95,0.04) 0%, transparent 60%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(245,242,237,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 16px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "none" : "translateY(-10px)",
            transition: "all 0.5s ease",
          }}
        >
          <button
            onClick={goHome}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textAlign: "left",
            }}
            title="Ir al inicio"
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                boxShadow: "0 2px 8px rgba(61,139,122,0.3)",
                flexShrink: 0,
              }}
            >
              ♻️
            </div>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: "#2d2a26", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
                Ococa Enganchado
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: "#8a847d", letterSpacing: "0.5px", fontWeight: 600 }}>
                ECONOMÍA CIRCULAR · ACOSTA
              </p>
            </div>
          </button>

          {/* Auth section */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <button
                className="auth-btn"
                onClick={() => setShowProfile(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
                title="Ver perfil"
              >
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2a26", lineHeight: 1.2 }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: 11, color: "#8a847d", fontWeight: 500 }}>
                    {profile?.comunidad || "Ver perfil"}
                  </div>
                </div>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, #3D8B7A, #6A994E)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 15, fontWeight: 800,
                  fontFamily: "'Fraunces', serif",
                  boxShadow: "0 2px 8px rgba(61,139,122,0.25)",
                  flexShrink: 0,
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                className="auth-btn"
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #3D8B7A, #2d7466)",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Fraunces', serif",
                  boxShadow: "0 2px 8px rgba(61,139,122,0.25)",
                }}
              >
                Entrar ♻️
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10, opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(-8px)", transition: "all 0.5s ease 0.1s" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar en Ococa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: 12,
              border: "1.5px solid #e0dbd4",
              background: "#fffdf9",
              fontSize: 14,
              fontFamily: "'Source Sans 3', sans-serif",
              color: "#2d2a26",
              outline: "none",
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }}>
          {CATEGORIES.map((cat) => {
            const active = filtroCategoria === cat.id;
            return (
              <button
                key={cat.id}
                className="cat-btn"
                onClick={() => setFiltroCategoria(active ? null : cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: active ? `2px solid ${cat.color}` : "1.5px solid #ddd8d0",
                  background: active ? cat.color + "15" : "#fffdf9",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? cat.color : "#6b6560",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {cat.icon} {cat.label}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <div style={{ display: "flex", gap: 6, paddingBottom: 12 }}>
          {TIPOS.map((t) => {
            const active = filtroTipo === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setFiltroTipo(active ? null : t.id)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 8,
                  border: active ? `2px solid ${t.color}` : "1.5px solid #ddd8d0",
                  background: active ? t.color + "12" : "transparent",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? t.color : "#8a847d",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Items List */}
      <main style={{ padding: "12px 12px 100px", position: "relative", zIndex: 1 }}>
        {/* Show sample data banner */}
        {firebaseItems !== null && firebaseItems.length === 0 && (
          <div style={{
            padding: "10px 14px", borderRadius: 12, marginBottom: 12,
            background: "linear-gradient(135deg, #3D8B7A15, #6A994E15)",
            border: "1px solid #3D8B7A30", fontSize: 13, color: "#3D7A3E",
            lineHeight: 1.4, textAlign: "center",
          }}>
            📌 Estos son artículos de ejemplo. ¡Sé el primero en publicar algo real!
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16 }}>No se encontraron artículos</p>
            <p style={{ fontSize: 13 }}>Probá con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedItems.map((item, i) => {
              const cat = CATEGORIES.find((c) => c.id === item.categoria);
              const isSold = item.status === "vendido";
              return (
                <div
                  key={item.id}
                  className="item-card"
                  onClick={() => setSelectedItem(item)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    background: isSold ? "#f5f2ed" : "#fffdf9",
                    borderRadius: 16,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    border: "1px solid rgba(0,0,0,0.04)",
                    animation: loaded ? `floatIn 0.4s ease ${i * 0.06}s both` : "none",
                    opacity: isSold ? 0.8 : 1,
                  }}
                >
                  <ItemImage index={item.imagen} size={88} fotos={item.fotos} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Badge tipo={item.tipo} status={item.status} />
                        {cat && <span style={{ fontSize: 10, color: "#aaa" }}>{cat.icon} {cat.label}</span>}
                      </div>
                      <h3
                        style={{
                          margin: "0 0 2px",
                          fontFamily: "'Fraunces', serif",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#2d2a26",
                          lineHeight: 1.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textDecoration: isSold ? "line-through" : "none",
                        }}
                      >
                        {item.titulo}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#7a756f",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.descripcion}
                      </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 }}>
                      {item.precio ? (
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#3D8B7A", fontFamily: "'Fraunces', serif" }}>
                          {formatColones(item.precio)}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span style={{ fontSize: 10, color: "#b0aaa3" }}>
                        {item.autorNombre || item.autor} · {item.fecha || "Reciente"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAB Menu */}
      <div style={{ position: "fixed", bottom: 24, right: 20, zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
        {/* Chat FAB */}
        <button
          className="fab"
          onClick={openInbox}
          style={{
            width: 42, height: 42, borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #457B9D, #2d5f80)",
            color: "#fff", fontSize: 18, cursor: "pointer",
            boxShadow: "0 3px 14px rgba(69,123,157,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
          title="Plaza Ococa · Chat"
        >
          💬
          {unreadChat > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              width: 18, height: 18, borderRadius: 9,
              background: "#E07A5F", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{unreadChat > 9 ? "9+" : unreadChat}</span>
          )}
        </button>

        <button
          className="fab"
          onClick={handleAlerts}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #E07A5F, #c4614a)",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 3px 14px rgba(224,122,95,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
          title="Mis alertas"
        >
          🔔
          {savedAlerts.length > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              width: 18, height: 18, borderRadius: 9,
              background: "#2d2a26", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{savedAlerts.filter(a => a.activo).length}</span>
          )}
        </button>
        <button
          className="fab"
          onClick={handleCatalog}
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #7B68A8, #5a4d80)",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 3px 14px rgba(123,104,168,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Subir catálogo con IA"
        >
          🤖
        </button>
        <button
          className="fab"
          onClick={handlePublish}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #3D8B7A, #2d7466)",
            color: "#fff",
            fontSize: 26,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(61,139,122,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>

      {/* Modals */}
      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onRegister={register}
        onLogin={login}
      />
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        profile={profile}
        onLogout={logout}
        items={userItems}
        onProfileUpdate={refreshProfile}
      />
      <InboxModal
        open={showInbox}
        onClose={() => setShowInbox(false)}
        user={user}
        onOpenChat={handleOpenChat}
        unreadCount={unreadChat}
      />
      <ChatModal
        chatId={activeChatId}
        chatData={activeChatData}
        onClose={() => { setActiveChatId(null); setActiveChatData(null); }}
        onBack={() => { setActiveChatId(null); setActiveChatData(null); setShowInbox(true); }}
        user={user}
        profile={profile}
      />
      <NewItemModal
        open={showNewItem}
        onClose={() => setShowNewItem(false)}
        user={user}
        profile={profile}
      />
      <ItemDetail
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        currentUserId={user?.uid}
        onStartChat={handleStartChat}
        onViewSeller={handleViewSeller}
      />
      <CatalogUpload open={showCatalog} onClose={() => setShowCatalog(false)} user={user} profile={profile} />
      <ProviderPreferences open={showAlerts} onClose={() => setShowAlerts(false)} userId={user?.uid} savedAlerts={savedAlerts} />
      <SellerModal
        open={!!sellerData}
        onClose={() => setSellerData(null)}
        sellerId={sellerData?.sellerId}
        sellerName={sellerData?.sellerName}
        currentUser={user}
        currentProfile={profile}
        contextItem={sellerData?.contextItem}
      />
    </div>
  );
}
