import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { clearTable, getTable } from '../utils/table.js';

// Shown under the top bar when the customer scanned a table QR code.
export default function TableBanner() {
  const { pathname } = useLocation();
  const [n, setN] = useState(getTable);
  useEffect(() => { setN(getTable()); }, [pathname]);
  if (!n) return null;
  return (
    <div className="flex items-center justify-between bg-gold/25 px-4 py-2 text-sm font-medium text-coffee">
      <span>Ordering for Table {n}</span>
      <button type="button" className="font-bold underline" onClick={() => { clearTable(); setN(null); }}>
        Not at a table?
      </button>
    </div>
  );
}