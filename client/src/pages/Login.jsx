import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../utils/format.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Where the user was heading before being sent to login
  const from = location.state?.from?.pathname;

  // Once login succeeds `user` is set and we leave this page
  if (user) return <Navigate to={from || (user.role === 'admin' ? '/admin' : '/')} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(errMsg(err, 'Could not sign in. Please try again.'));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-espresso px-4 py-10">
      <div className="mx-auto max-w-sm">
        <Logo tone="light" className="mx-auto mb-6 w-48" />

        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <h2 className="mb-0.5 text-xl">Welcome back</h2>
            <p className="m-0 text-sm text-muted">Sign in to order ahead and collect rewards.</p>
          </div>

          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" name="email" autoComplete="email" required
              value={form.email} onChange={onChange} placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="label">Password</span>
            <input className="input" type="password" name="password" autoComplete="current-password" required
              value={form.password} onChange={onChange} />
          </label>

          {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}

          <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>

          <p className="m-0 text-center text-sm text-muted">
            New here? <Link to="/register" className="font-semibold text-coffee">Create an account</Link>
          </p>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-gold-light">Continue as guest</Link>
        </p>
      </div>
    </div>
  );
}