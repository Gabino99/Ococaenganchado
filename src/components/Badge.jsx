import { TIPOS } from '../data';

export default function Badge({ tipo }) {
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
