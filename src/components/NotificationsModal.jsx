import { useState, useEffect } from 'react';
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from '../services/firestore';
import { CATEGORIES, TIPOS } from '../data';

function formatTime(ts) {
  if (!ts) return '';
  const ms = ts?.toMillis ? ts.toMillis() : Date.now();
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const d = new Date(ms);
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

export default function NotificationsModal({ open, onClose, user, onItemClick }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const unsub = subscribeNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });
    return unsub;
  }, [open, user?.uid]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.leido).length;

  const handleNotifClick = (notif) => {
    if (!notif.leido) markNotificationRead(notif.id).catch(console.error);
    if (onItemClick) onItemClick(notif.itemId);
    onClose();
  };

  const handleMarkAll = () => {
    markAllNotificationsRead(user.uid).catch(console.error);
  };

  const getCatIcon = (catId) => CATEGORIES.find((c) => c.id === catId)?.icon || '📦';
  const getTipoColor = (tipoId) => TIPOS.find((t) => t.id === tipoId)?.color || '#8a847d';
  const getTipoLabel = (tipoId) => TIPOS.find((t) => t.id === tipoId)?.label || tipoId;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(30,28,25,0.55)', backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fffdf9', borderRadius: '20px 20px 0 0',
          padding: '20px 18px 32px',
          maxHeight: '80vh', overflowY: 'auto',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e0dbd4', margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 18, color: '#2d2a26' }}>
              Notificaciones
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 12, fontWeight: 700,
                  background: '#E07A5F', color: '#fff',
                  padding: '2px 7px', borderRadius: 10,
                }}>
                  {unreadCount}
                </span>
              )}
            </h2>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              style={{
                background: 'none', border: '1px solid #d5d0c8', borderRadius: 8,
                padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: '#6b6560',
              }}
            >
              Marcar todo leído
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 13 }}>
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#bbb' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <p style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: '#8a847d', margin: '0 0 6px' }}>
              Sin notificaciones aún
            </p>
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Cuando alguien publique un artículo que coincida con tus alertas, te avisamos acá.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                style={{
                  display: 'flex', gap: 12, padding: '12px 14px',
                  background: notif.leido ? '#faf8f5' : '#f0faf7',
                  borderRadius: 14, cursor: 'pointer',
                  border: notif.leido ? '1px solid #e0dbd4' : '1.5px solid #3D8B7A30',
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.15s',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: notif.leido ? '#e0dbd4' : 'linear-gradient(135deg, #3D8B7A20, #6A994E20)',
                  border: notif.leido ? 'none' : '1.5px solid #3D8B7A30',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {getCatIcon(notif.itemCategoria)}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      color: getTipoColor(notif.itemTipo), letterSpacing: '0.4px',
                    }}>
                      {getTipoLabel(notif.itemTipo)}
                    </span>
                    {!notif.leido && (
                      <span style={{
                        width: 6, height: 6, borderRadius: 3,
                        background: '#3D8B7A', flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: notif.leido ? 600 : 800,
                    color: '#2d2a26', lineHeight: 1.2, marginBottom: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {notif.itemTitulo}
                  </div>
                  {notif.alertTexto && (
                    <div style={{
                      fontSize: 11, color: '#8a847d',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      Coincide con: "{notif.alertTexto}"
                    </div>
                  )}
                </div>

                {/* Time */}
                <div style={{
                  fontSize: 11, color: '#bbb', flexShrink: 0,
                  alignSelf: 'flex-start', paddingTop: 2,
                }}>
                  {formatTime(notif.creadoEn)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
