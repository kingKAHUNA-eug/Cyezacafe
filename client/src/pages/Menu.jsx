import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCafe } from '../context/CafeContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { errMsg, money } from '../utils/format.js';
import MenuCard from '../components/MenuCard.jsx';
import DrinkSheet from '../components/DrinkSheet.jsx';
import { SearchIcon } from '../components/Icons.jsx';

export default function Menu() {
  const { user } = useAuth();
  const { cafe, promos } = useCafe();
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState(() => new Set());
  const [sheetItem, setSheetItem] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const loadMenu = useCallback(() => {
    setStatus('loading');
    api.get('/menu')
      .then((res) => { setItems(res.data.items); setStatus('ready'); })
      .catch((err) => { setError(errMsg(err)); setStatus('error'); });
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // Favorites only exist for signed-in customers
  useEffect(() => {
    if (!user) { setFavs(new Set()); return; }
    api.get('/users/favorites')
      .then((res) => setFavs(new Set(res.data.favorites.map((f) => f._id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const toggleFavorite = (item) => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    const had = favs.has(item._id);
    const next = new Set(favs);
    if (had) next.delete(item._id); else next.add(item._id);
    setFavs(next); // update right away, undo if the request fails
    api.post(`/users/favorites/${item._id}`).catch(() => setFavs(favs));
  };

  // Drinks with options open the sheet; snacks and juices go straight in
  const handleAdd = (item) => {
    if (item.customizable) {
      setSheetItem(item);
    } else {
      cart.addItem(item);
      showToast(`${item.name} added to cart`);
    }
  };

  const handleSheetAdd = (customization, qty) => {
    cart.addItem(sheetItem, customization, qty);
    showToast(`${sheetItem.name} added to cart`);
    setSheetItem(null);
  };

  const closeSheet = useCallback(() => setSheetItem(null), []);

  const categories = ['All', ...cafe.categories, ...(user ? ['Favorites'] : [])];
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (category === 'Favorites' && !favs.has(i._id)) return false;
        if (category !== 'All' && category !== 'Favorites' && i.category !== category) return false;
        if (q && !`${i.name} ${i.description}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    [items, category, q, favs]
  );

  // "All" with no search shows a heading for each category
  const grouped = category === 'All' && !q;
  const sections = grouped
    ? cafe.categories.map((c) => ({ title: c, list: visible.filter((i) => i.category === c) })).filter((s) => s.list.length)
    : [{ title: '', list: visible }];

  const bogo = promos.find((p) => p.type === 'bogo');

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <div>
        <h1 className="text-2xl">Our menu</h1>
        {bogo && <p className="m-0 text-sm font-medium text-mocha">Buy one, get one free on everything, for our grand opening.</p>}
      </div>

      <label className="relative block">
        <span className="sr-only">Search the menu</span>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
        <input className="input pl-11" type="search" placeholder="Search drinks and snacks"
          value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Menu categories">
        {categories.map((c) => (
          <button key={c} role="tab" aria-selected={category === c} onClick={() => setCategory(c)}
            className={`chip ${category === c ? 'chip-active' : ''}`}>
            {c}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((n) => <div key={n} className="skeleton h-30" />)}
        </div>
      )}

      {status === 'error' && (
        <div className="card space-y-3 text-center">
          <p className="m-0 text-danger">{error}</p>
          <button className="btn" onClick={loadMenu}>Try again</button>
        </div>
      )}

      {status === 'ready' && visible.length === 0 && (
        <div className="card text-center">
          <p className="m-0 text-muted">
            {category === 'Favorites' ? 'Tap the heart on a drink to save it here.' : 'Nothing matches your search.'}
          </p>
        </div>
      )}

      {status === 'ready' && sections.map((s) => (
        <section key={s.title || 'list'} className="space-y-3">
          {s.title && <h2 className="m-0 text-xl">{s.title}</h2>}
          {s.list.map((item) => (
            <MenuCard key={item._id} item={item} favorite={favs.has(item._id)}
              onToggleFavorite={toggleFavorite} onAdd={handleAdd} />
          ))}
        </section>
      ))}

      {cart.count > 0 && (
        <Link to="/cart"
          className="btn sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-20 w-full justify-between shadow-lift">
          <span>View cart · {cart.count} item{cart.count > 1 ? 's' : ''}</span>
          <span>{money(cart.total)}</span>
        </Link>
      )}

      {toast && (
        <div role="status"
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-espresso px-4 py-2 text-sm text-cream shadow-lift">
          {toast}
        </div>
      )}

      {sheetItem && <DrinkSheet item={sheetItem} onClose={closeSheet} onAdd={handleSheetAdd} />}
    </main>
  );
}