import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl">Page not found</h1>
      <p className="mt-2 text-stone">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-6 rounded-sm bg-ink px-6 py-3 text-sm font-medium text-parchment">
        Back to home
      </Link>
    </div>
  );
}
