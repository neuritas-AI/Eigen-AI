'use client';

import { useEffect, useState } from 'react';

interface ModelProvider {
  id: string;
  key: string;
  name: string;
  active: boolean;
  priority: number;
  pricePerMsg: number;
}

export default function ModelManagementPanel() {
  const [models, setModels] = useState<ModelProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadModels() {
    setLoading(true);
    const res = await fetch('/api/admin/models');
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setModels(data.models || []);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  async function updateModel(index: number, updates: Partial<ModelProvider>) {
    const model = models[index];
    const body = { key: model.key, ...updates };
    const res = await fetch('/api/admin/models', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Unable to update model.');
      return;
    }
    setModels((current) => current.map((item, i) => (i === index ? { ...item, ...updates } : item)));
    setMessage('Model updated.');
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Model management</h2>
          <p className="mt-2 text-sm text-slate-300">Enable or disable models, adjust priority and pricing.</p>
        </div>
        <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-xs text-brand-muted">Admin</span>
      </div>

      {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-300">Loading models…</p>
        ) : models.length === 0 ? (
          <p className="text-sm text-slate-300">No model providers configured.</p>
        ) : (
          models.map((model, index) => (
            <div key={model.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{model.name}</p>
                  <p className="text-xs text-slate-400">Key: {model.key}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Active
                  <input
                    type="checkbox"
                    checked={model.active}
                    onChange={(event) => updateModel(index, { active: event.target.checked })}
                    className="h-4 w-4 rounded border-white/10 bg-slate-800"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-300">Priority
                  <input
                    type="number"
                    value={model.priority}
                    onChange={(event) => updateModel(index, { priority: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-brand-text"
                  />
                </label>
                <label className="text-sm text-slate-300">Credits per message
                  <input
                    type="number"
                    value={model.pricePerMsg}
                    onChange={(event) => updateModel(index, { pricePerMsg: Number(event.target.value) })}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-brand-text"
                  />
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
