import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { errMsg, money } from '../utils/format.js';
import { CupIcon, StarIcon } from '../components/Icons.jsx';

export default function Rewards() {
  const [r, setR] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.get('/rewards')
      .then((res) => setR(res.data))
      .catch((err) => setError(errMsg(err, 'Could not load your rewards.')));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <main className="p-4">
        <div className="card space-y-3 text-center">
          <p className="m-0 text-danger">{error}</p>
          <button className="btn" onClick={load}>Try again</button>
        </div>
      </main>
    );
  }
  if (!r) {
    return (
      <main className="space-y-4 p-4" aria-busy="true">
        <div className="skeleton h-40" />
        <div className="skeleton h-48" />
      </main>
    );
  }

  const left = r.punchTarget - r.punches;
  const nextProgress = r.nextTier ? Math.round((r.totalSpent / (r.totalSpent + r.nextTier.remaining)) * 100) : 100;

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <h1 className="text-2xl">Rewards</h1>

      {/* Tier and points */}
      <section className="card card-dark space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-sm text-cream/70">Your points</p>
            <p className="m-0 font-head text-4xl font-semibold text-gold-light">{r.points}</p>
          </div>
          <span className="badge bg-gold text-espresso">{r.tier} member</span>
        </div>
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20" role="progressbar"
            aria-valuenow={nextProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next tier">
            <div className="h-full rounded-full bg-gold" style={{ width: `${nextProgress}%` }} />
          </div>
          <p className="mt-1.5 mb-0 text-sm text-cream/80">
            {r.nextTier
              ? `Spend ${money(r.nextTier.remaining)} more to reach ${r.nextTier.name}.`
              : 'You have reached our top tier. Thank you!'}
          </p>
        </div>
      </section>

      {r.freeDrinks > 0 && (
        <section className="space-y-2 rounded-2xl bg-success/10 p-4">
          <p className="m-0 flex items-center gap-2 font-semibold text-success">
            <StarIcon className="size-5" />
            You have {r.freeDrinks} free coffee{r.freeDrinks > 1 ? 's' : ''}!
          </p>
          <p className="m-0 text-sm text-ink">Choose “Use a free coffee” in your cart when you order.</p>
          <Link to="/menu" className="btn btn-sm">Order now</Link>
        </section>
      )}

      {/* Punch card */}
      <section className="card space-y-3">
        <h3 className="m-0 text-lg">Coffee punch card</h3>
        <div className="grid grid-cols-5 gap-2" aria-label={`${r.punches} of ${r.punchTarget} coffees collected`}>
          {Array.from({ length: r.punchTarget }, (_, i) => {
            const filled = i < r.punches;
            const last = i === r.punchTarget - 1;
            return (
              <div key={i} className={`grid aspect-square place-items-center rounded-full border-2 text-xs font-bold ${
                filled ? 'border-gold bg-gold text-espresso' : 'border-dashed border-line text-muted'
              }`}>
                {last && !filled ? 'FREE' : <CupIcon className="size-5" />}
              </div>
            );
          })}
        </div>
        <p className="m-0 text-sm text-muted">
          {left === 1 ? '1 more coffee until your next free one.' : `${left} more coffees until your next free one.`}
        </p>
      </section>

      {/* Wallet */}
      <section className="card flex items-center justify-between">
        <div>
          <p className="m-0 text-sm text-muted">Wallet balance</p>
          <p className="m-0 text-xl font-bold text-coffee">{money(r.wallet)}</p>
        </div>
        <Link to="/gifts" className="btn btn-outline btn-sm">Redeem a gift code</Link>
      </section>

      <section className="card space-y-1 text-sm">
        <h3 className="mb-1 text-base">How it works</h3>
        <p className="m-0">• Earn 1 point for every {r.rwfPerPoint} RWF you spend.</p>
        <p className="m-0">• Every coffee you collect adds a punch. Every {r.punchTarget}th coffee is free.</p>
        <p className="m-0">• Points and punches are added when you collect your order.</p>
      </section>
    </main>
  );
}