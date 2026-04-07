import { ITEM_COLORS } from '../data';

const patterns = [
  // Wood planks
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      {[0, 25, 50, 75, 100].map((y, i) => (
        <g key={i}>
          <rect x="0" y={y} width="120" height="22" fill={c[1]} opacity="0.3" rx="2" />
          <line x1="0" y1={y + 11} x2="120" y2={y + 11} stroke={c[0]} strokeWidth="0.5" opacity="0.5" />
        </g>
      ))}
      <circle cx="30" cy="40" r="4" fill={c[0]} opacity="0.3" />
      <circle cx="85" cy="75" r="3" fill={c[0]} opacity="0.25" />
    </svg>
  ),
  // Monitor
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <rect x="20" y="20" width="80" height="55" rx="4" fill={c[1]} />
      <rect x="25" y="25" width="70" height="45" rx="2" fill={c[0]} opacity="0.6" />
      <rect x="50" y="78" width="20" height="12" fill={c[1]} opacity="0.8" />
      <rect x="40" y="90" width="40" height="5" rx="2" fill={c[1]} opacity="0.6" />
      <circle cx="60" cy="47" r="3" fill={c[1]} opacity="0.4" />
    </svg>
  ),
  // Clothes
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <path d="M40 30 L60 25 L80 30 L90 50 L75 45 L75 95 L45 95 L45 45 L30 50 Z" fill={c[1]} opacity="0.8" />
      <path d="M52 25 Q60 35 68 25" fill="none" stroke={c[0]} strokeWidth="2" opacity="0.5" />
      {[50, 60, 70, 80].map((y, i) => (
        <line key={i} x1="50" y1={y} x2="70" y2={y} stroke={c[0]} strokeWidth="0.5" opacity="0.2" />
      ))}
    </svg>
  ),
  // Table
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <rect x="15" y="40" width="90" height="8" rx="2" fill={c[1]} opacity="0.9" />
      <rect x="22" y="48" width="6" height="45" fill={c[1]} opacity="0.6" />
      <rect x="92" y="48" width="6" height="45" fill={c[1]} opacity="0.6" />
      <rect x="20" y="38" width="80" height="4" rx="1" fill={c[1]} opacity="0.4" />
    </svg>
  ),
  // Compost/plant
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <ellipse cx="60" cy="85" rx="35" ry="15" fill={c[1]} opacity="0.5" />
      <path d="M60 80 Q55 60 45 55 Q55 55 60 45 Q65 55 75 55 Q65 60 60 80" fill={c[1]} opacity="0.8" />
      <path d="M60 65 Q50 50 40 48 Q52 45 60 30 Q68 45 80 48 Q70 50 60 65" fill={c[1]} opacity="0.6" />
      <line x1="60" y1="30" x2="60" y2="85" stroke={c[0]} strokeWidth="1.5" opacity="0.3" />
    </svg>
  ),
  // Zinc sheets
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      {[0, 15, 30, 45, 60, 75, 90, 105].map((x, i) => (
        <g key={i}>
          <rect x={x} y="10" width="14" height="100" fill={c[1]} opacity={0.2 + (i % 3) * 0.1} />
          <line x1={x + 7} y1="10" x2={x + 7} y2="110" stroke={c[0]} strokeWidth="0.5" opacity="0.3" />
        </g>
      ))}
    </svg>
  ),
  // Bicycle
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <circle cx="38" cy="72" r="20" fill="none" stroke={c[1]} strokeWidth="3" opacity="0.7" />
      <circle cx="82" cy="72" r="20" fill="none" stroke={c[1]} strokeWidth="3" opacity="0.7" />
      <path d="M38 72 L55 45 L75 45 L82 72 L55 45" fill="none" stroke={c[1]} strokeWidth="2.5" opacity="0.8" />
      <line x1="55" y1="45" x2="48" y2="35" stroke={c[1]} strokeWidth="2" opacity="0.6" />
      <line x1="43" y1="35" x2="53" y2="35" stroke={c[1]} strokeWidth="2" opacity="0.6" />
    </svg>
  ),
  // Chairs
  (c, size) => (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <rect width="120" height="120" fill={c[0]} />
      <rect x="35" y="30" width="30" height="35" rx="3" fill={c[1]} opacity="0.7" />
      <rect x="35" y="65" width="30" height="5" rx="1" fill={c[1]} opacity="0.5" />
      <rect x="37" y="70" width="4" height="22" fill={c[1]} opacity="0.5" />
      <rect x="59" y="70" width="4" height="22" fill={c[1]} opacity="0.5" />
      <rect x="60" y="35" width="25" height="30" rx="3" fill={c[1]} opacity="0.4" />
      <rect x="60" y="65" width="25" height="4" rx="1" fill={c[1]} opacity="0.3" />
    </svg>
  ),
];

export default function ItemImage({ index, size = 120, fotos }) {
  if (fotos && fotos.length > 0) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden", width: size, height: size, flexShrink: 0, background: "#f0ede8" }}>
        <img
          src={fotos[0]}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }
  const colors = ITEM_COLORS[index % ITEM_COLORS.length];
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", width: size, height: size, flexShrink: 0 }}>
      {patterns[index % patterns.length](colors, size)}
    </div>
  );
}
