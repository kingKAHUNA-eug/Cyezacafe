const TZ = 'Africa/Kigali';

export const money = (n) => `${Number(n || 0).toLocaleString('en-US')} RWF`;

// Turns an axios error into a message a customer can read.
export const errMsg = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the server. Check your connection.';
  }
  return fallback;
};

// Menu images uploaded by the admin live on the API server under /uploads.
export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.VITE_ASSET_URL || ''}${path}`;
};

export const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ,
  });

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

// "Good morning" / "Good afternoon" / "Good evening" in Kigali time
export const greeting = (date = new Date()) => {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: TZ }).format(date),
    10
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};