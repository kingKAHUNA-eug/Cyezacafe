import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { errMsg, fmtDateTime, fmtTime, money } from '../utils/format.js';
import { describeCustomization } from '../utils/pricing.js';
import { beep, useInterval } from './ui.jsx';

const NEXT = { pending: ['preparing', 'Start preparing'], preparing: ['ready', 'Mark ready'], ready: ['completed', 'Mark collected'] };
const COLUMNS = [['pending', 'New'], ['preparing', 'Preparing'], ['ready', 'Ready']];
const PAY = { cash: 'Cash', mtn: 'MTN MoMo', airtel: 'Airtel Money', momo: 'MoMo', card: 'Card', wallet: 'Wallet' };
function Ticket({ o, busy, onAction }) {
  const where = o.type === 'table' ? `Table ${o.tableNumber}` : o.type === 'curbside' ? `Curbside${o.curbsideInfo ? ` · ${o.curbsideInfo}` : ''}` : 'Pickup';
  const next = NEXT[o.status];
  const open = ['pending', 'preparing', 'ready'].includes(o.status);
  return (
    <article className="card space-y-2 border-l-4 border-l-gold">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 font-bold">#{o.orderNumber}</p>
          <p className="m-0 text-sm text-muted">{o.user?.name} {o.user?.phone && `· ${o.user.phone}`}</p>
        </div>
        <div className="text-right">
          <span className="badge">{where}</span>
          <p className="m-0 mt-1 text-xs text-muted">{o.scheduledFor ? <strong className="text-danger">Scheduled {fmtTime(o.scheduledFor)}</strong> : `Placed ${fmtTime(o.createdAt)}`}</p>
        </div>
      </div>
      <ul className="m-0 list-none space-y-1 p-0 text-sm">
        {o.items.map((it, i) => (
          <li key={i}>
            <strong>{it.quantity} × {it.name}</strong>
            {describeCustomization(it.customization) && <span className="text-muted"> · {describeCustomization(it.customization)}</span>}
            {it.customization?.notes && <em className="block text-xs text-mocha">“{it.customization.notes}”</em>}
          </li>
        ))}
      </ul>
      {o.note && <p className="m-0 rounded-lg bg-gold/20 p-2 text-xs">Note: {o.note}</p>}
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-coffee">{money(o.total)}</span>
                <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-ready' : o.paymentStatus === 'submitted' ? 'badge-preparing' : 'badge-pending'}`}>
          {PAY[o.paymentMethod]} · {o.paymentStatus === 'submitted' ? 'customer says paid' : o.paymentStatus}
        </span>
      </div>
            {o.paymentRef && <p className="m-0 rounded-lg bg-gold/20 p-2 text-xs">Transaction ID to check: <strong className="tracking-wider">{o.paymentRef}</strong></p>}
      {open && (
        <div className="flex flex-wrap gap-2">
          {next && <button className="btn btn-sm flex-1" disabled={busy} onClick={() => onAction(o, { status: next[0] })}>{next[1]}</button>}
          {o.paymentStatus !== 'paid' && <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => onAction(o, { paymentStatus: 'paid' })}>Mark paid</button>}
          <button className="btn btn-outline btn-sm" disabled={busy}
            onClick={() => window.confirm(`Cancel order #${o.orderNumber}?`) && onAction(o, { status: 'cancelled' })}>Cancel</button>
        </div>
      )}
    </article>
  );
}

export default function AdminOrders() {
  const [active, setActive] = useState(null);
  const [done, setDone] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [sound, setSound] = useState(false);
  const [fresh, setFresh] = useState(0);
  const seen = useRef(null); // ids of pending orders we already know about
  const soundOn = useRef(false);
  soundOn.current = sound;

  const load = useCallback(async () => {
    try {
      const [a, d] = await Promise.all([
        api.get('/orders', { params: { status: 'pending,preparing,ready', limit: 100 } }),
        api.get('/orders', { params: { status: 'completed,cancelled', date: 'today', limit: 50 } }),
      ]);
      const pending = new Set(a.data.orders.filter((o) => o.status === 'pending').map((o) => o._id));
      if (seen.current) {
        const added = [...pending].filter((id) => !seen.current.has(id));
        if (added.length) { setFresh((n) => n + added.length); if (soundOn.current) beep(); }
      }
      seen.current = pending;
      setActive(a.data.orders);
      setDone(d.data.orders);
      setError('');
    } catch (e) { setError(errMsg(e)); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useInterval(load, 8000);

  const pendingCount = active?.filter((o) => o.status === 'pending').length || 0;
  useEffect(() => {
    const original = document.title;
    if (pendingCount) document.title = `(${pendingCount}) New orders · Cyeza Admin`;
    return () => { document.title = original; };
  }, [pendingCount]);

  const act = async (o, patch) => {
    setBusyId(o._id);
    try {
      await api.patch(`/orders/${o._id}`, patch);
      await load();
    } catch (e) { setError(errMsg(e)); } finally { setBusyId(''); }
  };

  const enableSound = () => { setSound(true); beep(); };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="m-0 text-2xl">Order board</h1>
        <div className="flex items-center gap-2">
          {fresh > 0 && <button className="badge badge-pending" onClick={() => setFresh(0)}>{fresh} new since you opened this page ✕</button>}
          <button className={`btn btn-sm ${sound ? 'btn-outline' : ''}`} onClick={sound ? () => setSound(false) : enableSound}>
            {sound ? 'Sound on · turn off' : 'Enable sound alerts'}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!active && !error && <div className="skeleton h-40" aria-busy="true" />}

      {active && (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map(([status, label]) => {
            const list = active.filter((o) => o.status === status)
              .sort((a, b) => new Date(a.scheduledFor || a.createdAt) - new Date(b.scheduledFor || b.createdAt));
            return (
              <section key={status} className="space-y-3" aria-label={label}>
                <h2 className="m-0 flex items-center justify-between text-lg">{label}<span className={`badge badge-${status}`}>{list.length}</span></h2>
                {list.length === 0 && <p className="m-0 rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">Nothing here</p>}
                {list.map((o) => <Ticket key={o._id} o={o} busy={busyId === o._id} onAction={act} />)}
              </section>
            );
          })}
        </div>
      )}

      <section className="card space-y-1">
        <h3 className="mb-1 text-base">Finished today ({done.length})</h3>
        {done.length === 0 && <p className="m-0 text-sm text-muted">No finished orders yet today.</p>}
        {done.map((o) => (
          <div key={o._id} className="flex items-center justify-between gap-2 border-b border-line py-2 text-sm last:border-0">
            <span>#{o.orderNumber} · {o.user?.name}</span>
            <span className="flex items-center gap-2"><span className="text-muted">{fmtDateTime(o.createdAt)}</span><span className="font-semibold">{money(o.total)}</span><span className={`badge badge-${o.status}`}>{o.status}</span></span>
          </div>
        ))}
      </section>
    </div>
  );
}