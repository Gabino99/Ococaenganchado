import { TIPOS } from '../data';

export default function Badge({ tipo, status }) {
  if (status === "vendido") {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          background: "#8a847d1A",
          color: "#8a847d",
          border: `1.5px solid #8a847d40`,
        }}
      >
        ✅ Vendido
      </span>
    );
  }

  const t = TIPOS.find((x) => x.id === tipo);
  if (!t) return null;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        background: t.color + "1A",
        color: t.color,
        border: `1.5px solid ${t.color}40`,
      }}
    >
      {t.label}
    </span>
  );
}
