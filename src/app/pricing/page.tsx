const plans = [
  { name: 'FREE', price: '€0', description: 'For personal use and small daily usage.', features: ['1 workspace', 'Basic AI chat', 'Community support'] },
  { name: 'PRO', price: '€19', description: 'For teams that need faster usage and priority access.', features: ['Unlimited chats', 'Priority AI responses', 'Usage insights'] },
  { name: 'TEAM', price: '€49', description: 'For departments and shared workspaces.', features: ['Shared workspace', 'Admin controls', 'Team billing'] },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Plans</p>
          <h1 className="mt-2 text-2xl font-semibold">Paid plans for every team size</h1>
          <p className="mt-2 text-slate-300">Choose a paid plan after you sign in and assign the right role in the admin dashboard.</p>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
              <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">{plan.name}</p>
              <h2 className="mt-3 text-3xl font-semibold">{plan.price}<span className="text-base text-slate-300"> / month</span></h2>
              <p className="mt-3 text-sm text-slate-300">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
              </ul>
              <button className="mt-6 w-full rounded-2xl border border-brand-blue/40 bg-brand-blue/10 px-4 py-3 text-sm font-semibold">Select {plan.name}</button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
