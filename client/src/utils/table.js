// The table number from a table QR code, remembered on this phone.
const KEY = 'cyeza_table';

export const getTable = () => {
  try {
    const n = parseInt(localStorage.getItem(KEY), 10);
    return n > 0 ? n : null;
  } catch { return null; }
};
export const setTable = (n) => { try { localStorage.setItem(KEY, String(n)); } catch { /* ignore */ } };
export const clearTable = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };