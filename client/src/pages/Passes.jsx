import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, money } from '../utils/format.js';

const STATUS = {
  pending_payment: ['Awaiting payment', 'badge-pending'],
  active: ['Active', 'badge-ready'],
  expired: ['Used up or expired', 'badge-completed'],
  cancelled: ['Cancelled', 'badge-cancelled'],
};
const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Passes() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [mine, setMine] = useState(null);
  const [pay, setPay] = useState('cash');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(
    () => Promise.all([api.get('/subscriptions/plans'), api.get('/subscriptions/mine')])
      .then(([p, m]) => { setPlans(p.data.plans); setMine(m.data.subscriptions); })
      .catch((e) => setError(errMsg(e, 'Could not load coffee passes.'))),
    []
  );
  useEffect(() => { load(); }, [load]);

  const buy = async (plan) => {
    setBusy(plan.id); setMsg(''); setError('');
    try {
      const { data } = await api.post('/subscriptions', { plan: plan.id, paymentMethod: pay });
      setMsg(data.subscription.status === 'active'
        ? `${plan.name} is active. Enjoy!`
        : `${plan.name} reserved. Pay at the counter and our staff will activate it.`);
      if (pay === 'wallet') refreshUser().catch(() => {});
      await load();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(''); }
  };

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <h1 className="text-2xl">Coffee passes</h1>
      <p className="m-0 text-muted">Prepay for your daily coffee and save. Show your pass ID at the counter.</p>

      <div className="flex gap-2">
        <button type="button" onClick={() => setPay('cash')} className={`chip ${pay === 'cash' ? 'chip-active' : ''}`}>Pay at the counter</button>
        <button type="button" onClick={() => setPay('wallet')} className={`chip ${pay === 'wallet' ? 'chip-active' : ''}`}>Wallet ({money(user?.wallet)})</button>
      </div>

      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {msg && <p role="status" className="m-0 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">{msg}</p>}

      {plans.map((p) => (
        <section key={p.id} className="card card-dark space-y-2">
          <div className="flex items-start justify-between">
            <h2 className="m-0 text-xl">{p.name}</h2>
            <span className="font-head text-xl text-gold-light">{money(p.price)}</span>
          </div>
          <p className="m-0 text-cream/90">{p.description}</p>
          <p className="m-0 text-sm text-cream/70">That is {money(Math.round(p.price / p.drinks))} per coffee.</p>
          <button className="btn btn-gold w-full" disabled={busy === p.id} onClick={() => buy(p)}>
            {busy === p.id ? 'Please wait…' : 'Get this pass'}
          </button>
        </section>
      ))}

      <section className="space-y-3">
        <h2 className="m-0 text-xl">Your passes</h2>
        {mine && mine.length === 0 && <p className="m-0 text-sm text-muted">You have no passes yet.</p>}
        {mine?.map((s) => (
          <article key={s._id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="m-0 text-base">{s.name}</h3>
              <span className={`badge ${STATUS[s.status][1]}`}>{STATUS[s.status][0]}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-parchment" role="progressbar" aria-valuenow={s.drinksRemaining} aria-valuemin={0} aria-valuemax={s.drinksTotal} aria-label="Coffees left">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(s.drinksRemaining / s.drinksTotal) * 100}%` }} />
            </div>
            <p className="m-0 text-sm">{s.drinksRemaining} of {s.drinksTotal} coffees left{s.expiresAt ? ` · valid until ${date(s.expiresAt)}` : ''}</p>
            <p className="m-0 text-xs text-muted">Pass ID: <strong className="tracking-wider">{s._id.slice(-6).toUpperCase()}</strong></p>
          </article>
        ))}
      </section>
    </main>
  );
}