import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-130 flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
      <Logo tone="dark" className="w-40" />
      <h2 className="text-2xl">Page not found</h2>
      <p className="text-muted">This page does not exist.</p>
      <Link to="/" className="btn">Go to home</Link>
    </div>
  );
}