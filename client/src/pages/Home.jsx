import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCafe } from '../context/CafeContext.jsx';
import { greeting, money } from '../utils/format.js';
import { LogoMark } from '../components/Logo.jsx';

const LINKS = [
  { to: '/gifts', label: 'Gifts', emoji: '🎁' },
  { to: '/passport', label: 'Bean Passport', emoji: '📖' },
  { to: '/passes', label: 'Coffee passes', emoji: '🎟️' },
];

export default function Home() {
  const { user } = useAuth();
  const { cafe, promos } = useCafe();
  const [featured, setFeatured] = useState([]);
  const [rewards, setRewards] = useState(null);
  const firstName = user?.name?.split(' ')[0];

  useEffect(() => {
    api.get('/menu', { params: { featured: true } }).then((r) => setFeatured(r.data.items || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (!user) { setRewards(null); return; }
    api.get('/rewards').then((r) => setRewards(r.data)).catch(() => {});
  }, [user]);

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <div>
        <h1 className="text-2xl">{greeting()}{firstName ? `, ${firstName}` : ''}</h1>
        <p className="text-muted">What can we make for you today?</p>
      </div>

      {promos.map((p) => (
        <section key={p.id} className="card card-dark">
          <span className="badge mb-2 bg-gold text-espresso">Grand Opening</span>
          <h2 className="text-2xl">{p.name}</h2>
          <p className="mb-3 text-cream/90">{p.description}</p>
          <Link to="/menu" className="btn btn-gold">Order now</Link>
        </section>
      ))}

      {rewards && (
        <Link to="/rewards" className="card block space-y-2 text-ink">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{rewards.points} points · {rewards.tier}</span>
            <span className="text-sm font-semibold text-mocha">Rewards ›</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-parchment" role="progressbar" aria-valuenow={rewards.punches} aria-valuemin={0} aria-valuemax={rewards.punchTarget} aria-label="Coffee punch card">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(rewards.punches / rewards.punchTarget) * 100}%` }} />
          </div>
          <p className="m-0 text-sm text-muted">
            {rewards.freeDrinks > 0
              ? `You have ${rewards.freeDrinks} free coffee${rewards.freeDrinks > 1 ? 's' : ''} waiting!`
              : `${rewards.punchTarget - rewards.punches} more coffee${rewards.punchTarget - rewards.punches === 1 ? '' : 's'} until a free one.`}
          </p>
        </Link>
      )}

      {featured.length > 0 && (
        <section className="space-y-2">
          <h2 className="m-0 text-xl">Popular today</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {featured.map((i) => (
              <Link key={i._id} to="/menu" className="card flex w-40 flex-none flex-col gap-2 p-3 text-ink">
                <div className="grid h-20 place-items-center rounded-xl bg-linear-to-br from-coffee to-espresso">
                  <LogoMark tone="light" className="size-10" />
                </div>
                <span className="font-semibold leading-tight">{i.name}</span>
                <span className="text-sm font-bold text-coffee">{money(i.price)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 gap-2">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="card flex flex-col items-center gap-1 p-3 text-center text-xs font-semibold text-coffee">
            <span className="text-2xl" aria-hidden="true">{l.emoji}</span>{l.label}
          </Link>
        ))}
      </div>

      <section className="card">
        <h3 className="text-lg">Visit us</h3>
        <p className="mb-1 text-sm text-muted">{cafe.location.area}, {cafe.location.landmark} · {cafe.location.street}</p>
        <p className="m-0 text-sm text-muted">Open every day, {cafe.hours.label}</p>
      </section>
    </main>
  );
}