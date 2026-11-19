import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { errMsg, money } from '../utils/format.js';
import { Stat, useInterval } from './ui.jsx';

const TZ = 'Africa/Kigali';
const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // 2026-11-05
const dayName = (d) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: TZ }).format(d);

// The server only returns days that had orders, so fill the gaps with zeros.
function lastSevenDays(rows) {
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const r = byDate.get(dayKey(d));
    return { key: dayKey(d), label: dayName(d), revenue: r?.revenue || 0, orders: r?.orders || 0 };
  });
}

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    api.get('/admin/stats').then((r) => { setS(r.data); setError(''); }).catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(() => { load(); }, [load]);
  useInterval(load, 30000);

  if (error && !s) return <div className="card space-y-3 text-center"><p className="m-0 text-danger">{error}</p><button className="btn" onClick={load}>Try again</button></div>;
  if (!s) return <div className="skeleton h-40" aria-busy="true" />;

  const days = lastSevenDays(s.last7Days);
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const topMax = Math.max(1, ...s.topItems.map((t) => t.quantity));
  const by = s.todayByStatus;

  return (
    <div className="animate-fade-in space-y-4">
      <h1 className="text-2xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales today" value={money(s.today.revenue)} hint={`${s.today.orders} order${s.today.orders === 1 ? '' : 's'}`} />
        <Stat label="Orders today" value={s.today.orders} hint={`${by.completed || 0} collected`} />
        <Link to="/admin/orders" className="card block text-ink">
          <p className="m-0 text-sm text-muted">Open orders now</p>
          <p className="m-0 font-head text-3xl font-semibold text-coffee">{s.openOrders}</p>
          <p className="m-0 text-xs font-semibold text-mocha">Open the order board ›</p>
        </Link>
        <Stat label="Customers" value={s.customers} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h3 className="mb-3 text-base">Sales, last 7 days</h3>
          <div className="flex h-44 items-end gap-2" role="img" aria-label="Bar chart of daily sales">
            {days.map((d, i) => (
              <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-muted">{d.revenue ? d.revenue.toLocaleString('en-US') : ''}</span>
                <div className={`w-full rounded-t-md ${i === 6 ? 'bg-gold' : 'bg-mocha/70'}`}
                  style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} title={`${d.orders} orders`} />
                <span className="text-xs font-medium">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card space-y-3">
          <h3 className="m-0 text-base">Top sellers (30 days)</h3>
          {s.topItems.length === 0 && <p className="m-0 text-sm text-muted">No sales yet.</p>}
          {s.topItems.map((t) => (
            <div key={t.name} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{t.name}</span><span className="font-semibold">{t.quantity}</span></div>
              <div className="h-1.5 rounded-full bg-parchment"><div className="h-full rounded-full bg-gold" style={{ width: `${(t.quantity / topMax) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      </div>

      <section className="card">
        <h3 className="mb-2 text-base">Today by status</h3>
        <div className="flex flex-wrap gap-2">
          {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((k) => (
            <span key={k} className={`badge badge-${k}`}>{k}: {by[k] || 0}</span>
          ))}
        </div>
      </section>
    </div>
  );
}