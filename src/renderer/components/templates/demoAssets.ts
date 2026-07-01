/**
 * Inline demo assets (no files, offline) used to preview a template before any
 * real session exists. Clearly synthetic — labelled "DEMO".
 */
export const DEMO_PHOTO_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#18543a"/><stop offset="1" stop-color="#0b2418"/>
      </linearGradient></defs>
      <rect width="600" height="900" fill="url(#g)"/>
      <circle cx="300" cy="330" r="120" fill="#c9a24a" opacity="0.85"/>
      <rect x="150" y="520" width="300" height="240" rx="40" fill="#c9a24a" opacity="0.85"/>
      <text x="300" y="850" font-family="serif" font-size="64" fill="#f4efe2" text-anchor="middle">DEMO</text>
    </svg>`
  );

export const DEMO_QR_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#f4efe2"/>
      <g fill="#08130d">
        <rect x="8" y="8" width="24" height="24"/><rect x="68" y="8" width="24" height="24"/>
        <rect x="8" y="68" width="24" height="24"/>
        <rect x="40" y="8" width="8" height="8"/><rect x="52" y="20" width="8" height="8"/>
        <rect x="40" y="40" width="20" height="20"/><rect x="68" y="44" width="8" height="8"/>
        <rect x="80" y="56" width="8" height="8"/><rect x="44" y="72" width="8" height="8"/>
        <rect x="60" y="68" width="8" height="8"/><rect x="72" y="80" width="12" height="12"/>
      </g>
    </svg>`
  );
