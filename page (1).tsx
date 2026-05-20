export function FslLogo({ size = 48, dark = false }: { size?: number; dark?: boolean }) {
  const primary = dark ? '#0A0A0A' : '#C9A84C'
  const bg = dark ? '#F5EDD6' : '#1A1400'
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(80,80)">
        <g>
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x="-7" y="-72" width="14" height="10" rx="2" fill={primary}
              transform={i === 0 ? undefined : `rotate(${i * 20})`} />
          ))}
        </g>
        <ellipse cx="0" cy="0" rx="60" ry="56" fill={bg} />
        <g opacity="0.18" stroke={primary} strokeWidth="0.6" fill="none">
          <ellipse cx="0" cy="0" rx="56" ry="56" />
          <ellipse cx="0" cy="0" rx="38" ry="56" />
          <ellipse cx="0" cy="0" rx="20" ry="56" />
          <line x1="-56" y1="0" x2="56" y2="0" />
          <line x1="-54" y1="-20" x2="54" y2="-20" />
          <line x1="-48" y1="-38" x2="48" y2="-38" />
          <line x1="-54" y1="20" x2="54" y2="20" />
          <line x1="-48" y1="38" x2="48" y2="38" />
        </g>
        <ellipse cx="0" cy="0" rx="60" ry="56" fill="none" stroke={primary} strokeWidth="1.5" opacity="0.7" />
        <text x="0" y="12" textAnchor="middle" fontFamily="Georgia, serif" fontSize="34" fontWeight="700" fill={primary} letterSpacing="2">FSL</text>
        <line x1="-32" y1="18" x2="32" y2="18" stroke={primary} strokeWidth="0.8" opacity="0.5" />
        <text x="0" y="29" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="5" fill={primary} letterSpacing="3" opacity="0.8">FORMULA SERIES</text>
      </g>
    </svg>
  )
}
