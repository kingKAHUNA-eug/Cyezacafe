import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { describeCustomization } from '../utils/pricing.js';
import { errMsg, fmtDateTime, money } from '../utils/format.js';
import PaymentPanel from '../components/PaymentPanel.jsx';

const STEPS = [
  { status: 'pending', label: 'Received' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'completed', label: 'Collected' },
];
const ACTIVE = ['pending', 'preparing', 'ready'];
const PAY_LABEL = { cash: 'Cash', mtn: 'MTN MoMo', airtel: 'Airtel Money', momo: 'Mobile Money', card: 'Card', wallet: 'Wallet' };

function statusMessage(order) {
  const where = order.type === 'table' ? 'to your table' : order.type === 'curbside' ? 'to your car' : 'at the counter';
  switch (order.status) {
    case 'pending': return 'We have your order and will start on it shortly.';
    case 'preparing': return 'Our baristas are making your order.';
    case 'ready': return order.type === 'pickup' ? 'Your order is ready. Collect it at the counter!' : `Your order is ready and on its way ${where}.`;
    case 'completed': return `Enjoy! ${order.pointsEarned ? `You earned ${order.pointsEarned} points.` : ''}`;
    default: return 'This order was cancelled.';
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      api.get(`/orders/${id}`)
        .then((res) => { setOrder(res.data.order); setError(''); })
        .catch((err) => setError(errMsg(err, 'Could not load this order.'))),
    [id]
  );

  useEffect(() => { load(); }, [load]);

  // Keep the status fresh while the order is still in progress
  const status = order?.status;
  useEffect(() => {
    if (!status || !ACTIVE.includes(status)) return undefined;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [status, load]);

  // Points and free drinks change once an order is collected
  useEffect(() => {
    if (status === 'completed') refreshUser().catch(() => {});
  }, [status, refreshUser]);

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      setOrder(data.order);
      refreshUser().catch(() => {});
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <main className="space-y-4 p-4">
        {error ? (
          <div className="card space-y-3 text-center">
            <p className="m-0 text-danger">{error}</p>
            <button className="btn" onClick={load}>Try again</button>
          </div>
        ) : (
          <div className="skeleton h-40" aria-busy="true" />
        )}
      </main>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === 'cancelled';
  const placeText =
    order.type === 'table' ? `Dine in · Table ${order.tableNumber}`
    : order.type === 'curbside' ? `Curbside${order.curbsideInfo ? ` · ${order.curbsideInfo}` : ''}`
    : 'Pickup at the counter';

  return (
    <main className="animate-fade-in space-y-4 p-4">
      {location.state?.placed && (
        <div className="rounded-xl bg-success/10 p-3 text-center font-medium text-success">
          Thank you! Your order has been placed.
        </div>
      )}

      <section className="card card-dark text-center">
        <p className="m-0 text-sm text-cream/70">Order number</p>
        <h1 className="m-0 text-3xl text-gold-light">#{order.orderNumber}</h1>
        <p className="mt-2 mb-0 text-cream/90">{statusMessage(order)}</p>
      </section>
      <PaymentPanel order={order} onUpdated={setOrder} />
      {cancelled ? (
        <div className="rounded-xl bg-danger/10 p-3 text-center font-medium text-danger">Order cancelled</div>
      ) : (
        <ol className="m-0 flex list-none justify-between p-0" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.status} className="flex flex-1 flex-col items-center gap-1 text-center text-xs">
              <span className={`grid size-7 place-items-center rounded-full font-bold ${i <= stepIndex ? 'bg-gold text-espresso' : 'bg-parchment text-muted'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </span>
              <span className={i <= stepIndex ? 'font-semibold text-coffee' : 'text-muted'}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <section className="card space-y-1 text-sm">
        <p className="m-0"><strong>Where:</strong> {placeText}</p>
        <p className="m-0"><strong>When:</strong> {order.scheduledFor ? fmtDateTime(order.scheduledFor) : 'As soon as possible'}</p>
        <p className="m-0"><strong>Payment:</strong> {PAY_LABEL[order.paymentMethod]} ({order.paymentStatus === 'submitted' ? 'awaiting confirmation' : order.paymentStatus})</p>
        {order.note && <p className="m-0"><strong>Note:</strong> {order.note}</p>}
        <p className="m-0 text-muted">Placed {fmtDateTime(order.createdAt)}</p>
      </section>

      <section className="card divide-y divide-line py-1">
        {order.items.map((it, i) => (
          <div key={i} className="flex justify-between gap-3 py-2.5">
            <div>
              <p className="m-0 font-medium">{it.quantity} × {it.name}</p>
              {describeCustomization(it.customization) && (
                <p className="m-0 text-sm text-muted">{describeCustomization(it.customization)}</p>
              )}
            </div>
            <span className="text-sm">{money(it.unitPrice * it.quantity)}</span>
          </div>
        ))}
        <div className="space-y-1 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-success"><span>{order.promotion || 'Promotion'}</span><span>− {money(order.discount)}</span></div>
          )}
          {order.freeDrinkDiscount > 0 && (
            <div className="flex justify-between text-success"><span>Free coffee</span><span>− {money(order.freeDrinkDiscount)}</span></div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-coffee">
            <span>Total</span><span>{money(order.total)}</span>
          </div>
        </div>
      </section>

      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}

      {order.status === 'pending' && (
        <button className="btn btn-outline w-full" onClick={cancel} disabled={busy}>
          {busy ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
      <Link to="/menu" className="btn w-full">Back to menu</Link>
    </main>
  );
}