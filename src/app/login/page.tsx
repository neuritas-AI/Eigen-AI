"use client";

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await signIn('credentials', { email, password, callbackUrl: '/chat' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow">
        <h1 className="text-2xl font-semibold">Neuritas-AI Login</h1>
        <p className="mt-2 text-sm text-slate-300">Sign in to access your AI workspace.</p>
        <p className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">Use chat@neuritas-ai.com as the admin demo account. On your first login, enter the password you want to set for this admin account.</p>
        <input className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3 font-semibold">Sign In</button>
      </form>
    </main>
  );
}
