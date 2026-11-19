import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useCafe } from '../context/CafeContext.jsx';

// Printable QR codes. Each opens the menu already set to that table.
export default function AdminTables() {
  const { cafe } = useCafe();
  const [base, setBase] = useState(window.location.origin);
  const site = base.trim().replace(/\/+$/, '');

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="m-0 text-2xl">Table QR codes</h1>
          <p className="m-0 text-sm text-muted">Print these and place one on each table. Customers scan to order to their table.</p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => window.print()}>Print</button>
      </div>

      <label className="block max-w-md print:hidden">
        <span className="label">Website address used in the QR codes</span>
        <input className="input" value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://cyezacafe.com" />
        <span className="mt-1 block text-xs text-muted">While testing on your computer this is localhost, which phones cannot open. Use your real website address before printing.</span>
      </label>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3">
        {Array.from({ length: cafe.tables }, (_, i) => i + 1).map((n) => (
          <figure key={n} className="card m-0 flex flex-col items-center gap-2 break-inside-avoid text-center">
            <QRCodeSVG value={`${site}/table/${n}`} size={140} marginSize={1} />
            <figcaption className="font-head text-lg font-semibold text-coffee">Table {n}</figcaption>
            <span className="text-xs text-muted">Scan to order · {cafe.name}</span>
          </figure>
        ))}
      </div>
    </div>
  );
}