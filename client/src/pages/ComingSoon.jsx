import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Logo.jsx';

// Placeholder for pages we have not built yet.
export default function ComingSoon({ title = 'Coming soon', note = 'We are still brewing this page.' }) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-3 px-6 py-16 text-center">
      <LogoMark tone="dark" className="size-16" />
      <h2 className="text-2xl">{title}</h2>
      <p className="text-muted">{note}</p>
      <Link to="/" className="btn btn-outline mt-2">Back home</Link>
    </div>
  );
}