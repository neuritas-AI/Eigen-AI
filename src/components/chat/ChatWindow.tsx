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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 lg:px-6">
        {selectedConversation && selectedConversation.messages.length > 0 && (
          <div className="mx-auto mb-4 flex w-full max-w-4xl items-center justify-end gap-2">
            <button onClick={onRegenerate} className="rounded-full border border-white/10 bg-white/5 p-2 text-brand-muted hover:text-brand-text" title="Regenerate last response"><RotateCcw size={14} /></button>
            <button onClick={onClear} className="rounded-full border border-white/10 bg-white/5 p-2 text-brand-muted hover:text-brand-text" title="Clear conversation"><Trash2 size={14} /></button>
          </div>
        )}
        {!selectedConversation || selectedConversation.messages.length === 0 ? (
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center text-center">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-brand-purple">Brainz</p>
              <h2 className="mt-4 text-3xl font-semibold text-brand-text">Your Enterprise AI Assistant</h2>
              <p className="mt-3 max-w-xl text-brand-muted">Powered by Neuritas-AI, built for premium AI workflows, fast answers, and secure enterprise-grade chat experiences.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSend(suggestion)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-brand-text transition hover:border-brand-blue/60 hover:bg-white/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {selectedConversation.messages.map((message) => (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={message.role === 'user' ? 'ml-auto max-w-[85%] rounded-3xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 p-4 text-brand-text shadow-glow' : 'mr-auto max-w-[90%] rounded-3xl border border-white/10 bg-white/5 p-4 text-brand-text shadow-lg backdrop-blur-xl'}
              >
                <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-brand-muted">
                  <span>{message.role === 'user' ? 'You' : 'Brainz'}</span>
                  {message.role === 'assistant' && (
                    <button onClick={() => copyMessage(message.content, message.id)} className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10">{copiedId === message.id ? <Sparkles size={14} /> : <Copy size={14} />}</button>
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

      <div className="border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-glow">
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
            className="max-h-36 min-h-[56px] w-full resize-none rounded-2xl bg-transparent px-3 py-3 text-sm text-brand-text outline-none placeholder:text-brand-muted disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-brand-muted">Shift + Enter for newline · {input.length}/2000</div>
            <button
              onClick={() => onSend(input)}
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Brainz is thinking...' : 'Send'} <Send size={14} />
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
