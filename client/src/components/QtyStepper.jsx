import { MinusIcon, PlusIcon } from './Icons.jsx';

// Small - 1 + control. Going below 1 calls onChange(0) so the caller can remove the line.
export default function QtyStepper({ value, onChange, label, max = 20 }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-1 py-0.5">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(value - 1)}
        className="grid size-7 place-items-center rounded-full bg-parchment text-coffee">
        <MinusIcon className="size-4" />
      </button>
      <span className="min-w-4 text-center text-sm font-semibold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}
        className="grid size-7 place-items-center rounded-full bg-parchment text-coffee disabled:opacity-40">
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}