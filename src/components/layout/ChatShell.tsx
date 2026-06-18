"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Menu, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Settings, Sparkles, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import { useChatStore } from '@/store/chat-store';
import { postChatMessage } from '@/services/api';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: session } = useSession();
  const user = session?.user as { email?: string | null; role?: string } | undefined;
  const isAdmin = user?.role === 'ADMIN' || user?.email === 'chat@neuritas-ai.com';
  const { conversations, selectedConversationId, createConversation, selectConversation, addMessage, setLoading, input, setInput, clearConversation } = useChatStore();

  useEffect(() => {
    if (!selectedConversationId && conversations.length === 0) {
      createConversation();
    }
  }, [conversations.length, selectedConversationId, createConversation]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0],
    [conversations, selectedConversationId]
  );

  const regenerateLastResponse = async () => {
    if (!selectedConversation) return;
    const lastUser = [...selectedConversation.messages].reverse().find((message) => message.role === 'user');
    if (!lastUser) return;

    setLoading(true);
    try {
      const response = await postChatMessage(lastUser.content);
      addMessage(selectedConversation.id, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        createdAt: Date.now(),
      });
    } catch {
      toast.error('Unable to regenerate the response.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text) return;

    let conversation = selectedConversation;
    if (!conversation) {
      conversation = createConversation();
    }

    setInput('');
    setLoading(true);
    addMessage(conversation.id, {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    });

    try {
      const data = await postChatMessage(text);
      addMessage(conversation.id, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        createdAt: Date.now(),
      });
      toast.success('Response received');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Unable to reach the AI backend. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-hero-radial text-brand-text">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 p-4 lg:p-6">
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 320 : 88 }}
          className="hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glow backdrop-blur-xl lg:flex lg:flex-col"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <button onClick={() => setSidebarOpen((prev) => !prev)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted hover:text-brand-text">
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            {sidebarOpen && <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="text-brand-purple" size={18} />Brainz</div>}
          </div>

          <button
            onClick={() => createConversation()}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-brand-blue/50 bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 p-3 text-sm font-semibold text-brand-text transition hover:scale-[1.02]"
          >
            <Plus size={16} /> {sidebarOpen ? 'New Chat' : ''}
          </button>

          <div className="mt-6 flex-1 overflow-y-auto">
            {sidebarOpen && <p className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-muted">Recent chats</p>}
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={cn('w-full rounded-2xl border p-3 text-left transition hover:border-brand-blue/60 hover:bg-white/8', conversation.id === selectedConversationId ? 'border-brand-blue/60 bg-white/10' : 'border-white/10 bg-white/5')}
                >
                  <div className="flex items-start gap-3">
                    <Bot size={16} className="mt-1 text-brand-purple" />
                    {sidebarOpen && <div>
                      <div className="text-sm font-medium text-brand-text">{conversation.title}</div>
                      <div className="text-xs text-brand-muted">{conversation.messages.length} messages</div>
                    </div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link href="/profile" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-brand-muted hover:text-brand-text">👤 {sidebarOpen ? 'Profile' : ''}</Link>
            {isAdmin ? (
              <Link href="/settings" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-brand-muted hover:text-brand-text"><Settings size={16} /> {sidebarOpen ? 'Settings' : ''}</Link>
            ) : null}
            {sidebarOpen && <p className="text-xs text-brand-muted">Powered by Neuritas-AI</p>}
          </div>
        </motion.aside>

        <section className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl">
          <header className="border-b border-white/10 p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen((prev) => !prev)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted lg:hidden">
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Brainz</p>
                  <h1 className="text-xl font-semibold">Enterprise AI Assistant</h1>
                </div>
              </div>
              <div className="hidden items-center gap-3 md:flex">
                <span className="rounded-full border border-brand-blue/40 bg-brand-blue/10 px-3 py-1 text-xs text-brand-muted">Model: Llama 3</span>
                <button onClick={regenerateLastResponse} className="rounded-full border border-white/10 bg-white/5 p-3 text-brand-muted hover:text-brand-text" title="Regenerate response"><RotateCcw size={16} /></button>
                <button onClick={() => selectedConversation && clearConversation(selectedConversation.id)} className="rounded-full border border-white/10 bg-white/5 p-3 text-brand-muted hover:text-brand-text" title="Clear chat"><Trash2 size={16} /></button>
                {isAdmin ? <Link href="/settings" className="rounded-full border border-white/10 bg-white/5 p-3 text-brand-muted hover:text-brand-text" title="Settings"><Settings size={16} /></Link> : null}
                <Link href="/profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow" title={session?.user?.email || 'Profile'}><User size={16} /></Link>
              </div>
            </div>
          </header>

          <ChatWindow onSend={sendMessage} onRegenerate={regenerateLastResponse} onClear={() => selectedConversation && clearConversation(selectedConversation.id)} />
        </section>
      </div>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className="fixed inset-y-4 left-4 z-50 flex w-72 flex-col rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-glow backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="text-brand-purple" size={18} />Brainz</div>
              <button onClick={() => setSidebarOpen(false)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted">✕</button>
            </div>
            <button onClick={() => createConversation()} className="mt-4 flex items-center gap-2 rounded-2xl border border-brand-blue/50 bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 p-3 text-sm font-semibold text-brand-text"> <Plus size={16} /> New Chat </button>
            <div className="mt-6 flex-1 space-y-2 overflow-y-auto">{conversations.map((item) => <button key={item.id} onClick={() => { selectConversation(item.id); setSidebarOpen(false); }} className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-left"> <div className="text-sm font-medium text-brand-text">{item.title}</div> <div className="text-xs text-brand-muted">{item.messages.length} messages</div></button>)}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}
