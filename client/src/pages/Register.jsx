import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../utils/format.js';
import Logo from '../components/Logo.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname;
  if (user) return <Navigate to={from || '/'} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    } catch (err) {
      setError(errMsg(err, 'Could not create your account. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-espresso px-4 py-10">
      <div className="mx-auto max-w-sm">
        <Logo tone="light" className="mx-auto mb-6 w-48" />

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <h2 className="mb-0.5 text-xl">Create your account</h2>
            <p className="m-0 text-sm text-muted">Order ahead, skip the line and earn a free coffee.</p>
          </div>

          <label className="block">
            <span className="label">Full name</span>
            <input className="input" name="name" autoComplete="name" required value={form.name} onChange={onChange} />
          </label>

          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" name="email" autoComplete="email" required
              value={form.email} onChange={onChange} placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="label">Phone (for order updates)</span>
            <input className="input" type="tel" name="phone" autoComplete="tel"
              value={form.phone} onChange={onChange} placeholder="078 000 0000" />
          </label>

          <label className="block">
            <span className="label">Password</span>
            <input className="input" type="password" name="password" autoComplete="new-password" required minLength={8}
              value={form.password} onChange={onChange} placeholder="At least 8 characters" />
          </label>

          {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}

          <button className="btn w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>

          <p className="m-0 text-center text-sm text-muted">
            Already have an account? <Link to="/login" className="font-semibold text-coffee">Sign in</Link>
          </p>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-gold-light">Continue as guest</Link>
        </p>
      </div>
    </div>
  );
}