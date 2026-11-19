import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCafe } from '../context/CafeContext.jsx';
import { defaultCustomization, describeCustomization, unitPrice } from '../utils/pricing.js';
import { money } from '../utils/format.js';
import { CloseIcon, MinusIcon, PlusIcon } from './Icons.jsx';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const MAX_QTY = 20;

function Section({ title, hint, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="m-0 font-sans text-sm font-semibold text-coffee">{title}</h4>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Stepper({ value, min, max, onChange, label }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border-[1.5px] border-line bg-white px-1.5 py-1">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="grid size-8 place-items-center rounded-full bg-parchment text-coffee disabled:opacity-40">
        <MinusIcon className="size-4" />
      </button>
      <span className="min-w-5 text-center font-semibold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="grid size-8 place-items-center rounded-full bg-parchment text-coffee disabled:opacity-40">
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

// Bottom sheet for customizing a drink before adding it to the cart.
// It is rendered into document.body (a portal) so the page's animation, header and
// bottom navigation can never sit on top of it or hide its "Add to cart" button.
export default function DrinkSheet({ item, onClose, onAdd }) {
  const { options, promos } = useCafe();
  const isCoffee = item.category === 'Coffee';
  const [c, setC] = useState(() => defaultCustomization(item));
  const [qty, setQty] = useState(1);
  const set = (patch) => setC((prev) => ({ ...prev, ...patch }));

  // Close on Escape and stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const each = unitPrice({ basePrice: item.price, customizable: true, category: item.category, customization: c }, options);
  const total = each * qty;
  const summary = describeCustomization(c);
  const hasBogo = promos.some((p) => p.type === 'bogo');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Customize ${item.name}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-130 flex-col rounded-t-3xl bg-cream shadow-lift"
      >
        <div className="flex flex-none items-start justify-between gap-3 p-4 pb-2">
          <div>
            <h2 className="m-0 text-xl">{item.name}</h2>
            <p className="m-0 text-sm text-muted">{item.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="grid size-9 flex-none place-items-center rounded-full bg-parchment text-coffee">
            <CloseIcon className="size-5" />
          </button>
        </div>

        {/* Only the options scroll; the Add button below always stays visible */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 pt-2">
          <Section title="Size">
            <div className="flex flex-wrap gap-2">
              {Object.entries(options.sizes).map(([size, extra]) => (
                <button key={size} type="button" onClick={() => set({ size })}
                  className={`chip ${c.size === size ? 'chip-active' : ''}`}>
                  {cap(size)}{extra > 0 && <span className="ml-1 text-xs opacity-80">+{extra}</span>}
                </button>
              ))}
            </div>
          </Section>

          {isCoffee && (
            <>
              <Section title="Milk">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(options.milks).map(([milk, extra]) => (
                    <button key={milk} type="button" onClick={() => set({ milk })}
                      className={`chip ${c.milk === milk ? 'chip-active' : ''}`}>
                      {cap(milk)}{extra > 0 && <span className="ml-1 text-xs opacity-80">+{extra}</span>}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Syrup" hint={`${money(options.syrupPumpPrice)} per pump`}>
                <div className="flex flex-wrap gap-2">
                  {['', ...options.syrups].map((s) => (
                    <button key={s || 'none'} type="button"
                      onClick={() => set({ syrup: s, syrupPumps: s ? c.syrupPumps || 1 : 0 })}
                      className={`chip ${c.syrup === s ? 'chip-active' : ''}`}>
                      {s ? cap(s) : 'None'}
                    </button>
                  ))}
                </div>
                {c.syrup && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pumps of {c.syrup}</span>
                    <Stepper label="syrup pumps" value={c.syrupPumps} min={1} max={options.maxSyrupPumps}
                      onChange={(v) => set({ syrupPumps: v })} />
                  </div>
                )}
              </Section>

              <Section title="Extra espresso shots" hint={`${money(options.extraShotPrice)} per shot`}>
                <Stepper label="extra shots" value={c.extraShots} min={0} max={options.maxExtraShots}
                  onChange={(v) => set({ extraShots: v })} />
              </Section>
            </>
          )}

          <Section title="Special requests">
            <textarea className="input" rows={2} maxLength={200} placeholder="Less ice, extra hot…"
              value={c.notes} onChange={(e) => set({ notes: e.target.value })} />
          </Section>

          <Section title="Quantity">
            <Stepper label="quantity" value={qty} min={1} max={MAX_QTY} onChange={setQty} />
            {hasBogo && qty === 1 && (
              <p className="m-0 text-xs text-muted">Buy one, get one free is applied in your cart.</p>
            )}
          </Section>
        </div>

        <div className="flex-none border-t border-line bg-cream p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {summary && <p className="mb-2 text-center text-xs text-muted">{summary}</p>}
          <button type="button" className="btn btn-gold w-full" onClick={() => onAdd(c, qty)}>
            Add to cart · {money(total)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}