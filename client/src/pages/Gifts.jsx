import { useCallback, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg, money } from '../utils/format.js';

const PRESETS = [5000, 10000, 20000];
const STATUS = { pending_payment: ['Awaiting payment', 'badge-pending'], active: ['Ready to use', 'badge-ready'], redeemed: ['Redeemed', 'badge-completed'] };

function Created({ gift, onDone }) {
  const text = `I sent you a gift from Cyeza Café${gift.message ? ` (“${gift.message}”)` : ''}! Open the Cyeza Café app, go to Gifts, and enter this code: ${gift.code}`;
  const copy = () => { try { navigator.clipboard?.writeText(gift.code); } catch { /* ignore */ } };
  return (
    <section className="card space-y-3 text-center">
      <h2 className="m-0 text-xl">Gift ready for {gift.recipientName}</h2>
      <p className="m-0 font-head text-3xl tracking-wider text-coffee">{gift.code}</p>
      <p className="m-0 text-sm text-muted">
        {gift.kind === 'coffee' ? gift.itemName : money(gift.amount)} ·{' '}
        {gift.status === 'active' ? 'Active now.' : 'Pay at the counter and our staff will activate it.'}
      </p>
      <div className="flex gap-2">
        <a className="btn btn-gold flex-1" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>Share on WhatsApp</a>
        <button type="button" className="btn btn-outline flex-1" onClick={copy}>Copy code</button>
      </div>
      <button type="button" className="text-sm font-semibold text-mocha" onClick={onDone}>Send another gift</button>
    </section>
  );
}

function SendGift({ coffees, onSent }) {
  const { user, refreshUser } = useAuth();
  const [kind, setKind] = useState('card');
  const [amount, setAmount] = useState('10000');
  const [item, setItem] = useState('');
  const [f, setF] = useState({ recipientName: '', recipientPhone: '', recipientEmail: '', message: '' });
  const [pay, setPay] = useState('cash');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const set = (e) => setF((p) => ({ ...p, [e.target.name]: e.target.value }));

  if (created) return <Created gift={created} onDone={() => { setCreated(null); setF({ recipientName: '', recipientPhone: '', recipientEmail: '', message: '' }); }} />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.recipientPhone.trim() && !f.recipientEmail.trim()) { setError('Add the recipient’s phone number or email.'); return; }
    if (kind === 'coffee' && !(item || coffees[0]?._id)) { setError('Choose a coffee to gift.'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/gifts', {
        kind, ...f,
        amount: kind === 'card' ? Number(amount) : undefined,
        menuItem: kind === 'coffee' ? item || coffees[0]._id : undefined,
        paymentMethod: pay,
      });
      setCreated(data.gift);
      if (pay === 'wallet') refreshUser().catch(() => {});
      onSent();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[['card', 'Gift card'], ['coffee', 'Send a coffee']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setKind(v)} className={`chip text-center ${kind === v ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>

      {kind === 'card' ? (
        <div>
          <span className="label">Amount</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => <button key={p} type="button" onClick={() => setAmount(String(p))} className={`chip ${amount === String(p) ? 'chip-active' : ''}`}>{money(p)}</button>)}
          </div>
          <input className="input mt-2" type="number" min={1000} max={200000} step={500} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Custom amount" />
        </div>
      ) : (
        <label className="block">
          <span className="label">Coffee to send</span>
          <select className="input" value={item || coffees[0]?._id || ''} onChange={(e) => setItem(e.target.value)}>
            {coffees.map((c) => <option key={c._id} value={c._id}>{c.name} · {money(c.price)}</option>)}
          </select>
        </label>
      )}

      <label className="block"><span className="label">Friend’s name</span><input className="input" name="recipientName" required value={f.recipientName} onChange={set} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className="label">Phone</span><input className="input" type="tel" name="recipientPhone" value={f.recipientPhone} onChange={set} placeholder="078…" /></label>
        <label className="block"><span className="label">Email</span><input className="input" type="email" name="recipientEmail" value={f.recipientEmail} onChange={set} /></label>
      </div>
      <label className="block"><span className="label">Message (optional)</span><textarea className="input" name="message" rows={2} maxLength={300} value={f.message} onChange={set} /></label>

      <div>
        <span className="label">Pay with</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPay('cash')} className={`chip ${pay === 'cash' ? 'chip-active' : ''}`}>At the counter</button>
          <button type="button" onClick={() => setPay('wallet')} className={`chip ${pay === 'wallet' ? 'chip-active' : ''}`}>Wallet ({money(user?.wallet)})</button>
        </div>
      </div>

      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      <button className="btn btn-gold w-full" disabled={busy}>{busy ? 'Creating…' : 'Create gift'}</button>
    </form>
  );
}

function Redeem({ onRedeemed }) {
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMsg(''); setBusy(true);
    try {
      const { data } = await api.post('/gifts/redeem', { code: code.trim() });
      setMsg(`${money(data.gift.amount)} added to your wallet. New balance: ${money(data.wallet)}.`);
      setCode('');
      refreshUser().catch(() => {});
      onRedeemed();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3">
      <label className="block"><span className="label">Gift code</span>
        <input className="input uppercase tracking-wider" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CYZ-XXXX-XXXX" required />
      </label>
      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      {msg && <p role="status" className="m-0 rounded-xl bg-success/10 p-3 text-sm font-medium text-success">{msg}</p>}
      <button className="btn w-full" disabled={busy}>{busy ? 'Checking…' : 'Redeem gift'}</button>
    </form>
  );
}

function Mine({ data }) {
  if (!data) return <div className="skeleton h-32" />;
  const row = (g, who) => (
    <div key={g._id} className="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
      <div>
        <p className="m-0 font-medium">{g.kind === 'coffee' ? g.itemName : money(g.amount)} {who}</p>
        <p className="m-0 text-xs text-muted">{g.code}</p>
      </div>
      <span className={`badge ${STATUS[g.status][1]}`}>{STATUS[g.status][0]}</span>
    </div>
  );
  return (
    <div className="space-y-4">
      <section className="card"><h3 className="mb-1 text-base">Gifts you sent</h3>{data.sent.length ? data.sent.map((g) => row(g, `for ${g.recipientName}`)) : <p className="m-0 text-sm text-muted">Nothing yet.</p>}</section>
      <section className="card"><h3 className="mb-1 text-base">Gifts you received</h3>{data.received.length ? data.received.map((g) => row(g, '')) : <p className="m-0 text-sm text-muted">Nothing yet.</p>}</section>
    </div>
  );
}

export default function Gifts() {
  const [tab, setTab] = useState('send');
  const [coffees, setCoffees] = useState([]);
  const [mine, setMine] = useState(null);
  const loadMine = useCallback(() => api.get('/gifts/mine').then((r) => setMine(r.data)).catch(() => {}), []);
  useEffect(() => {
    api.get('/menu').then((r) => setCoffees(r.data.items.filter((i) => i.category === 'Coffee'))).catch(() => {});
    loadMine();
  }, [loadMine]);

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <h1 className="text-2xl">Gifts</h1>
      <div className="flex gap-2" role="tablist">
        {[['send', 'Send a gift'], ['redeem', 'Redeem'], ['mine', 'My gifts']].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`chip ${tab === v ? 'chip-active' : ''}`}>{l}</button>
        ))}
      </div>
      {tab === 'send' && <SendGift coffees={coffees} onSent={loadMine} />}
      {tab === 'redeem' && <Redeem onRedeemed={loadMine} />}
      {tab === 'mine' && <Mine data={mine} />}
    </main>
  );
}