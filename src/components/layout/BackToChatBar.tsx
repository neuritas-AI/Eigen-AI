import Link from 'next/link';

export default function BackToChatBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm text-brand-text lg:px-6">
        <Link href="/chat" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-brand-muted transition hover:border-brand-blue/60 hover:text-brand-text">
          ← Back to chat
        </Link>
        <span className="text-brand-muted">Return to the main AI workspace.</span>
      </div>
    </header>
  );
}
