import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { errMsg } from '../utils/format.js';

const CafeContext = createContext(null);

// Loads the café details, drink options, loyalty rules and live promotions once.
export function CafeProvider({ children }) {
  const [state, setState] = useState({
    cafe: null, options: null, loyalty: null, openNow: true, promos: [], loading: true, error: '',
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/cafe'), api.get('/promotions/active')])
      .then(([cafeRes, promoRes]) => {
        if (cancelled) return;
        const { cafe, options, loyalty, openNow } = cafeRes.data;
        setState({ cafe, options, loyalty, openNow, promos: promoRes.data.promotions, loading: false, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: errMsg(err) }));
      });
    return () => { cancelled = true; };
  }, []);

  return <CafeContext.Provider value={state}>{children}</CafeContext.Provider>;
}

export const useCafe = () => useContext(CafeContext);