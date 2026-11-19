import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { HomeIcon, CupIcon, BagIcon, ReceiptIcon, UserIcon } from './Icons.jsx';

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/menu', label: 'Menu', icon: CupIcon },
  { to: '/cart', label: 'Cart', icon: BagIcon, badge: true },
  { to: '/orders', label: 'Orders', icon: ReceiptIcon },
  { to: '/account', label: 'Account', icon: UserIcon },
];

export default function BottomNav() {
  const { count } = useCart();

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-130 -translate-x-1/2 justify-around border-t border-line bg-white pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]"
    >
      {TABS.map(({ to, label, icon: TabIcon, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold transition ${
              isActive ? 'text-coffee' : 'text-muted'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute -top-2 h-[3px] w-7 rounded-full bg-gold" />}
              <TabIcon />
              {badge && count > 0 && (
                <span className="absolute top-0 right-1 grid min-w-4.5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-espresso">
                  {count}
                </span>
              )}
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}