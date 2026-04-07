import { useState } from 'react';

export default function StarRating({ value = 0, onChange, size = 18, showEmpty = true }) {
  const [hovered, setHovered] = useState(null);
  const interactive = !!onChange;
  const display = hovered ?? value;

  return (
    <div
      style={{ display: "inline-flex", gap: 2, lineHeight: 1 }}
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(display);
        if (!showEmpty && !filled) return null;
        return (
          <span
            key={star}
            onMouseEnter={() => interactive && setHovered(star)}
            onClick={() => interactive && onChange(star)}
            style={{
              fontSize: size,
              color: filled ? "#F4B942" : "#ddd8d0",
              cursor: interactive ? "pointer" : "default",
              transition: "color 0.1s, transform 0.1s",
              transform: interactive && hovered === star ? "scale(1.2)" : "scale(1)",
              display: "inline-block",
              userSelect: "none",
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

// Returns the numeric average and count from a reviews array
export function calcRating(reviews) {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return { avg: sum / reviews.length, count: reviews.length };
}
