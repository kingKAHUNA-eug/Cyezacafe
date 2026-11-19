import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { errMsg, fmtDateTime, money } from '../utils/format.js';

const ACTIVE = ['pending', 'preparing', 'ready'];
const LABEL = { pending: 'Received', preparing: 'Preparing', ready: 'Ready', completed: 'Collected', cancelled: 'Cancelled' };

function OrderCard({ order, onReorder, busy }) {
  const summary = order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ');
  return (
    <article className="card space-y-2">
      <Link to={`/orders/${order._id}`} className="block space-y-1 text-ink">
        <div className="flex items-center justify-between">
          <span className="font-semibold">#{order.orderNumber}</span>
          <span className={`badge badge-${order.status}`}>{LABEL[order.status]}</span>
        </div>
        <p className="m-0 text-sm text-muted">{fmtDateTime(order.createdAt)}</p>
        <p className="m-0 line-clamp-2 text-sm">{summary}</p>
      </Link>
      <div className="flex items-center justify-between">
        <span className="font-bold text-coffee">{money(order.total)}</span>
        <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => onReorder(order)}>
          Order again
        </button>
      </div>
    </article>
  );
}

export default function Orders() {
  const cart = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setError('');
    api.get('/orders/mine')
      .then((res) => setOrders(res.data.orders))
      .catch((err) => setError(errMsg(err, 'Could not load your orders.')));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Put the items of an old order back in the cart, at today's prices
  const reorder = async (order) => {
    setNotice('');
    setBusyId(order._id);
    try {
      const { data } = await api.get('/menu');
      const menu = new Map(data.items.map((m) => [String(m._id), m]));
      const missing = [];
      let added = 0;
      for (const it of order.items) {
        const item = menu.get(String(it.menuItem));
        if (!item) { missing.push(it.name); continue; }
        cart.addItem(item, it.customization, it.quantity);
        added += 1;
      }
      if (added === 0) {
        setNotice('Sorry, none of the items in that order are available right now.');
      } else if (missing.length) {
        setNotice(`Added to your cart. No longer available: ${missing.join(', ')}.`);
      } else {
        navigate('/cart');
      }
    } catch (err) {
      setNotice(errMsg(err));
    } finally {
      setBusyId('');
    }
  };

  const active = orders?.filter((o) => ACTIVE.includes(o.status)) || [];
  const past = orders?.filter((o) => !ACTIVE.includes(o.status)) || [];

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <h1 className="text-2xl">Your orders</h1>

      {notice && (
        <div role="status" className="space-y-2 rounded-xl bg-gold/20 p-3 text-sm font-medium text-coffee">
          <p className="m-0">{notice}</p>
          {notice.startsWith('Added') && <Link to="/cart" className="font-bold underline">View cart</Link>}
        </div>
      )}

      {!orders && !error && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((n) => <div key={n} className="skeleton h-28" />)}
        </div>
      )}

      {error && (
        <div className="card space-y-3 text-center">
          <p className="m-0 text-danger">{error}</p>
          <button className="btn" onClick={load}>Try again</button>
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="card space-y-3 py-10 text-center">
          <p className="m-0 text-muted">You have not ordered yet.</p>
          <Link to="/menu" className="btn mx-auto">Browse the menu</Link>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="m-0 text-xl">In progress</h2>
          {active.map((o) => <OrderCard key={o._id} order={o} onReorder={reorder} busy={busyId === o._id} />)}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="m-0 text-xl">Past orders</h2>
          {past.map((o) => <OrderCard key={o._id} order={o} onReorder={reorder} busy={busyId === o._id} />)}
        </section>
      )}
    </main>
  );
}