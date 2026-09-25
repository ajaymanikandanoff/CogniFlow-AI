import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Bot, User, Send, Sparkles, BookOpen, RotateCcw, Copy, Check, Brain } from 'lucide-react';

/* ── Inline markdown parser ──────────────────────────── */
function parseInline(text) {
  if (!text) return null;
  const out = [];
  let i = 0, key = 0;
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
  let m, last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const s = m[0];
    if (s.startsWith('**'))
      out.push(<strong key={key++} className="font-semibold txt-1">{s.slice(2,-2)}</strong>);
    else if (s.startsWith('`'))
      out.push(<code key={key++} className="mono px-1.5 py-0.5 surface-raised rounded text-indigo-400 text-[11px]">{s.slice(1,-1)}</code>);
    else
      out.push(<span key={key++} className="mono txt-2">{s.slice(1,-1)}</span>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return out.length ? out : text;
}

function MsgContent({ text }) {
  if (!text) return null;
  const clean = text.trim().replace(/^```(?:markdown)?\s*/, '').replace(/\s*```$/, '');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {clean.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (t.startsWith('### ')) return <h4 key={i} className="text-xs font-semibold txt-3 uppercase tracking-wider mt-3">{parseInline(t.slice(4))}</h4>;
        if (t.startsWith('## ') || t.startsWith('# '))  return <h3 key={i} className="text-sm font-bold txt-1 mt-3 mb-1">{parseInline(t.replace(/^#+\s*/,''))}</h3>;
        if (t.startsWith('$$') && t.endsWith('$$'))
          return <div key={i} className="my-2 p-3 surface-raised rounded-lg mono text-center text-indigo-300 text-[12px]">{t.slice(2,-2).trim()}</div>;
        if (t.startsWith('* ') || t.startsWith('- '))
          return <div key={i} className="flex gap-2.5 pl-1"><span className="txt-3 mt-0.5 shrink-0">–</span><span className="txt-2">{parseInline(t.slice(2))}</span></div>;
        const nm = t.match(/^(\d+)\.\s+(.*)/);
        if (nm) return <div key={i} className="flex gap-2.5 pl-1"><span className="txt-3 mono shrink-0">{nm[1]}.</span><span className="txt-2">{parseInline(nm[2])}</span></div>;
        return <p key={i} className="txt-2">{parseInline(line)}</p>;
      })}
    </div>
  );
}

/* ── Component ──────────────────────────────────────── */
export default function AICoachPage() {
  const location = useLocation();
  const endRef = useRef(null);

  const [msgs, setMsgs] = useState([{
    sender: 'coach',
    text: `Hello! I'm your **AI Study Coach** — powered by **3-Cloud AI Consensus** (Gemini + Groq 120B + OpenRouter).\n\nI have context of your syllabus, marks, and weak topics. What do you want to work on today?`,
    ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    model: '3-Cloud AI'
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(null);

  const prompts = [
    "What should I study today?",
    "Explain this topic simply",
    "Which topic needs urgent revision?",
    "Give me 3 practice questions"
  ];

  useEffect(() => {
    if (location.state?.initialQuery) send(location.state.initialQuery);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = async (override) => {
    const text = override || input;
    if (!text.trim() || loading) return;
    setMsgs(p => [...p, { sender: 'user', text, ts: now() }]);
    if (!override) setInput('');
    setLoading(true);
    try {
      const history = msgs.filter(m => m.text).slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const res = await api.askAICoach({ query: text, history });
      setMsgs(p => [...p, {
        sender: 'coach',
        text: res.answer || res.reply,
        ts: now(),
        model: res.model || '3-Cloud AI',
        groundedIn: res.groundedIn || []
      }]);
    } catch {
      setMsgs(p => [...p, { sender: 'coach', text: 'Could not reach the AI service. Please check your connection.', ts: now(), model: 'Offline' }]);
    } finally { setLoading(false); }
  };

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const copy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const clear = () => setMsgs([{
    sender: 'coach',
    text: 'Chat cleared. Ask me anything!',
    ts: now(), model: '3-Cloud AI'
  }]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5 page-enter">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 anim-up">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="tag tag-muted text-[11px] flex items-center gap-1.5">
              <Brain size={11} className="accent-txt" /> AI Study Coach
            </span>
            <span className="tag tag-green live-dot text-[10px]">3-Cloud Active</span>
          </div>
          <h1 className="text-2xl font-display font-bold txt-1">AI Revision Assistant</h1>
          <p className="text-xs txt-2">
            Grounded in your syllabus · Gemini synthesizes · Groq audits math · OpenRouter verifies
          </p>
        </div>
        <button onClick={clear} className="btn btn-secondary text-xs self-start">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar anim-right delay-2">
        <Sparkles size={13} className="accent-txt shrink-0" />
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => send(p)}
            className="tag tag-muted cursor-pointer hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-indigo-500/8 transition-all whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="card flex flex-col overflow-hidden anim-scale delay-3" style={{ height: '560px' }}>

        {/* Chat top bar */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium txt-1">3-Cloud AI Consensus</span>
            <span className="text-[11px] txt-3 hidden sm:inline font-mono">Gemini · Groq · OpenRouter</span>
          </div>
          <span className="tag tag-green text-[10px]">99.9% verified</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex items-end gap-3 fade-in ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user'
                  ? 'bg-indigo-500'
                  : 'bg-[var(--bg-raised)] border border-[var(--border)]'
              }`}>
                {m.sender === 'user'
                  ? <User size={13} className="text-white" />
                  : <Bot size={13} className="accent-txt" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] px-4 py-3 group relative ${
                m.sender === 'user'
                  ? 'bubble-user text-sm font-medium'
                  : 'bubble-ai'
              }`}>
                {m.sender === 'user'
                  ? <p className="text-[13px] leading-relaxed">{m.text}</p>
                  : <MsgContent text={m.text} />
                }

                {m.groundedIn?.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex items-center gap-1.5 text-[11px] txt-3">
                    <BookOpen size={11} className="accent-txt" />
                    {m.groundedIn.map(g => `${g.topic} (${g.subject})`).join(', ')}
                  </div>
                )}

                {/* Footer */}
                <div className={`flex items-center justify-between mt-2 pt-1.5 border-t text-[10px] ${
                  m.sender === 'user' ? 'border-white/10 text-white/50' : 'border-[var(--border)] txt-3'
                }`}>
                  <span className="mono">{m.model || (m.sender === 'user' ? 'You' : '3-Cloud')}</span>
                  <div className="flex items-center gap-2">
                    {m.sender === 'coach' && (
                      <button
                        onClick={() => copy(m.text, i)}
                        className="hover:txt-1 transition flex items-center gap-1"
                      >
                        {copied === i
                          ? <><Check size={11} className="text-green-400" /> Copied</>
                          : <><Copy size={11} /> Copy</>
                        }
                      </button>
                    )}
                    <span className="mono">{m.ts}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div className="flex items-end gap-3">
              <div className="w-7 h-7 surface-raised border border-[var(--border)] rounded-xl flex items-center justify-center">
                <Bot size={13} className="accent-txt" />
              </div>
              <div className="bubble-ai px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <p className="text-[10px] txt-3 mt-1.5 mono">Gemini → Groq → OpenRouter…</p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]">
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about any topic in your syllabus..."
              className="input flex-1 text-[13px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              id="ai-send-btn"
              className="btn btn-primary text-xs px-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
