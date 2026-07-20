// Ícono oficial de marca Ococa Enganchado (economía circular + gancho central)
export default function BrandIcon({ size = 40, background = true, dark = false, radius = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {background && (
        <rect x="0" y="0" width="200" height="200" rx={radius} fill={dark ? '#1A2A3A' : '#B0D0E0'} />
      )}
      <circle cx="100" cy="100" r="90" fill="none" stroke="#B0D0E0" strokeWidth="3" />

      <path d="M 100 42 A 58 58 0 0 1 157.77929248932125 105.05503307936418 L 135.86300913130285 103.1376067389157 A 36 36 0 0 0 100 64 Z" fill="#2C4778" opacity="0.92" />
      <path d="M 146.13647762204022 108.9680227826976 L 167.9896432706346 101.18676363773528 L 125.99604007406617 100.45376256736937 Z" fill="#2C4778" opacity="0.92" />

      <path d="M 150.22947341949745 129 A 58 58 0 0 1 66.73256669163933 147.51081856876152 L 79.35124829136235 129.4894735944037 A 36 36 0 0 0 131.1769145362398 118 Z" fill="#789963" opacity="0.92" />
      <path d="M 69.16522563744616 135.47135027047028 L 64.97741090611632 158.28737644774364 L 86.60901005233859 122.28634981825492 Z" fill="#789963" opacity="0.92" />

      <path d="M 49.770526580502555 129 A 58 58 0 0 1 75.4881408190394 47.43414835187431 L 84.7857425773348 67.37291966668062 A 36 36 0 0 0 68.82308546376021 118 Z" fill="#467098" opacity="0.92" />
      <path d="M 84.69829674051364 55.56062694683211 L 67.0329458232491 40.52585991452108 L 87.39494987359524 77.25988761437571 Z" fill="#467098" opacity="0.92" />

      <circle cx="100" cy="100" r="26" fill="white" />
      <circle cx="102" cy="79" r="6.5" fill="white" stroke="#BB4036" strokeWidth="4.5" />
      <path d="M 102 107 C 102 119, 96 123, 90 119 C 84 115, 84 107, 88 101" fill="none" stroke="#BB4036" strokeWidth="6" strokeLinecap="round" />
      <path d="M 88 101 L 82 94 L 86.5 100" fill="#BB4036" stroke="#BB4036" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      <circle cx="100" cy="24" r="4.2" fill="#A96B49" />
      <circle cx="165.81793068761735" cy="138" r="4.2" fill="#A96B49" />
      <circle cx="34.18206931238265" cy="138" r="4.2" fill="#A96B49" />
    </svg>
  );
}
