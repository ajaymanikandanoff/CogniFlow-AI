import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Bot, User, Send, X, Minus, Sparkles, RotateCcw, Copy, Check } from 'lucide-react';

/* ── Inline Markdown ── */
function parseInline(text) {
  if (!text) return null;
  const out = []; let key = 0;
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let m, last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    const s = m[0];
    if (s.startsWith('**'))
      out.push(<strong key={key++} style={{ color: 'var(--t1)', fontWeight: 600 }}>{s.slice(2,-2)}</strong>);
    else
      out.push(<code key={key++} className="mono px-1 rounded" style={{ background:'var(--bg-4)', color:'var(--p-text)', fontSize:11 }}>{s.slice(1,-1)}</code>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return out.length ? out : text;
}

function MsgContent({ text }) {
  if (!text) return null;
  const clean = text.trim().replace(/^```(?:markdown)?\s*/, '').replace(/\s*```$/, '');
  return (
    <div className="space-y-1 text-[13px] leading-relaxed" style={{ color: 'var(--t2)' }}>
      {clean.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        if (t.startsWith('### ')) return <p key={i} className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color:'var(--t3)' }}>{parseInline(t.slice(4))}</p>;
        if (t.startsWith('# ') || t.startsWith('## '))
          return <p key={i} className="font-bold text-sm" style={{ color:'var(--t1)' }}>{parseInline(t.replace(/^#+\s*/,''))}</p>;
        if (t.startsWith('* ') || t.startsWith('- '))
          return <div key={i} className="flex gap-2"><span style={{ color:'var(--t3)', marginTop:2 }}>–</span><span>{parseInline(t.slice(2))}</span></div>;
        const nm = t.match(/^(\d+)\.\s+(.*)/);
        if (nm) return <div key={i} className="flex gap-2"><span className="mono" style={{ color:'var(--t3)', flexShrink:0 }}>{nm[1]}.</span><span>{parseInline(nm[2])}</span></div>;
        return <p key={i}>{parseInline(line)}</p>;
      })}
    </div>
  );
}

const QUICK = [
  "What should I study today?",
  "Explain this topic simply",
  "Quiz me on my weakest topic",
  "Give me 3 practice questions",
];

export default function AICoachPanel() {
  const navigate = useNavigate();
  const endRef = useRef(null);

  const [open, setOpen]   = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(null);

  const [msgs, setMsgs] = useState([{
    role: 'ai',
    text: 'Hey! 👋 I\'m your **AI Study Coach** — powered by **3-Cloud AI** (Gemini + Groq + OpenRouter).\n\nAsk me anything about your syllabus, formulas, or revision plan.',
    ts: now()
  }]);

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading, open]);

  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setMsgs(p => [...p, { role: 'user', text, ts: now() }]);
    if (!override) setInput('');
    setLoading(true);
    try {
      const hist = msgs.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      const res = await api.askAICoach({ query: text, history: hist });
      setMsgs(p => [...p, { role: 'ai', text: res.answer || res.reply, ts: now(), model: res.model }]);
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Could not reach the AI. Check your connection.', ts: now() }]);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, i) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const clear = () => setMsgs([{
    role: 'ai', text: 'Chat cleared. Ask me anything!', ts: now()
  }]);

  return (
    <>
      {/* FAB */}
      <button
        className="ai-fab"
        onClick={() => setOpen(v => !v)}
        title="Open AI Coach"
        id="ai-coach-fab"
      >
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="ai-panel">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--p)' }}
              >
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>AI Study Coach</p>
                <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--t3)' }}>
                  <span className="live-dot" />3-Cloud Consensus
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clear} className="p-1.5 rounded-lg hover:bg-[var(--bg-3)] transition" style={{ color:'var(--t3)' }} title="Clear chat">
                <RotateCcw size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-3)] transition" style={{ color:'var(--t3)' }}>
                <Minus size={14} />
              </button>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b shrink-0" style={{ borderColor:'var(--line)' }}>
            {QUICK.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                className="tag tag-muted whitespace-nowrap cursor-pointer transition-all hover:border-[var(--p-mid)] hover:text-[var(--p-text)]"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: m.role === 'user' ? 'var(--p)' : 'var(--bg-4)',
                    border: m.role === 'ai' ? '1px solid var(--line)' : 'none'
                  }}
                >
                  {m.role === 'user'
                    ? <User size={12} className="text-white" />
                    : <Bot size={12} style={{ color: 'var(--p-text)' }} />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] ${m.role === 'user' ? 'bubble-user' : 'bubble-ai'} group relative`}>
                  {m.role === 'user'
                    ? <p className="text-[13px] leading-relaxed">{m.text}</p>
                    : <MsgContent text={m.text} />
                  }
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-1.5 gap-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 4 }}>
                    <span className="mono text-[10px]"
                      style={{ color: m.role === 'user' ? 'rgba(255,255,255,0.5)' : 'var(--t3)' }}>
                      {m.ts}
                    </span>
                    {m.role === 'ai' && (
                      <button
                        onClick={() => copy(m.text, i)}
                        className="text-[10px] flex items-center gap-1 transition-colors"
                        style={{ color: 'var(--t3)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}
                      >
                        {copied === i ? <><Check size={10} style={{color:'var(--ok)'}}/> Copied</> : <><Copy size={10}/> Copy</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--bg-4)', border: '1px solid var(--line)' }}>
                  <Bot size={12} style={{ color: 'var(--p-text)' }} />
                </div>
                <div className="bubble-ai">
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                  <p className="mono text-[10px] mt-1" style={{ color:'var(--t3)' }}>
                    Gemini → Groq → OpenRouter…
                  </p>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--line)' }}>
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about your syllabus…"
                className="input text-[13px] flex-1"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                id="ai-send-btn"
                className="btn btn-primary btn-sm px-3 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
