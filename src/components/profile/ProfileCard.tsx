"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfileCard({ session }: { session: any }) {
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { update } = useSession();

  useEffect(() => {
    setProfileName(session?.user?.name || session?.user?.profileName || '');
    setProfileImage(session?.user?.image || session?.user?.profileImage || '');
  }, [session]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      setProfileImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName, password, profileImage }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to update profile.');
      }

      await update({ name: profileName || session?.user?.email || 'User', image: profileImage || null });
      setMessage('Profile updated successfully.');
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-glow">
      <h2 className="text-xl font-semibold">Profile details</h2>
      <form onSubmit={saveProfile} className="mt-4 space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-brand-blue to-brand-purple">
            {profileImage ? <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white">{(profileName || session?.user?.email || 'U').charAt(0).toUpperCase()}</div>}
          </div>
          <label className="flex-1 rounded-2xl border border-dashed border-white/15 bg-white/5 p-3 text-sm text-slate-200 cursor-pointer">
            Upload profile photo
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <label className="block text-sm text-slate-200">Display name
          <input className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your profile name" />
        </label>
        <label className="block text-sm text-slate-200">New password
          <input className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
        </label>
        <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3 font-semibold disabled:opacity-60">{loading ? 'Saving…' : 'Save profile'}</button>
        {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
      </form>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <p>Email: {session?.user?.email}</p>
        <p className="mt-1">Role: {(session?.user as any)?.role || 'USER'}</p>
        <p className="mt-1">Plan: {(session?.user as any)?.plan || 'FREE'}</p>
      </div>
    </section>
  );
}
