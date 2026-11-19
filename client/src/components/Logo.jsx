// Cyeza Café logo, recreated as a vector from the opening poster.
// tone="dark"  -> for light backgrounds (espresso text, gold steam)
// tone="light" -> for dark backgrounds  (cream text, gold steam)

const TONES = {
  dark: { main: '#2a170e', accent: '#c9a14a' },
  light: { main: '#fbf5ea', accent: '#e3c377' },
};

const HEAD_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Inter', system-ui, sans-serif";

// Just the cup and steam, used for small icons (navbar, favicon style uses)
export function LogoMark({ tone = 'dark', ...props }) {
  const { main, accent } = TONES[tone];
  const steam = 'M21 26c-4-4 4-7 0-11s0-6 0-9';
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" {...props}>
      <g stroke={accent} strokeWidth="2.6" strokeLinecap="round">
        <path d={steam} />
        <path d={steam} transform="translate(9 -3)" />
        <path d={steam} transform="translate(18 0)" />
      </g>
      <path d="M14 31h32v7a16 16 0 0 1-16 16h0a16 16 0 0 1-16-16z" fill={main} />
      <path d="M46 34h3a6.5 6.5 0 0 1 0 13h-5" stroke={main} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M9 58h42" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Full logo: mark, CYEZA wordmark and CAFÉ line
export default function Logo({ tone = 'dark', className = '', title = 'Cyeza Café' }) {
  const { main, accent } = TONES[tone];
  return (
    <svg viewBox="0 0 240 150" role="img" aria-label={title} className={className}>
      <LogoMark tone={tone} x="88" y="0" width="64" height="64" />
      <text
        x="120"
        y="108"
        textAnchor="middle"
        fontFamily={HEAD_FONT}
        fontSize="46"
        fontWeight="600"
        letterSpacing="5"
        fill={main}
      >
        CYEZA
      </text>
      <g stroke={accent} strokeWidth="1.6" strokeLinecap="round">
        <path d="M34 134h44" />
        <path d="M166 134h44" />
      </g>
      <text
        x="122"
        y="139"
        textAnchor="middle"
        fontFamily={BODY_FONT}
        fontSize="14"
        fontWeight="600"
        letterSpacing="5"
        fill={accent}
      >
        CAFÉ
      </text>
    </svg>
  );
}