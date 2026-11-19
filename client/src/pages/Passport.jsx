import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { errMsg } from '../utils/format.js';

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function Stars({ value, onChange, name }) {
  return (
    <div className="flex gap-0.5" role="group" aria-label={`Rating for ${name}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`Rate ${name} ${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)} className={`text-2xl leading-none ${n <= (value || 0) ? 'text-gold' : 'text-line'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function Entry({ entry, onSaved }) {
  const [notes, setNotes] = useState(entry.notes || '');
  const save = async (patch) => {
    try {
      const { data } = await api.patch(`/passport/${entry._id}`, patch);
      onSaved(data.entry);
    } catch { /* keep what the user typed */ }
  };
  const meta = [cap(entry.brewMethod?.replace('-', ' ')), entry.origin, entry.roast && `${cap(entry.roast)} roast`].filter(Boolean).join(' · ');
  return (
    <article className="card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-base">{entry.name}</h3>
          {meta && <p className="m-0 text-sm text-muted">{meta}</p>}
        </div>
        <span className="badge">{entry.timesTried}× · {day(entry.lastTriedAt)}</span>
      </div>
      <Stars name={entry.name} value={entry.rating} onChange={(n) => save({ rating: n })} />
      <input className="input" placeholder="Tasting notes (fruity, chocolatey…)" maxLength={300} value={notes}
        aria-label={`Tasting notes for ${entry.name}`} onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== (entry.notes || '') && save({ notes })} />
    </article>
  );
}

export default function Passport() {
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    Promise.all([api.get('/passport'), api.get('/menu')])
      .then(([p, m]) => { setData(p.data); setMenu(m.data.items); })
      .catch((e) => setError(errMsg(e, 'Could not load your passport.')));
  }, []);
  useEffect(() => { load(); }, [load]);

  const replace = (entry) => setData((d) => ({ ...d, entries: d.entries.map((e) => (e._id === entry._id ? entry : e)) }));

  if (error) return <main className="p-4"><div className="card space-y-3 text-center"><p className="m-0 text-danger">{error}</p><button className="btn" onClick={load}>Try again</button></div></main>;
  if (!data) return <main className="space-y-4 p-4" aria-busy="true"><div className="skeleton h-32" /><div className="skeleton h-40" /></main>;

  const tried = new Set(data.entries.map((e) => String(e.menuItem)));
  const toTry = menu.filter((i) => i.category === 'Coffee' && !tried.has(String(i._id)));

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <h1 className="text-2xl">Bean Passport</h1>

      <section className="card card-dark flex justify-around text-center">
        <div><p className="m-0 font-head text-3xl text-gold-light">{data.stats.coffeesTried}</p><p className="m-0 text-sm text-cream/80">coffees tried</p></div>
        <div><p className="m-0 font-head text-3xl text-gold-light">{data.stats.totalCups}</p><p className="m-0 text-sm text-cream/80">cups enjoyed</p></div>
      </section>

      <section className="space-y-2">
        <h2 className="m-0 text-xl">Badges</h2>
        <div className="grid grid-cols-2 gap-2">
          {data.badges.map((b) => (
            <div key={b.id} className={`rounded-xl border-[1.5px] p-3 text-sm font-semibold ${b.earned ? 'border-gold bg-gold/25 text-coffee' : 'border-line bg-white text-muted opacity-70'}`}>
              {b.earned ? '✓ ' : '🔒 '}{b.label}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="m-0 text-xl">Your coffees</h2>
        {data.entries.length === 0 ? (
          <div className="card space-y-3 py-8 text-center">
            <p className="m-0 text-muted">Collect your first coffee and it will be stamped here.</p>
            <Link to="/menu" className="btn mx-auto">Order a coffee</Link>
          </div>
        ) : data.entries.map((e) => <Entry key={e._id} entry={e} onSaved={replace} />)}
      </section>

      {toTry.length > 0 && (
        <section className="card space-y-2">
          <h3 className="m-0 text-base">Still to try</h3>
          <div className="flex flex-wrap gap-2">
            {toTry.map((i) => <Link key={i._id} to="/menu" className="chip">{i.name}</Link>)}
          </div>
        </section>
      )}
    </main>
  );
}