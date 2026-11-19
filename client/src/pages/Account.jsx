import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCafe } from '../context/CafeContext.jsx';
import { StarIcon, BookIcon, GiftIcon, TicketIcon, ShieldIcon, LogoutIcon, ChevronIcon } from '../components/Icons.jsx';

const LINKS = [
  { to: '/rewards', label: 'Rewards & free coffee', icon: StarIcon },
  { to: '/passport', label: 'Bean Passport', icon: BookIcon },
  { to: '/gifts', label: 'Gift cards & send a coffee', icon: GiftIcon },
  { to: '/passes', label: 'Coffee passes', icon: TicketIcon },
];

function Row({ to, icon: RowIcon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 border-b border-line px-1 py-3 last:border-0">
      <RowIcon className="size-5 text-mocha" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronIcon className="size-4 text-muted" />
    </Link>
  );
}

export default function Account() {
  const { user, isAdmin, logout } = useAuth();
  const { cafe } = useCafe();

  if (!user) {
    return (
      <main className="animate-fade-in space-y-4 p-4">
        <section className="card card-dark space-y-3 text-center">
          <h2 className="text-2xl">Join {cafe.name}</h2>
          <p className="m-0 text-cream/90">Sign in to order ahead, save favorites and earn a free coffee.</p>
          <div className="flex gap-3">
            <Link to="/login" className="btn btn-gold flex-1">Sign in</Link>
            <Link to="/register" className="btn btn-outline flex-1 border-gold-light text-gold-light hover:bg-white/10">
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="animate-fade-in space-y-4 p-4">
      <section className="card flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-full bg-coffee font-head text-xl text-gold-light">
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-lg">{user.name}</h3>
          <p className="m-0 truncate text-sm text-muted">{user.email}</p>
          {user.phone && <p className="m-0 text-sm text-muted">{user.phone}</p>}
        </div>
      </section>

      <section className="card py-1">
        {LINKS.map((l) => <Row key={l.to} {...l} />)}
        {isAdmin && <Row to="/admin" icon={ShieldIcon} label="Admin dashboard" />}
      </section>

      <button className="btn btn-outline w-full" onClick={logout}>
        <LogoutIcon className="size-5" /> Sign out
      </button>
    </main>
  );
}