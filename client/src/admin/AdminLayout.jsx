import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LogoMark } from '../components/Logo.jsx';

const TABS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/menu', label: 'Menu' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/promotions', label: 'Promotions' },
  { to: '/admin/gifts', label: 'Gifts & passes' },
  { to: '/admin/tables', label: 'Table QR codes' },
];

// Admin area: full width, works on a phone, tablet or the counter computer.
export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh bg-cream">
      <header className="bg-espresso px-4 pt-[calc(10px+env(safe-area-inset-top))] text-cream print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2">
            <LogoMark tone="light" className="size-9" />
            <span className="font-head text-lg font-semibold text-gold-light">Cyeza Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-cream/70 sm:inline">{user?.name}</span>
            <Link to="/" className="font-semibold text-gold-light">View app</Link>
            <button onClick={logout} className="font-semibold text-gold-light">Sign out</button>
          </div>
        </div>

        <nav aria-label="Admin" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-cream text-espresso' : 'text-cream/70 hover:text-cream'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl p-4">
        <Outlet />
      </div>
    </div>
  );
}