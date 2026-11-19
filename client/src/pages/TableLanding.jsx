import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useCafe } from '../context/CafeContext.jsx';
import { setTable } from '../utils/table.js';

// Opened by scanning the QR code on a table: /table/5
export default function TableLanding() {
  const { number } = useParams();
  const { cafe } = useCafe();
  const n = parseInt(number, 10);
  const valid = Number.isInteger(n) && n >= 1 && n <= cafe.tables;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (valid) { setTable(n); setReady(true); }
  }, [valid, n]);

  if (!valid) {
    return (
      <div className="space-y-3 px-6 py-16 text-center">
        <h2 className="text-2xl">Unknown table</h2>
        <p className="text-muted">This table code is not valid. Please ask our staff for help.</p>
        <Link to="/menu" className="btn">See the menu</Link>
      </div>
    );
  }
  return ready ? <Navigate to="/menu" replace /> : null;
}