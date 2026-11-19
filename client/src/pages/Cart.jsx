import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCafe } from '../context/CafeContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { describeCustomization } from '../utils/pricing.js';
import { buildSlots, isOpenNow } from '../utils/slots.js';
import { errMsg, money } from '../utils/format.js';
import QtyStepper from '../components/QtyStepper.jsx';
import { getTable } from '../utils/table.js';

const TYPES = [
  { value: 'pickup', title: 'Pickup', desc: 'Collect at the counter' },
  { value: 'curbside', title: 'Curbside', desc: 'We bring it to your car' },
  { value: 'table', title: 'Dine in', desc: 'Served to your table' },
];

const MOBILE = ['mtn', 'airtel'];
const PAYMENTS = [
  { value: 'mtn', title: 'MTN MoMo', desc: 'Pay with a USSD code after you place the order' },
  { value: 'airtel', title: 'Airtel Money', desc: 'Pay with a USSD code after you place the order' },
  { value: 'cash', title: 'Cash', desc: 'Pay at the counter' },
];

function Block({ title, children }) {
  return (
    <section className="card space-y-3">
      <h3 className="m-0 text-base">{title}</h3>
      {children}
    </section>
  );
}

function Choice({ name, value, checked, onChange, title, desc, disabled }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border-[1.5px] border-line bg-white p-3 transition has-[:checked]:border-coffee has-[:checked]:bg-parchment has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} disabled={disabled}
        onChange={() => onChange(value)} className="mt-1 accent-[#4a2c1a]" />
      <span>
        <span className="block font-semibold">{title}</span>
        {desc && <span className="block text-sm text-muted">{desc}</span>}
      </span>
    </label>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className={`flex justify-between text-sm ${tone === 'save' ? 'font-medium text-success' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function Cart() {
  const { user, refreshUser } = useAuth();
  const { cafe, promos, loyalty } = useCafe();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const savedTable = getTable(); // set when the customer scanned a table QR code
  const [type, setType] = useState(savedTable ? 'table' : 'pickup');
  const [table, setTable] = useState(savedTable ? String(savedTable) : '1');
  const [curbside, setCurbside] = useState('');
  const [when, setWhen] = useState('asap'); // asap | later
  const [slot, setSlot] = useState('');
  const [payment, setPayment] = useState('cash');
  const [useFree, setUseFree] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const open = isOpenNow(cafe.hours);
  const effectiveWhen = open ? when : 'later'; // when we are closed, only scheduled orders make sense
  const slots = useMemo(() => buildSlots(cafe.hours), [cafe.hours, effectiveWhen]); // eslint-disable-line react-hooks/exhaustive-deps
  const slotValue = slot || slots[0]?.value || '';

  if (cart.lines.length === 0) {
    return (
      <main className="animate-fade-in space-y-4 p-4">
        <h1 className="text-2xl">Your cart</h1>
        <div className="card space-y-3 py-10 text-center">
          <p className="m-0 text-muted">Your cart is empty.</p>
          <Link to="/menu" className="btn mx-auto">Browse the menu</Link>
        </div>
      </main>
    );
  }

  // Free coffee from the punch card: the cheapest coffee in the cart
  const coffeePrices = cart.lines.filter((l) => l.category === 'Coffee').map((l) => l.unitPrice);
  const canUseFree = Boolean(user) && user.freeDrinks > 0 && coffeePrices.length > 0;
  const freeDrink = useFree && canUseFree ? Math.min(...coffeePrices) : 0;
  const totalDiscount = Math.min(cart.subtotal, cart.discount + freeDrink);
  const finalTotal = cart.subtotal - totalDiscount;
  const walletOk = Boolean(user) && user.wallet >= finalTotal;
  const bogo = promos.find((p) => p.type === 'bogo' && p.autoApply);
  const points = Math.floor(finalTotal / (loyalty?.rwfPerPoint || 100));

  const placeOrder = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setError('');
    if (effectiveWhen === 'later' && !slotValue) {
      setError('No pickup times are available right now.');
      return;
    }
    if (payment === 'wallet' && !walletOk) {
      setError('Your wallet balance is too low for this order.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.lines.map((l) => ({ menuItem: l.menuItem, quantity: l.quantity, customization: l.customization })),
        type,
        tableNumber: type === 'table' ? Number(table) : undefined,
        curbsideInfo: type === 'curbside' ? curbside.trim() : undefined,
        scheduledFor: effectiveWhen === 'later' ? slotValue : undefined,
        paymentMethod: payment,
        useFreeDrink: useFree && canUseFree,
        promoCode: promoCode.trim() || undefined,
        note: note.trim() || undefined,
      });
      cart.clear();
      await refreshUser().catch(() => {});
      navigate(`/orders/${data.order._id}`, { replace: true, state: { placed: true } });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <div className="flex items-end justify-between">
        <h1 className="m-0 text-2xl">Your cart</h1>
        <button className="text-sm font-semibold text-mocha" onClick={cart.clear}>Clear cart</button>
      </div>

      {/* Items */}
      <section className="card divide-y divide-line py-1">
        {cart.lines.map((l) => (
          <div key={l.key} className="space-y-2 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="m-0 text-base">{l.name}</h3>
                {describeCustomization(l.customization) && (
                  <p className="m-0 text-sm text-muted">{describeCustomization(l.customization)}</p>
                )}
                {l.customization?.notes && <p className="m-0 text-xs italic text-muted">“{l.customization.notes}”</p>}
              </div>
              <span className="font-bold text-coffee">{money(l.unitPrice * l.quantity)}</span>
            </div>
            <div className="flex items-center justify-between">
              <QtyStepper label={l.name} value={l.quantity} onChange={(v) => cart.setQuantity(l.key, v)} />
              <button className="text-sm text-muted underline" onClick={() => cart.removeItem(l.key)}>
                Remove {l.name}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Promo nudge */}
      {cart.promo ? (
        <div className="rounded-xl bg-success/10 p-3 text-sm font-medium text-success">
          {cart.promo.name} applied. You save {money(cart.discount)}.
        </div>
      ) : (
        bogo && cart.count === 1 && (
          <div className="rounded-xl bg-gold/20 p-3 text-sm font-medium text-coffee">
            Add one more item and the cheaper one is free!
          </div>
        )
      )}

      {/* Order type */}
      <Block title="How would you like it?">
        <div className="space-y-2">
          {TYPES.map((t) => (
            <Choice key={t.value} name="type" checked={type === t.value} onChange={setType} {...t} />
          ))}
        </div>
        {type === 'curbside' && (
          <label className="block">
            <span className="label">Your car (colour and plate)</span>
            <input className="input" value={curbside} maxLength={120} onChange={(e) => setCurbside(e.target.value)}
              placeholder="White Toyota, RAB 123 A" />
          </label>
        )}
        {type === 'table' && (
          <label className="block">
            <span className="label">Table number</span>
            <select className="input" value={table} onChange={(e) => setTable(e.target.value)}>
              {Array.from({ length: cafe.tables }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>Table {n}</option>
              ))}
            </select>
          </label>
        )}
      </Block>

      {/* When */}
      <Block title="When?">
        {!open && (
          <p className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            We are closed right now (open {cafe.hours.label}). Choose a time when we open.
          </p>
        )}
        <div className="space-y-2">
          <Choice name="when" value="asap" checked={effectiveWhen === 'asap'} onChange={setWhen}
            title="As soon as possible" desc="Ready in about 10 minutes" disabled={!open} />
          <Choice name="when" value="later" checked={effectiveWhen === 'later'} onChange={setWhen}
            title="Schedule a time" desc="Ready when you arrive" />
        </div>
        {effectiveWhen === 'later' && (
          <label className="block">
            <span className="label">Pickup time</span>
            <select className="input" value={slotValue} onChange={(e) => setSlot(e.target.value)}>
              {slots.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        )}
      </Block>

      {/* Payment */}
      <Block title="Payment">
        <div className="space-y-2">
          {PAYMENTS.map((p) => (
            <Choice key={p.value} name="payment" checked={payment === p.value} onChange={setPayment} {...p}
              disabled={MOBILE.includes(p.value) && !cafe.payment?.[p.value]?.number} />
          ))}
          {user && (
            <Choice name="payment" value="wallet" checked={payment === 'wallet'} onChange={setPayment}
              title="Wallet" desc={`Balance ${money(user.wallet)}${walletOk ? '' : ' (not enough for this order)'}`}
              disabled={!walletOk} />
          )}
        </div>
        {MOBILE.includes(payment) ? (
          <p className="m-0 rounded-xl bg-gold/20 p-3 text-xs text-coffee">
            After you place the order we show you a USSD code to dial.{' '}
            <strong>N.B: make sure the SIM card you want to pay with is the one set as the default for calls on your phone, or switch it before you pay.</strong>
          </p>
        ) : (
          <p className="m-0 text-xs text-muted">Pay at the counter and our staff will confirm it.</p>
        )}
      </Block>

      {/* Extras */}
      <Block title="Extras">
        {canUseFree && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-gold/20 p-3">
            <input type="checkbox" checked={useFree} onChange={(e) => setUseFree(e.target.checked)}
              className="mt-1 accent-[#4a2c1a]" />
            <span>
              <span className="block font-semibold">Use a free coffee</span>
              <span className="block text-sm text-muted">
                You have {user.freeDrinks} free coffee{user.freeDrinks > 1 ? 's' : ''}. The cheapest coffee in your order is free.
              </span>
            </span>
          </label>
        )}
        <label className="block">
          <span className="label">Promo code (optional)</span>
          <input className="input uppercase" value={promoCode} maxLength={30}
            onChange={(e) => setPromoCode(e.target.value)} placeholder="ENTER CODE" />
        </label>
        <label className="block">
          <span className="label">Note for the café (optional)</span>
          <textarea className="input" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </Block>

      {/* Summary */}
      <section className="card space-y-2">
        <Row label={`Subtotal (${cart.count} item${cart.count > 1 ? 's' : ''})`} value={money(cart.subtotal)} />
        {cart.discount > 0 && <Row tone="save" label={cart.promo?.name || 'Promotion'} value={`− ${money(cart.discount)}`} />}
        {freeDrink > 0 && <Row tone="save" label="Free coffee" value={`− ${money(freeDrink)}`} />}
        <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-coffee">
          <span>Total</span>
          <span>{money(finalTotal)}</span>
        </div>
        {user && points > 0 && <p className="m-0 text-xs text-muted">You will earn {points} points with this order.</p>}
      </section>

      {error && <p role="alert" className="m-0 rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <button className="btn btn-gold w-full" onClick={placeOrder} disabled={busy}>
        {busy ? 'Placing order…' : user ? `Place order · ${money(finalTotal)}` : 'Sign in to place order'}
      </button>
    </main>
  );
}