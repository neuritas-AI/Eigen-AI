'use client';

import { useEffect, useState } from 'react';

export default function CreditsDashboard() {
  const [credits, setCredits] = useState(0);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);

  async function loadCredits() {
    setLoading(true);
    const res = await fetch('/api/user/credits');
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setCredits(data.credits ?? 0);
      setLimit(data.limit ?? 100);
    }
  }

  useEffect(() => {
    loadCredits();
  }, []);

  const usage = Math.min(1, credits / limit);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Credits remaining</h2>
          <p className="mt-2 text-sm text-slate-300">This is your monthly plan balance.</p>
        </div>
        {loading ? <span className="text-sm text-slate-400">Loading…</span> : null}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between text-sm text-brand-muted">
          <span>{credits} / {limit}</span>
          <span>{limit - credits} credits left</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-950">
          <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${usage * 100}%` }} />
        </div>
      </div>
    </section>
  );
}
