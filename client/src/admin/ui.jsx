import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Run `fn` every `ms` milliseconds (always calls the latest version of fn).
export function useInterval(fn, ms) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; });
  useEffect(() => {
    const t = setInterval(() => saved.current(), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function Stat({ label, value, hint }) {
  return (
    <div className="card">
      <p className="m-0 text-sm text-muted">{label}</p>
      <p className="m-0 font-head text-3xl font-semibold text-coffee">{value}</p>
      {hint && <p className="m-0 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// Centered dialog, rendered in <body> so nothing can sit on top of it.
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 shadow-lift">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-2xl leading-none text-muted">×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// Two-tone chime for new orders. Browsers only allow sound after a click,
// so the first call must come from the "Enable sound" button.
let audio;
export function beep() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    [880, 1175].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(audio.destination);
      const t = audio.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  } catch { /* sound is optional */ }
}