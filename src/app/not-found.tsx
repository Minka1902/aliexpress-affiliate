import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md text-center card flex flex-col items-center gap-3">
        <div className="text-5xl font-extrabold text-brand">404</div>
        <p className="text-ink-muted">This page could not be found.</p>
        <Link href="/dashboard" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
