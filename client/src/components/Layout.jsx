import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCafe } from '../context/CafeContext.jsx';
import { LogoMark } from './Logo.jsx';
import BottomNav from './BottomNav.jsx';
import TableBanner from './TableBanner.jsx';

// The customer app: a phone-width column with a top bar and bottom navigation.
export default function Layout() {
  const { user } = useAuth();
  const { cafe, openNow } = useCafe();

  return (
    <div className="mx-auto min-h-dvh max-w-130 bg-cream pb-[calc(76px+env(safe-area-inset-bottom))] sm:shadow-2xl">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-espresso px-4 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark tone="light" className="size-9" />
          <span className="font-head text-lg font-semibold text-gold-light">{cafe.name}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className={`badge ${openNow ? 'badge-ready' : 'badge-cancelled'}`}>
            {openNow ? 'Open' : 'Closed'}
          </span>
          {!user && (
            <Link to="/login" className="text-sm font-semibold text-gold-light">
              Sign in
            </Link>
          )}
        </div>
      </header>
      <TableBanner />
      <Outlet />
      <BottomNav />
    </div>
  );
}