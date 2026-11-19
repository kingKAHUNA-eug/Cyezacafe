import { useState } from 'react';
import api from '../api/client.js';
import { useCafe } from '../context/CafeContext.jsx';
import { errMsg, money } from '../utils/format.js';
import { buildUssd, telHref } from '../utils/ussd.js';

// Shown on the order page for MTN MoMo and Airtel Money orders.
// No payment API: the customer dials a USSD code, then sends us the transaction ID from the SMS.
export default function PaymentPanel({ order, onUpdated }) {
  const { cafe } = useCafe();
  const [ref, setRef] = useState('');
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const net = cafe.payment?.[order.paymentMethod]; // only exists for 'mtn' and 'airtel'
  if (!net || order.status === 'cancelled' || order.total <= 0) return null;

  if (order.paymentStatus === 'paid') {
    return (
      <div className="rounded-xl bg-success/10 p-3 text-center font-medium text-success">
        Payment confirmed. Thank you!
      </div>
    );
  }

  if (!net.number) {
    return (
      <section className="card text-sm">
        <p className="m-0">{net.label} payment is not set up yet. Please pay at the counter.</p>
      </section>
    );
  }

  const ussd = buildUssd(net.ussd, net.number, order.total);
  const submitted = order.paymentStatus === 'submitted';

  const copy = async () => {
    setError('');
    try {
      await navigator.clipboard.writeText(ussd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy automatically. Press and hold the code to copy it.');
    }
  };

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.patch(`/orders/${order._id}/payment`, { reference: ref.trim() });
      onUpdated(data.order);
      setEditing(false);
      setRef('');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card space-y-3 border-2 border-gold">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-lg">Pay with {net.label}</h2>
          <p className="m-0 text-sm text-muted">Amount to pay: <strong className="text-coffee">{money(order.total)}</strong></p>
        </div>
        <span className={`badge ${submitted ? 'badge-preparing' : 'badge-pending'}`}>
          {submitted ? 'Awaiting confirmation' : 'Not paid yet'}
        </span>
      </div>

      <p aria-label="USSD code" className="m-0 select-all break-all rounded-xl bg-espresso p-3 text-center font-mono text-lg tracking-wide text-gold-light">
        {ussd}
      </p>

      <div className="flex gap-2">
        <a href={telHref(ussd)} className="btn btn-gold flex-1">Dial now</a>
        <button type="button" className="btn btn-outline flex-1" onClick={copy}>{copied ? 'Copied ✓' : 'Copy code'}</button>
      </div>

      <ol className="m-0 list-decimal space-y-1 pl-5 text-sm">
        <li>Tap <strong>Dial now</strong>. If your phone does not open the dialer, copy the code and dial it yourself.</li>
        <li>Enter your {net.label} PIN to approve the payment.</li>
        <li>You will receive a confirmation SMS with a <strong>transaction ID</strong>.</li>
        <li>Type that transaction ID below so we can confirm your payment.</li>
      </ol>

      <p className="m-0 rounded-xl bg-gold/20 p-3 text-xs text-coffee">
        <strong>N.B:</strong> Make sure the SIM card you want to pay with is the one set as the default for calls on your phone, or switch it before you pay.
      </p>

      {submitted && !editing ? (
        <div className="space-y-2 text-sm">
          <p className="m-0">We received your transaction ID <strong className="tracking-wider">{order.paymentRef}</strong>. Our staff will confirm your payment shortly.</p>
          <button type="button" className="font-semibold text-mocha underline" onClick={() => setEditing(true)}>Wrong ID? Change it</button>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-2">
          <label className="block">
            <span className="label">Transaction ID from the SMS</span>
            <input className="input uppercase" value={ref} onChange={(e) => setRef(e.target.value)} maxLength={30}
              placeholder="e.g. 1234567890" autoComplete="off" required />
          </label>
          <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'I have paid'}</button>
        </form>
      )}

      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
    </section>
  );
}