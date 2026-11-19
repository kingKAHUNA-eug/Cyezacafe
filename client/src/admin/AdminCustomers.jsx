import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { errMsg, money } from '../utils/format.js';

// Returns `value` only after it has stopped changing for `ms` milliseconds.
function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function AdminCustomers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounced(q.trim(), 300);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get('/admin/customers', { params: { q: search || undefined, page, limit: 20 } })
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (c) => {
    try { await api.patch(`/admin/customers/${c._id}`, { isActive: !c.isActive }); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="m-0 text-2xl">Customers {data && <span className="text-base text-muted">({data.total})</span>}</h1>
        <input className="input max-w-xs" type="search" placeholder="Search name, email or phone" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search customers" />
      </div>
      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!data && !error && <div className="skeleton h-40" aria-busy="true" />}
      {data && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-parchment text-xs uppercase text-muted">
              <tr>{['Customer', 'Phone', 'Points', 'Free', 'Wallet', 'Spent', 'Joined', ''].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.customers.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">No customers found.</td></tr>}
              {data.customers.map((c) => (
                <tr key={c._id} className={`border-t border-line ${c.isActive ? '' : 'opacity-50'}`}>
                  <td className="px-3 py-2"><p className="m-0 font-semibold">{c.name}</p><p className="m-0 text-xs text-muted">{c.email}</p></td>
                  <td className="px-3 py-2">{c.phone || '–'}</td>
                  <td className="px-3 py-2">{c.points}</td>
                  <td className="px-3 py-2">{c.freeDrinks}</td>
                  <td className="px-3 py-2">{money(c.wallet)}</td>
                  <td className="px-3 py-2">{money(c.totalSpent)}</td>
                  <td className="px-3 py-2">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-3 py-2"><button className="btn btn-outline btn-sm" onClick={() => toggle(c)}>{c.isActive ? 'Disable' : 'Enable'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm">Page {data.page} of {data.pages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}