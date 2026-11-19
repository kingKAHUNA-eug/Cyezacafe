import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { assetUrl, errMsg, money } from '../utils/format.js';
import { LogoMark } from '../components/Logo.jsx';
import { Modal } from './ui.jsx';

const CATEGORIES = ['Coffee', 'Juices', 'Milkshakes', 'Snacks'];
const BLANK = { name: '', description: '', category: 'Coffee', price: '', brewMethod: '', origin: '', roast: '', featured: false, available: true, customizable: true };

function ItemForm({ item, onClose, onSaved }) {
  const [f, setF] = useState(item ? { ...BLANK, ...item, price: String(item.price) } : BLANK);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(item?.image ? assetUrl(item.image) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const coffee = f.category === 'Coffee';

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim() || !(Number(f.price) >= 0) || f.price === '') { setError('Enter a name and a price.'); return; }
    const fd = new FormData();
    fd.append('name', f.name.trim());
    fd.append('description', f.description || '');
    fd.append('category', f.category);
    fd.append('price', String(Number(f.price)));
    fd.append('brewMethod', coffee ? f.brewMethod || '' : '');
    fd.append('origin', coffee ? f.origin || '' : '');
    fd.append('roast', coffee ? f.roast || '' : '');
    ['featured', 'available', 'customizable'].forEach((k) => fd.append(k, String(Boolean(f[k]))));
    if (file) fd.append('image', file);
    setBusy(true);
    try {
      if (item) await api.put(`/menu/${item._id}`, fd);
      else await api.post('/menu', fd);
      onSaved();
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <Modal title={item ? `Edit ${item.name}` : 'Add menu item'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-3">
          {preview ? <img src={preview} alt="" className="size-20 rounded-xl object-cover" /> : <div className="grid size-20 place-items-center rounded-xl bg-coffee"><LogoMark tone="light" className="size-10" /></div>}
          <label className="block flex-1"><span className="label">Photo (JPG, PNG or WEBP, max 3 MB)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="text-sm" aria-label="Photo" /></label>
        </div>
        <label className="block"><span className="label">Name</span><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required /></label>
        <label className="block"><span className="label">Description</span><textarea className="input" rows={2} maxLength={300} value={f.description} onChange={(e) => set('description', e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">Category</span>
            <select className="input" value={f.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="block"><span className="label">Price (RWF)</span><input className="input" type="number" min="0" step="100" value={f.price} onChange={(e) => set('price', e.target.value)} required /></label>
        </div>
        {coffee && (
          <div className="grid grid-cols-3 gap-3">
            <label className="block"><span className="label">Brew method</span>
              <select className="input" value={f.brewMethod} onChange={(e) => set('brewMethod', e.target.value)}>{['', 'espresso', 'pour-over', 'cold-brew', 'drip'].map((m) => <option key={m} value={m}>{m || 'None'}</option>)}</select>
            </label>
            <label className="block"><span className="label">Origin</span><input className="input" value={f.origin} onChange={(e) => set('origin', e.target.value)} /></label>
            <label className="block"><span className="label">Roast</span>
              <select className="input" value={f.roast} onChange={(e) => set('roast', e.target.value)}>{['', 'light', 'medium', 'dark'].map((m) => <option key={m} value={m}>{m || 'None'}</option>)}</select>
            </label>
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          {[['available', 'Available'], ['featured', 'Popular (shown on home)'], ['customizable', 'Customizable']].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2"><input type="checkbox" className="accent-[#4a2c1a]" checked={Boolean(f[k])} onChange={(e) => set(k, e.target.checked)} />{l}</label>
          ))}
        </div>
        {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
        <div className="flex gap-2"><button className="btn flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save item'}</button><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button></div>
      </form>
    </Modal>
  );
}

export default function AdminMenu() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const load = useCallback(() => api.get('/menu/all').then((r) => { setItems(r.data.items); setError(''); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);
  const close = useCallback(() => setEditing(null), []);

  const toggle = async (item) => {
    try { await api.put(`/menu/${item._id}`, { available: !item.available }); await load(); } catch (e) { setError(errMsg(e)); }
  };
  const remove = async (item) => {
    if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
    try { await api.delete(`/menu/${item._id}`); await load(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-2xl">Menu</h1>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing('new')}>+ Add item</button>
      </div>
      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      {!items && !error && <div className="skeleton h-40" aria-busy="true" />}
      {CATEGORIES.map((cat) => {
        const list = items?.filter((i) => i.category === cat) || [];
        if (!list.length) return null;
        return (
          <section key={cat} className="space-y-2">
            <h2 className="m-0 text-lg">{cat}</h2>
            <div className="card divide-y divide-line py-1">
              {list.map((i) => (
                <div key={i._id} className="flex items-center gap-3 py-2.5">
                  {i.image ? <img src={assetUrl(i.image)} alt="" className="size-12 rounded-lg object-cover" /> : <div className="grid size-12 place-items-center rounded-lg bg-coffee"><LogoMark tone="light" className="size-6" /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate font-semibold">{i.name} {i.featured && <span className="badge ml-1">Popular</span>}</p>
                    <p className="m-0 text-sm text-muted">{money(i.price)}</p>
                  </div>
                  <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" className="accent-[#4a2c1a]" checked={i.available} onChange={() => toggle(i)} aria-label={`${i.name} available`} />Available</label>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(i)} aria-label={`Edit ${i.name}`}>Edit</button>
                  <button className="text-sm text-danger underline" onClick={() => remove(i)} aria-label={`Delete ${i.name}`}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      {editing && <ItemForm item={editing === 'new' ? null : editing} onClose={close} onSaved={() => { close(); load(); }} />}
    </div>
  );
}