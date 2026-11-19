import Logo from './Logo.jsx';

// Full-screen loader: a hot cup of coffee with rising steam.
export default function LoadingScreen({ message = 'Brewing your experience…' }) {
  const wisp = (x, delay) => (
    <path
      key={x}
      className="steam-wisp"
      style={{ animationDelay: `${delay}s` }}
      d={`M${x} 62c-7-8 7-14 0-22s7-14 0-20`}
      stroke="#fbf5ea"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-espresso px-6"
    >
      <svg viewBox="0 0 150 165" className="w-44 drop-shadow-[0_10px_30px_rgba(242,178,74,0.25)]" aria-hidden="true">
        <defs>
          <radialGradient id="heat" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f2b24a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f2b24a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbf5ea" />
            <stop offset="100%" stopColor="#e6d5b8" />
          </linearGradient>
        </defs>

        {/* warm glow behind the cup */}
        <circle className="heat-glow" cx="70" cy="95" r="62" fill="url(#heat)" />

        {/* steam */}
        {wisp(50, 0)}
        {wisp(70, 0.9)}
        {wisp(90, 1.7)}

        {/* handle */}
        <path d="M110 92h8a14 14 0 0 1 0 28h-12" stroke="#e6d5b8" strokeWidth="7" strokeLinecap="round" fill="none" />

        {/* cup body */}
        <path d="M30 80H110V100A40 38 0 0 1 30 100Z" fill="url(#cupBody)" />

        {/* rim and hot coffee surface */}
        <ellipse cx="70" cy="80" rx="40" ry="9" fill="#f3e6cf" />
        <ellipse cx="70" cy="81" rx="36" ry="6.5" fill="#3a1d0e" />
        <ellipse className="coffee-surface" cx="66" cy="80" rx="20" ry="3" fill="#7a4b2e" opacity="0.8" />

        {/* saucer */}
        <ellipse cx="70" cy="142" rx="54" ry="8" fill="#c9a14a" />
        <ellipse cx="70" cy="140" rx="40" ry="5" fill="#e3c377" />
      </svg>

      <Logo tone="light" className="w-48" />

      <div className="flex items-center gap-2 text-sm text-cream/80">
        <span>{message}</span>
        <span className="flex gap-1" aria-hidden="true">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-1.5 animate-bounce rounded-full bg-gold"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}