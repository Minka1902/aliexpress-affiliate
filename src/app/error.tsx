"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md text-center card flex flex-col items-center gap-3">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="text-ink-muted text-sm">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
