import { assetUrl, money } from '../utils/format.js';
import { LogoMark } from './Logo.jsx';
import { HeartIcon, PlusIcon } from './Icons.jsx';

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

export default function MenuCard({ item, favorite, onToggleFavorite, onAdd }) {
  const detail = item.category === 'Coffee' && item.brewMethod ? cap(item.brewMethod.replace('-', ' ')) : '';

  return (
    <article className="card flex gap-3 p-3">
      {item.image ? (
        <img src={assetUrl(item.image)} alt={item.name} loading="lazy" className="size-24 flex-none rounded-xl object-cover" />
      ) : (
        <div className="grid size-24 flex-none place-items-center rounded-xl bg-linear-to-br from-coffee to-espresso">
          <LogoMark tone="light" className="size-12 opacity-90" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-base leading-snug">{item.name}</h3>
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            aria-label={favorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
            aria-pressed={favorite}
            className={`-mt-1 -mr-1 p-1 ${favorite ? 'text-danger' : 'text-muted'}`}
          >
            <HeartIcon filled={favorite} className="size-5" />
          </button>
        </div>

        <p className="m-0 line-clamp-2 text-sm text-muted">{item.description}</p>
        {(detail || item.featured) && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {item.featured && <span className="badge bg-gold/25">Popular</span>}
            {detail && <span className="badge">{detail}</span>}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-coffee">{money(item.price)}</span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            aria-label={`Add ${item.name}`}
            className="grid size-9 place-items-center rounded-full bg-gold text-espresso transition hover:bg-gold-light active:scale-90"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}