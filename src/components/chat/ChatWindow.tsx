"use client";

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, RotateCcw, Send, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useChatStore } from '@/store/chat-store';

const suggestions = [
  'How can AI improve my business?',
  'Create a sales strategy',
  'Generate a marketing plan',
  'Analyze business opportunities',
];

export default function ChatWindow({ onSend, onRegenerate, onClear }: { onSend: (message: string) => Promise<void>; onRegenerate: () => Promise<void>; onClear: () => void; }) {
  const { conversations, selectedConversationId, input, setInput, isLoading } = useChatStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0],
    [conversations, selectedConversationId]
  );

  const copyMessage = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Message copied');
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/50">
      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5 lg:px-6">
        {selectedConversation && selectedConversation.messages.length > 0 && (
          <div className="mx-auto mb-4 flex w-full max-w-5xl items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 shadow-soft backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-muted">Conversation</p>
              <p className="text-sm font-semibold text-brand-text">{selectedConversation.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onRegenerate} className="rounded-full border border-white/10 bg-white/5 p-2 text-brand-muted transition hover:text-brand-text" title="Regenerate last response"><RotateCcw size={14} /></button>
              <button onClick={onClear} className="rounded-full border border-white/10 bg-white/5 p-2 text-brand-muted transition hover:text-brand-text" title="Clear conversation"><Trash2 size={14} /></button>
            </div>
          </div>
        )}

        {!selectedConversation || selectedConversation.messages.length === 0 ? (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex min-h-[58vh] w-full max-w-5xl flex-col items-center justify-center text-center">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-purple">Brainz</p>
              <h2 className="mt-4 text-4xl font-semibold text-brand-text">Your Enterprise AI Assistant</h2>
              <p className="mt-3 max-w-2xl text-sm text-brand-muted">Powered by Neuritas-AI, delivering premium workflows, intelligent guidance, and secure chat experiences for your teams.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSend(suggestion)}
                    className="rounded-[28px] border border-white/10 bg-slate-900 px-5 py-4 text-left text-sm text-brand-text transition hover:border-brand-blue/60 hover:bg-white/5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
            {selectedConversation.messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={message.role === 'user'
                  ? 'ml-auto max-w-[84%] rounded-[32px] border border-brand-blue/30 bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 p-5 text-brand-text shadow-glow'
                  : 'mr-auto max-w-[92%] rounded-[32px] border border-white/10 bg-white/5 p-5 text-brand-text shadow-soft backdrop-blur-xl'}
              >
                <div className="mb-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-brand-muted">
                  <span>{message.role === 'user' ? 'You' : 'Brainz'}</span>
                  {message.role === 'assistant' && (
                    <button onClick={() => copyMessage(message.content, message.id)} className="rounded-full border border-white/10 bg-white/5 p-2 transition hover:bg-white/10">
                      {copiedId === message.id ? <Sparkles size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <div className="prose prose-invert max-w-none text-sm text-brand-text prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-slate-950/90 prose-code:rounded prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              </motion.article>
            ))}
            {isLoading && <TypingIndicator />}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[32px] border border-white/10 bg-slate-950/90 p-4 shadow-panel">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend(input);
              }
            }}
            placeholder="Ask Brainz anything..."
            rows={1}
            disabled={isLoading}
            className="min-h-[64px] w-full resize-none rounded-3xl border border-white/10 bg-slate-900 px-4 py-4 text-sm text-brand-text outline-none placeholder:text-brand-muted disabled:cursor-not-allowed"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-brand-muted">Shift + Enter for newline · {input.length}/2000</div>
            <button
              onClick={() => onSend(input)}
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-5 py-3 text-sm font-semibold text-white shadow-glow transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Brainz is thinking...' : 'Send message'}
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mr-auto max-w-[90%] rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">Brainz <span className="inline-flex gap-1"><span className="h-2 w-2 rounded-full bg-brand-blue animate-bounce" /> <span className="h-2 w-2 rounded-full bg-brand-purple animate-bounce [animation-delay:120ms]" /> <span className="h-2 w-2 rounded-full bg-brand-blue animate-bounce [animation-delay:240ms]" /></span></div>
      <div className="mt-2 text-sm text-brand-muted">Brainz is thinking through your request...</div>
    </motion.div>
  );
}
