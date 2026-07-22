import { CATEGORIES, TIPOS } from '../data';

const CONTACTO = {
  telefono: '6364-2733',
  correo: 'desarrollococa@gmail.com',
  direccion: 'Ococa, Acosta, San José, Costa Rica',
  instagram: 'https://www.instagram.com/desarrollo_ococa',
  facebook: 'https://www.facebook.com/desarrolloococa',
};

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: '#2d2a26' }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function AboutFooter() {
  return (
    <footer style={{ background: '#fffdf9', borderTop: '1px solid #e0dbd4', padding: '28px 18px 40px', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 26 }}>🌿</span>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: 19, color: '#2d2a26', lineHeight: 1.15 }}>
            Ococa Enganchado
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#8a847d', fontWeight: 600, letterSpacing: '0.3px' }}>
            SOBRE EL PROYECTO
          </p>
        </div>
      </div>

      {/* Sobre el proyecto */}
      <Section icon="📖" title="¿Qué es Ococa Enganchado?">
        <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#4a453f', lineHeight: 1.6 }}>
          Es una plataforma comunitaria de <strong>economía circular</strong> para comprar, vender, hacer trueque
          y donar artículos entre vecinos: materiales, electrónica, ropa, muebles, orgánico/compost y muchas
          cosas más. También conecta a personas que ofrecen o buscan mano de obra ("Peones") dentro de la comunidad.
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 13.5, color: '#4a453f', lineHeight: 1.6 }}>
          Fue creada por la <strong>Asociación de Desarrollo Integral de Ococa (A.D.I. de Ococa)</strong>, en
          Acosta, Costa Rica.
        </p>
        <p style={{ margin: 0, fontSize: 13.5, color: '#4a453f', lineHeight: 1.6 }}>
          Nuestra misión es fomentar el reúso y la economía circular dentro de la comunidad, reduciendo lo que
          termina en la basura y fortaleciendo la solidaridad entre vecinos.
        </p>
      </Section>

      {/* Cómo funciona */}
      <Section icon="⚙️" title="Cómo funciona">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { n: '1', t: 'Explorá o buscá', d: 'Filtrá por categoría, tipo (venta, trueque, donación) o usá el buscador para encontrar lo que necesitás.' },
            { n: '2', t: 'Publicá un artículo', d: 'Subí fotos, descripción y precio (si aplica). Podés publicar ventas, trueques o donaciones en segundos.' },
            { n: '3', t: 'Contactá directamente', d: 'Escribile al vendedor o donante por el chat interno de la app para coordinar detalles.' },
            { n: '4', t: 'Coordiná la entrega', d: 'Poneté de acuerdo con la otra persona sobre el lugar, la hora y la forma de intercambio o pago.' },
          ].map((s) => (
            <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                background: 'linear-gradient(135deg, #3B5FA1, #789963)',
                color: '#fff', fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2d2a26', lineHeight: 1.3 }}>{s.t}</div>
                <div style={{ fontSize: 12.5, color: '#7a756f', lineHeight: 1.45 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tipos de intercambio */}
      <Section icon="🔀" title="Tipos de intercambio">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIPOS.map((t) => (
            <span key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20,
              border: `1.5px solid ${t.color}40`, background: t.color + '12',
              fontSize: 12.5, fontWeight: 700, color: t.color,
            }}>
              {t.icon} {t.label}
            </span>
          ))}
        </div>
      </Section>

      {/* Categorías */}
      <Section icon="🗂️" title="Categorías disponibles">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <span key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20,
              border: `1.5px solid ${c.color}40`, background: c.color + '12',
              fontSize: 12.5, fontWeight: 700, color: c.color,
            }}>
              {c.icon} {c.label}
            </span>
          ))}
        </div>
      </Section>

      {/* Contacto */}
      <Section icon="📞" title="Contacto">
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          background: '#f5f2ed', borderRadius: 14, padding: '14px 16px',
        }}>
          <a href={`tel:+506${CONTACTO.telefono.replace('-', '')}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2d2a26', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>📱</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{CONTACTO.telefono}</span>
          </a>
          <a href={`mailto:${CONTACTO.correo}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2d2a26', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>✉️</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{CONTACTO.correo}</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2d2a26' }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{CONTACTO.direccion}</span>
          </div>
          <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2d2a26', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>📷</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>@desarrollo_ococa</span>
          </a>
          <a href={CONTACTO.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2d2a26', textDecoration: 'none' }}>
            <span style={{ fontSize: 16 }}>👍</span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Desarrollo Ococa</span>
          </a>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#8a847d', lineHeight: 1.5 }}>
          Contacto oficial de la Asociación de Desarrollo Integral de Ococa (A.D.I. de Ococa).
        </p>
      </Section>

      {/* Código abierto */}
      <Section icon="🌐" title="Un proyecto replicable">
        <p style={{ margin: 0, fontSize: 13, color: '#4a453f', lineHeight: 1.6 }}>
          Ococa Enganchado es un proyecto de código abierto pensado para ser replicado por otras comunidades
          interesadas en impulsar su propia economía circular. Si querés adaptarlo para tu comunidad, escribinos
          a <strong>{CONTACTO.correo}</strong>.
        </p>
      </Section>

      {/* Legal */}
      <p style={{ margin: 0, fontSize: 12, color: '#8a847d', textAlign: 'center' }}>
        <a href="/privacidad.html" style={{ color: '#8a847d', fontWeight: 600 }}>
          Política de privacidad
        </a>
      </p>
      </div>
    </footer>
  );
}
