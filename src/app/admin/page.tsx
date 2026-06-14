"use client";

import { FormEvent, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const { data: session } = useSession();
  const user = session?.user as { email?: string | null; role?: string } | undefined;
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'chat@neuritas-ai.com';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [plan, setPlan] = useState('FREE');
  const [users, setUsers] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role, plan }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || 'Unable to create user.');
      return;
    }

    setMessage(`User created: ${email}`);
    setEmail('');
    setPassword('');
    setRole('USER');
    setPlan('FREE');
    await loadUsers();
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Admin access</p>
          <h1 className="text-2xl font-semibold">You need admin rights to open these settings.</h1>
          <p className="text-slate-300">Sign in with the admin account and return here to manage users, plans, and access.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">User management</h1>
          <p className="mt-2 text-slate-300">Create users, assign roles, and set paid plans for your team.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={handleCreateUser} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
            <h2 className="text-xl font-semibold">Add a new user</h2>
            <p className="mt-2 text-sm text-slate-300">The new account can log in immediately.</p>
            <input className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" required />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-200">Role
                <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="text-sm text-slate-200">Plan
                <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="TEAM">TEAM</option>
                </select>
              </label>
            </div>
            <button disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3 font-semibold disabled:opacity-60">{loading ? 'Creating…' : 'Create user'}</button>
            {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
            <h2 className="text-xl font-semibold">Existing users</h2>
            <div className="mt-4 space-y-3">
              {users.map((user) => (
                <article key={user.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{user.email}</p>
                      <p className="text-xs text-slate-300">Role: {user.role} • Plan: {user.plan}</p>
                    </div>
                    <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-xs text-brand-muted">{user.plan}</span>
                  </div>
                </article>
              ))}
              {users.length === 0 ? <p className="text-slate-300">No users yet.</p> : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
