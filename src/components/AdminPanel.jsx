import { useState, useEffect } from 'react';
import {
  subscribeAdminFlaggedItems,
  deleteItem,
  adminClearFlags,
  getAdminStats,
  adminStripLegacyContactInfo,
} from '../services/firestore';
import { CATEGORIES, formatColones } from '../data';

export default function AdminPanel({ open, onClose }) {
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [cleanupState, setCleanupState] = useState(null); // null | 'running' | { done: n } | { error: true }

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const unsub = subscribeAdminFlaggedItems((items) => {
      setFlaggedItems(items);
      setLoading(false);
    });

    getAdminStats().then(setStats).catch(console.error);

    return unsub;
  }, [open]);

  if (!open) return null;

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar permanentemente "${item.titulo}"?`)) return;
    setActionLoading(item.id);
    try {
      await deleteItem(item.id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearFlags = async (itemId) => {
    setActionLoading(itemId + '_clear');
    try {
      await adminClearFlags(itemId);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getCatInfo = (id) => CATEGORIES.find((c) => c.id === id);

  const handleCleanup = async () => {
    if (!window.confirm(
      'Esto quita los teléfonos y correos guardados dentro de los artículos viejos. ' +
      'El contacto seguirá funcionando (se lee del perfil del vendedor). ¿Continuar?'
    )) return;
    setCleanupState('running');
    try {
      const count = await adminStripLegacyContactInfo();
      setCleanupState({ done: count });
    } catch (err) {
      console.error('Error en limpieza de contactos:', err);
      setCleanupState({ error: true });
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(30,28,25,0.6)', backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fffdf9', borderRadius: 20,
          padding: '24px 20px 20px',
          width: 'min(460px, 94vw)', maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🛠️</span>
            <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, color: '#2d2a26' }}>
              Panel de administración
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', padding: 4 }}
          >✕</button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            display: 'flex', gap: 10, marginBottom: 16,
          }}>
            <div style={{
              flex: 1, padding: '12px 14px', borderRadius: 12,
              background: 'linear-gradient(135deg, #3B5FA110, #78996310)',
              border: '1px solid #3B5FA120', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", color: '#3B5FA1' }}>
                {stats.totalItems}
              </div>
              <div style={{ fontSize: 11, color: '#8a847d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Artículos
              </div>
            </div>
            <div style={{
              flex: 1, padding: '12px 14px', borderRadius: 12,
              background: 'linear-gradient(135deg, #46709810, #385A7A10)',
              border: '1px solid #46709820', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", color: '#467098' }}>
                {stats.totalUsers}
              </div>
              <div style={{ fontSize: 11, color: '#8a847d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Usuarios
              </div>
            </div>
            <div style={{
              flex: 1, padding: '12px 14px', borderRadius: 12,
              background: 'linear-gradient(135deg, #BB403610, #8F2F2710)',
              border: '1px solid #BB403620', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Fraunces', serif", color: '#BB4036' }}>
                {flaggedItems.length}
              </div>
              <div style={{ fontSize: 11, color: '#8a847d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reportados
              </div>
            </div>
          </div>
        )}

        {/* Mantenimiento */}
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#8a847d',
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
        }}>
          Mantenimiento
        </div>
        <div style={{ marginBottom: 16 }}>
          {cleanupState && typeof cleanupState === 'object' ? (
            <div style={{
              padding: '10px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              background: cleanupState.error ? '#F8ECEB' : '#EEF3E9',
              border: cleanupState.error ? '1px solid #BB403640' : '1px solid #78996340',
              color: cleanupState.error ? '#BB4036' : '#5C7A4E',
            }}>
              {cleanupState.error
                ? 'Hubo un error. Intentá de nuevo.'
                : cleanupState.done === 0
                  ? '✓ No quedan artículos con datos de contacto adentro.'
                  : `✓ Listo: se limpiaron ${cleanupState.done} artículo(s).`}
            </div>
          ) : (
            <button
              onClick={handleCleanup}
              disabled={cleanupState === 'running'}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 12,
                border: '1.5px solid #d5d0c8', background: '#fffdf9',
                fontSize: 13, fontWeight: 700, color: '#6b6560',
                cursor: cleanupState === 'running' ? 'wait' : 'pointer',
              }}
            >
              {cleanupState === 'running'
                ? 'Limpiando...'
                : '🧹 Quitar contactos de artículos viejos'}
            </button>
          )}
        </div>

        {/* Section title */}
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#8a847d',
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
        }}>
          Artículos reportados
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: 13 }}>
            Cargando...
          </div>
        ) : flaggedItems.length === 0 ? (
          <div style={{
            padding: '16px 14px', borderRadius: 12,
            background: '#EBEFF6', border: '1px solid #3B5FA120',
            textAlign: 'center', color: '#5C7A4E', fontSize: 13, fontWeight: 600,
          }}>
            ✓ Sin artículos reportados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {flaggedItems.map((item) => {
              const cat = getCatInfo(item.categoria);
              const isDeleting = actionLoading === item.id;
              const isClearing = actionLoading === item.id + '_clear';

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '14px', borderRadius: 14,
                    background: '#F8ECEB', border: '1.5px solid #BB403630',
                  }}
                >
                  {/* Item info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        {cat && (
                          <span style={{ fontSize: 12, color: '#8a847d' }}>{cat.icon} {cat.label}</span>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
                          background: '#BB4036', color: '#fff',
                        }}>
                          {item.flagCount} reporte{item.flagCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700,
                        color: '#2d2a26', lineHeight: 1.2, marginBottom: 2,
                      }}>
                        {item.titulo}
                      </div>
                      <div style={{ fontSize: 11, color: '#8a847d' }}>
                        Por: {item.autorNombre || 'Desconocido'}
                        {item.precio ? ` · ${formatColones(item.precio)}` : ''}
                      </div>
                      {item.descripcion && (
                        <div style={{
                          fontSize: 12, color: '#7a756f', marginTop: 4, lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {item.descripcion}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleClearFlags(item.id)}
                      disabled={isClearing || isDeleting}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 10,
                        border: '1.5px solid #d5d0c8', background: isClearing ? '#f5f2ed' : '#fffdf9',
                        fontSize: 12, fontWeight: 700, cursor: isClearing ? 'wait' : 'pointer',
                        color: '#6b6560', transition: 'all 0.15s',
                      }}
                    >
                      {isClearing ? 'Limpiando...' : '✓ Limpiar reportes'}
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting || isClearing}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 10,
                        border: 'none', background: isDeleting ? '#D68C86' : 'linear-gradient(135deg, #BB4036, #8F2F27)',
                        fontSize: 12, fontWeight: 700, cursor: isDeleting ? 'wait' : 'pointer',
                        color: '#fff', transition: 'all 0.15s',
                      }}
                    >
                      {isDeleting ? 'Eliminando...' : '🗑 Eliminar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
