import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { errMsg } from '../utils/format.js';
import { Modal } from './ui.jsx';

const CATS = ['Coffee', 'Juices', 'Milkshakes', 'Snacks'];
const BLANK = { name: '', description: '', type: 'bogo', value: 10, categories: [], code: '', autoApply: true, active: true, startsAt: '', endsAt: '' };

// ISO date -> value for <input type="datetime-local">
const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function status(p) {
  const now = Date.now();
  if (!p.active) return ['Paused', 'badge-cancelled'];
  if (p.startsAt && new Date(p.startsAt) > now) return ['Scheduled', 'badge-pending'];
  if (p.endsAt && new Date(p.endsAt) < now) return ['Ended', 'badge-completed'];
  return ['Live', 'badge-ready'];
}

function PromoForm({ promo, onClose, onSaved }) {
  const [f, setF] = useState(promo ? { ...BLANK, ...promo, code: promo.code || '', startsAt: toLocal(promo.startsAt), endsAt: toLocal(promo.endsAt) } : BLANK);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCat = (c) => set('categories', f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) { setError('Give the promotion a name.'); return; }
    if (!f.autoApply && !f.code.trim()) { setError('A promotion that is not automatic needs a promo code.'); return; }
    if (f.type === 'percent' && !(Number(f.value) > 0 && Number(f.value) <= 100)) { setError('Percent must be between 1 and 100.'); return; }
    const body = {
      name: f.name.trim(), description: f.description, type: f.type, value: f.type === 'percent' ? Number(f.value) : 0,
      categories: f.categories, code: f.code.trim(), autoApply: f.autoApply, active: f.active,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : '', endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : '',
    };
    setBusy(true);
    try {
      if (promo) await api.put(`/promotions/${promo._id}`, body);
      else await api.post('/promotions', body);
      onSaved();
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <Modal title={promo ? 'Edit promotion' : 'New promotion'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block"><span className="label">Name</span><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required /></label>
        <label className="block"><span className="label">Description (shown to customers)</span><input className="input" value={f.description} onChange={(e) => set('description', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Type</span>
            <select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}><option value="bogo">Buy one, get one free</option><option value="percent">Percent off</option></select>
          </label>
          {f.type === 'percent' && <label className="block"><span className="label">Percent off</span><input className="input" type="number" min="1" max="100" value={f.value} onChange={(e) => set('value', e.target.value)} /></label>}
        </div>
        <div><span className="label">Applies to (none selected = everything)</span>
          <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} type="button" onClick={() => toggleCat(c)} className={`chip ${f.categories.includes(c) ? 'chip-active' : ''}`}>{c}</button>)}</div>
        </div>
        <label className="block"><span className="label">Promo code (optional if automatic)</span><input className="input uppercase" value={f.code} onChange={(e) => set('code', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Starts</span><input className="input" type="datetime-local" value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} /></label>
          <label className="block"><span className="label">Ends</span><input className="input" type="datetime-local" value={f.endsAt} onChange={(e) => set('endsAt', e.target.value)} /></label>
        </div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-[#4a2c1a]" checked={f.autoApply} onChange={(e) => set('autoApply', e.target.checked)} />Apply automatically</label>
          <label className="flex items-center gap-2"><input type="checkbox" className="accent-[#4a2c1a]" checked={f.active} onChange={(e) => set('active', e.target.checked)} />Active</label>
        </div>
        {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
        <div className="flex gap-2"><button className="btn flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save promotion'}</button><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export default function AdminPromotions() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const load = useCallback(() => api.get('/promotions').then((r) => { setList(r.data.promotions); setError(''); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);
  const close = useCallback(() => setEditing(null), []);

  const toggle = async (p) => { try { await api.put(`/promotions/${p._id}`, { active: !p.active }); load(); } catch (e) { setError(errMsg(e)); } };
  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”?`)) return;
    try { await api.delete(`/promotions/${p._id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-2xl">Promotions</h1>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing('new')}>+ New promotion</button>
      </div>
      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!list && !error && <div className="skeleton h-32" aria-busy="true" />}
      {list?.length === 0 && <div className="card text-center text-muted">No promotions yet.</div>}
      {list?.map((p) => {
        const [label, cls] = status(p);
        return (
          <article key={p._id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="m-0 text-base">{p.name}</h3>
                <p className="m-0 text-sm text-muted">
                  {p.type === 'bogo' ? 'Buy one, get one free' : `${p.value}% off`} · {p.categories.length ? p.categories.join(', ') : 'Everything'}
                  {p.code ? ` · code ${p.code}` : ''}{p.autoApply ? ' · automatic' : ''}
                </p>
                <p className="m-0 text-xs text-muted">
                  {p.startsAt ? `From ${new Date(p.startsAt).toLocaleString('en-GB')}` : 'No start date'} · {p.endsAt ? `until ${new Date(p.endsAt).toLocaleString('en-GB')}` : 'no end date'}
                </p>
              </div>
              <span className={`badge ${cls}`}>{label}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => toggle(p)}>{p.active ? 'Pause' : 'Resume'}</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(p)}>Edit</button>
              <button className="text-sm text-danger underline" onClick={() => remove(p)}>Delete</button>
            </div>
          </article>
        );
      })}
      {editing && <PromoForm promo={editing === 'new' ? null : editing} onClose={close} onSaved={() => { close(); load(); }} />}
    </div>
  );
}