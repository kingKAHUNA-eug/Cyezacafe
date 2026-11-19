import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { errMsg, money } from '../utils/format.js';

const GIFT_STATUS = { pending_payment: ['Awaiting payment', 'badge-pending'], active: ['Ready to use', 'badge-ready'], redeemed: ['Redeemed', 'badge-completed'] };
const PASS_STATUS = { pending_payment: ['Awaiting payment', 'badge-pending'], active: ['Active', 'badge-ready'], expired: ['Finished', 'badge-completed'], cancelled: ['Cancelled', 'badge-cancelled'] };
const passId = (s) => s._id.slice(-6).toUpperCase();

export default function AdminGiftsPasses() {
  const [tab, setTab] = useState('gifts');
  const [gifts, setGifts] = useState(null);
  const [passes, setPasses] = useState(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([api.get('/gifts'), api.get('/subscriptions')])
      .then(([g, s]) => { setGifts(g.data.gifts); setPasses(s.data.subscriptions); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => { try { await fn(); load(); } catch (e) { setError(errMsg(e)); } };

  const needle = q.trim().toLowerCase();
  const shownPasses = passes?.filter((s) => !needle || `${s.user?.name} ${s.user?.phone} ${passId(s)}`.toLowerCase().includes(needle));

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-2xl">Gifts &amp; coffee passes</h1>
      <div className="flex gap-2" role="tablist">
        {[['gifts', 'Gifts'], ['passes', 'Coffee passes']].map(([v, l]) => <button key={v} role="tab" aria-selected={tab === v} className={`chip ${tab === v ? 'chip-active' : ''}`} onClick={() => setTab(v)}>{l}</button>)}
      </div>
      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      {tab === 'gifts' && (
        <div className="card divide-y divide-line py-1">
          {!gifts && <div className="skeleton h-24" />}
          {gifts?.length === 0 && <p className="m-0 p-4 text-center text-muted">No gifts yet.</p>}
          {gifts?.map((g) => (
            <div key={g._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="m-0 font-semibold">{g.kind === 'coffee' ? g.itemName : money(g.amount)} for {g.recipientName}</p>
                <p className="m-0 text-xs text-muted">From {g.sender?.name} {g.sender?.phone && `(${g.sender.phone})`} · {g.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${GIFT_STATUS[g.status][1]}`}>{GIFT_STATUS[g.status][0]}</span>
                {g.status === 'pending_payment' && <button className="btn btn-gold btn-sm" onClick={() => run(() => api.patch(`/gifts/${g._id}/activate`))}>Confirm payment</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'passes' && (
        <>
          <input className="input max-w-sm" type="search" placeholder="Find by customer name, phone or pass ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search passes" />
          <div className="card divide-y divide-line py-1">
            {!passes && <div className="skeleton h-24" />}
            {shownPasses?.length === 0 && <p className="m-0 p-4 text-center text-muted">No passes found.</p>}
            {shownPasses?.map((s) => (
              <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="m-0 font-semibold">{s.name} · {s.user?.name} <span className="text-xs text-muted">({s.user?.phone || s.user?.email})</span></p>
                  <p className="m-0 text-xs text-muted">Pass ID {passId(s)} · {s.drinksRemaining}/{s.drinksTotal} coffees left{s.expiresAt ? ` · until ${new Date(s.expiresAt).toLocaleDateString('en-GB')}` : ''} · {money(s.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${PASS_STATUS[s.status][1]}`}>{PASS_STATUS[s.status][0]}</span>
                  {s.status === 'pending_payment' && <button className="btn btn-gold btn-sm" onClick={() => run(() => api.patch(`/subscriptions/${s._id}/activate`))}>Confirm payment</button>}
                  {s.status === 'active' && <button className="btn btn-sm" onClick={() => run(() => api.post(`/subscriptions/${s._id}/redeem`))}>Use 1 coffee</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}