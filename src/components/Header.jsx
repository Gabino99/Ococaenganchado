import BrandIcon from './BrandIcon';

export default function Header() {
  return (
    <header style={{
      background: 'linear-gradient(135deg, #f5f2ed 0%, #fffdf9 100%)',
      borderBottom: '2px solid #3B5FA1',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* Logo y título */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flex: 1,
      }}>
        <BrandIcon size={70} radius={16} />
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: '#3B5FA1',
            fontFamily: "'Fraunces', serif",
          }}>
            Ococa Enganchado
          </h1>
          <p style={{
            margin: '2px 0 0 0',
            fontSize: 11,
            color: '#8a847d',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Mercado de Economía Circular Comunitaria
          </p>
        </div>
      </div>

      {/* Espaciador */}
      <div style={{ flex: 1 }} />
    </header>
  );
}
