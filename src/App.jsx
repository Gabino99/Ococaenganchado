import { useState, useEffect, useMemo, Fragment } from 'react';
import { CATEGORIES, TIPOS, SAMPLE_ITEMS, formatColones, formatFecha } from './data';
import ItemImage from './components/ItemImage';
import Badge from './components/Badge';
import NewItemModal from './components/NewItemModal';
import ItemDetail from './components/ItemDetail';
import ProviderPreferences from './components/ProviderPreferences';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ChatModal from './components/ChatModal';
import InboxModal from './components/InboxModal';
import SellerModal from './components/SellerModal';
import NotificationsModal from './components/NotificationsModal';
import AdminPanel from './components/AdminPanel';
import PeonesModal from './components/PeonesModal';
import AboutFooter from './components/AboutFooter';
import useAuth from './hooks/useAuth';
import BrandIcon from './components/BrandIcon';
import { subscribeItems, loadMoreItems, subscribeAlerts, subscribeUserChats, subscribeNotifications, getOrCreateChat } from './services/firestore';
import { isUnread, getReadTs } from './components/InboxModal';

export default function App() {
  const { user, profile, loading: authLoading, register, login, logout, refreshProfile, resetPassword } = useAuth();
  const [items, setItems] = useState([]);
  const [firebaseItems, setFirebaseItems] = useState(null); // null = loading
  const [filtroCategoria, setFiltroCategoria] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [showNewItem, setShowNewItem] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showPeones, setShowPeones] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [sellerData, setSellerData] = useState(null); // { sellerId, sellerName, contextItem }
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatData, setActiveChatData] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [savedAlerts, setSavedAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastItemDoc, setLastItemDoc] = useState(null);
  const [hasMoreItems, setHasMoreItems] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Subscribe to Firestore items in real time (primera página)
  useEffect(() => {
    const unsub = subscribeItems(({ items: firestoreItems, lastDoc }) => {
      setFirebaseItems(firestoreItems);
      setLastItemDoc(lastDoc);
      setHasMoreItems(firestoreItems.length === 20);
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

  // Subscribe to in-app notifications
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    let initialLoad = true;
    const prevIds = new Set();
    const unsub = subscribeNotifications(user.uid, (notifs) => {
      if (!initialLoad) {
        notifs
          .filter((n) => !n.leido && !prevIds.has(n.id))
          .forEach((n) => {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Ococa: nuevo artículo para vos 🌿', {
                body: n.itemTitulo,
                icon: '/icons/icon-192.png',
                tag: `notif_${n.id}`,
              });
            }
          });
      }
      notifs.forEach((n) => prevIds.add(n.id));
      setNotifications(notifs);
      initialLoad = false;
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
      if (initialized && 'Notification' in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
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

  const isAdmin = profile?.isAdmin === true;
  const unreadNotifications = notifications.filter((n) => !n.leido).length;

  const handleLoadMore = async () => {
    if (!lastItemDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: more, lastDoc } = await loadMoreItems(lastItemDoc);
      setFirebaseItems((prev) => [...(prev || []), ...more]);
      setLastItemDoc(lastDoc);
      setHasMoreItems(more.length === 20);
    } catch (err) {
      console.error('Error loading more items:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNotificationItemClick = (itemId) => {
    const found = items.find((it) => it.id === itemId);
    if (found) setSelectedItem(found);
  };

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

  const handleAlerts = () => {
    if (requireAuth()) setShowAlerts(true);
  };

  const handlePeones = () => {
    if (requireAuth()) setShowPeones(true);
  };

  const displayName = profile?.nombre || user?.displayName || "Usuario";

  const iconBtnStyle = {
    width: 34, height: 34, borderRadius: 10,
    border: "1.5px solid #e0dbd4", background: "#fffdf9",
    fontSize: 15, cursor: "pointer", padding: 0, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative",
  };

  const iconBadgeStyle = {
    position: "absolute", top: -5, right: -5,
    minWidth: 16, height: 16, borderRadius: 8, padding: "0 3px",
    background: "#BB4036", color: "#fff",
    fontSize: 9, fontWeight: 700, lineHeight: 1,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  const openInbox = () => {
    if (!user) { setShowAuth(true); return; }
    if ('Notification' in window && Notification.permission === "default") Notification.requestPermission();
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

  // ── Loading screen ──────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f2ed" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>♻️</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#3B5FA1", fontWeight: 700 }}>Cargando...</div>
        </div>
      </div>
    );
  }

  // ── Landing page for non-authenticated users ─────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f2ed", position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        `}</style>

        {/* Background texture */}
        <div style={{
          position: "fixed", inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(120,153,99,0.08) 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, rgba(59,95,161,0.08) 0%, transparent 50%)`,
          pointerEvents: "none",
        }} />

        {/* Header */}
        <header style={{ padding: "18px 20px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandIcon size={40} radius={10} />
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: "#2d2a26", lineHeight: 1.1 }}>
                Ococa Enganchado
              </h1>
              <p style={{ margin: 0, fontSize: 10, color: "#8a847d", letterSpacing: "0.5px", fontWeight: 600 }}>
                ECONOMÍA CIRCULAR · OCOCA
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: "7px 16px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #3B5FA1, #2C4778)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Fraunces', serif",
              boxShadow: "0 2px 8px rgba(59,95,161,0.25)",
            }}
          >
            Entrar ♻️
          </button>
          </div>
        </header>

        {/* Hero */}
        <div style={{ padding: "36px 24px 28px", textAlign: "center", animation: "slideUp 0.5s ease" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
          <h2 style={{
            margin: "0 0 14px", fontFamily: "'Fraunces', serif",
            fontSize: 30, fontWeight: 900, color: "#2d2a26", lineHeight: 1.2,
          }}>
            El mercado circular<br />de Ococa
          </h2>
          <p style={{
            margin: "0 auto 32px", fontSize: 15, color: "#6b6560",
            lineHeight: 1.65, maxWidth: 310,
          }}>
            Comprá, vendé, trocá y doná artículos con tu comunidad. Unite y ayudá a que menos cosas terminen en la basura.
          </p>

          <button
            onClick={() => setShowAuth(true)}
            style={{
              padding: "15px 0", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #3B5FA1, #2C4778)",
              color: "#fff", fontSize: 17, fontWeight: 800,
              cursor: "pointer", fontFamily: "'Fraunces', serif",
              boxShadow: "0 6px 24px rgba(59,95,161,0.4)",
              display: "block", width: "100%", maxWidth: 320, margin: "0 auto 14px",
            }}
          >
            Crear cuenta gratis 🌱
          </button>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: "none", border: "none",
              fontSize: 13, color: "#8a847d",
              cursor: "pointer", textDecoration: "underline",
            }}
          >
            Ya tengo cuenta → Iniciar sesión
          </button>
        </div>

        {/* Feature cards */}
        <div style={{ padding: "0 20px 60px", display: "flex", flexDirection: "column", gap: 12, maxWidth: 560, margin: "0 auto" }}>
          {[
            { icon: "🏷️", color: "#3B5FA1", title: "Vendé lo que no usás", desc: "Poné precio y coordiná con compradores de tu comunidad." },
            { icon: "🔄", color: "#789963", title: "Trocá sin plata", desc: "Intercambiá artículos directamente, sin necesidad de dinero." },
            { icon: "🎁", color: "#BB4036", title: "Donaciones vecinas", desc: "Dale una segunda vida a lo que ya no necesitás, gratuitamente." },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "16px 18px", borderRadius: 16,
              background: "#fffdf9", border: "1.5px solid #e0dbd4",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: f.color + "20",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#2d2a26", marginBottom: 2 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 13, color: "#7a756f", lineHeight: 1.4 }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        <AboutFooter />

        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onRegister={register}
          onLogin={login}
          onResetPassword={resetPassword}
        />
      </div>
    );
  }

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
        .fab:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(59,95,161,0.45) !important; }
        .fab:active { transform: scale(0.95); }
        .auth-btn { transition: all 0.15s ease; }
        .auth-btn:hover { opacity: 0.85; }
        .header-icon { transition: transform 0.15s ease, background 0.15s ease; }
        .header-icon:hover { transform: scale(1.08); background: #f5f2ed !important; }
        .profile-names { display: none; }
        @media (min-width: 480px) { .profile-names { display: block; } }
      `}</style>

      {/* Background texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(120,153,99,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 80% 70%, rgba(59,95,161,0.06) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(187,64,54,0.04) 0%, transparent 60%)`,
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
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 12,
            opacity: loaded ? 1 : 0,
            transform: loaded ? "none" : "translateY(-10px)",
            transition: "all 0.5s ease",
          }}
        >
          <button
            onClick={goHome}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer", padding: 0,
              textAlign: "left", minWidth: 0,
            }}
            title="Ir al inicio"
          >
            <BrandIcon size={40} radius={10} />
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: "#2d2a26", letterSpacing: "-0.3px", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                Ococa Enganchado
              </h1>
              <p style={{ margin: 0, fontSize: 10, color: "#8a847d", letterSpacing: "0.5px", fontWeight: 600, whiteSpace: "nowrap" }}>
                ECONOMÍA CIRCULAR · OCOCA
              </p>
            </div>
          </button>

          {/* Auth section */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {user ? (
              <>
                {isAdmin && (
                  <button
                    className="header-icon"
                    onClick={() => setShowAdmin(true)}
                    aria-label="Panel de administración"
                    title="Panel de administración"
                    style={iconBtnStyle}
                  >
                    🛠️
                  </button>
                )}
                <button
                  className="header-icon"
                  onClick={handleAlerts}
                  aria-label="Mis alertas"
                  title="Mis alertas"
                  style={iconBtnStyle}
                >
                  🔔
                  {savedAlerts.filter(a => a.activo).length > 0 && (
                    <span style={iconBadgeStyle}>{savedAlerts.filter(a => a.activo).length}</span>
                  )}
                </button>
                <button
                  className="header-icon"
                  onClick={openInbox}
                  aria-label="Mensajes"
                  title="Plaza Ococa · Chat"
                  style={iconBtnStyle}
                >
                  💬
                  {unreadChat > 0 && (
                    <span style={iconBadgeStyle}>{unreadChat > 9 ? "9+" : unreadChat}</span>
                  )}
                </button>
                <button
                  className="header-icon"
                  onClick={() => setShowNotifications(true)}
                  aria-label="Mis notificaciones"
                  title="Mis notificaciones"
                  style={iconBtnStyle}
                >
                  📬
                  {unreadNotifications > 0 && (
                    <span style={iconBadgeStyle}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>
                  )}
                </button>
                <button
                  className="auth-btn"
                  onClick={() => setShowProfile(true)}
                  aria-label="Ver perfil"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    marginLeft: 2,
                  }}
                  title="Ver perfil"
                >
                  <div className="profile-names" style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2d2a26", lineHeight: 1.2 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: "#8a847d", fontWeight: 500 }}>
                      {profile?.comunidad || "Ver perfil"}
                    </div>
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: profile?.fotoURL ? "#e0dbd4" : "linear-gradient(135deg, #3B5FA1, #789963)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 15, fontWeight: 800,
                    fontFamily: "'Fraunces', serif",
                    boxShadow: "0 2px 8px rgba(59,95,161,0.25)",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}>
                    {profile?.fotoURL ? (
                      <img src={profile.fotoURL} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : displayName.charAt(0).toUpperCase()}
                  </div>
                </button>
              </>
            ) : (
              <button
                className="auth-btn"
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "7px 14px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #3B5FA1, #2C4778)",
                  color: "#fff", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'Fraunces', serif",
                  boxShadow: "0 2px 8px rgba(59,95,161,0.25)",
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
          {TIPOS.map((t, i) => {
            const active = filtroTipo === t.id;
            return (
              <Fragment key={t.id}>
                <button
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
                  {t.icon} {t.label}
                </button>
                {i === 0 && (
                  <button
                    onClick={handlePeones}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #A96B49, #8a5638)",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 6px rgba(169,107,73,0.3)",
                    }}
                  >
                    👷 Peones
                  </button>
                )}
              </Fragment>
            );
          })}
        </div>
        </div>
      </header>

      {/* Items List */}
      <main style={{ padding: "12px 12px 100px", position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
        {/* Show sample data banner */}
        {firebaseItems !== null && firebaseItems.length === 0 && (
          <div style={{
            padding: "10px 14px", borderRadius: 12, marginBottom: 12,
            background: "linear-gradient(135deg, #3B5FA115, #78996315)",
            border: "1px solid #3B5FA130", fontSize: 13, color: "#5C7A4E",
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                        {cat && <span style={{ fontSize: 11, color: "#7a756f" }}>{cat.icon} {cat.label}</span>}
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
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#3B5FA1", fontFamily: "'Fraunces', serif" }}>
                          {formatColones(item.precio)}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span style={{ fontSize: 11, color: "#7a756f" }}>
                        {item.autorNombre || item.autor} · {formatFecha(item)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botón Ver más */}
        {hasMoreItems && firebaseItems && firebaseItems.length > 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0 0' }}>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                padding: '10px 28px', borderRadius: 12,
                border: '1.5px solid #d5d0c8', background: '#fffdf9',
                fontSize: 13, fontWeight: 700, color: '#3B5FA1',
                cursor: loadingMore ? 'wait' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loadingMore ? 'Cargando...' : 'Ver más artículos'}
            </button>
          </div>
        )}
      </main>

      <AboutFooter />

      {/* FAB: publicar artículo */}
      <div style={{ position: 'fixed', bottom: 24, right: 'max(20px, calc(50vw - 300px))', zIndex: 50 }}>
        <button
          className="fab"
          onClick={handlePublish}
          aria-label="Publicar artículo"
          title="Publicar artículo"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg, #3B5FA1, #2C4778)",
            color: "#fff",
            fontSize: 26,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(59,95,161,0.35)",
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
        onResetPassword={resetPassword}
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
      <ProviderPreferences open={showAlerts} onClose={() => setShowAlerts(false)} userId={user?.uid} savedAlerts={savedAlerts} />
      <PeonesModal open={showPeones} onClose={() => setShowPeones(false)} user={user} profile={profile} />
      <SellerModal
        open={!!sellerData}
        onClose={() => setSellerData(null)}
        sellerId={sellerData?.sellerId}
        sellerName={sellerData?.sellerName}
        currentUser={user}
        currentProfile={profile}
        contextItem={sellerData?.contextItem}
      />
      <NotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        user={user}
        onItemClick={handleNotificationItemClick}
      />
      <AdminPanel
        open={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </div>
  );
}
