import { useState, useRef, useEffect } from "react";

const API = window.APP_CONFIG?.API_URL || "http://localhost:8000";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink: #0f0e0c;
  --paper: #f7f3ec;
  --cream: #efe9de;
  --sand: #d9d0c0;
  --rust: #c0392b;
  --rust-light: #e8d5d3;
  --gold: #b8860b;
  --gold-light: #f5e6c0;
  --sage: #4a7c59;
  --muted: #8a8070;
  --surface: #faf7f2;
  --border: #d4cbb8;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
}

.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;
}

.sidebar {
  background: var(--ink);
  color: var(--paper);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
}

.sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 1px; height: 100%;
  background: linear-gradient(180deg, transparent, var(--gold), transparent);
  opacity: 0.4;
}

.sidebar-header {
  padding: 32px 28px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 900;
  color: var(--paper);
}

.logo-accent { color: var(--gold); }

.logo-sub {
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: 'DM Mono', monospace;
  margin-top: 4px;
}

.sidebar-section {
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.section-label {
  font-size: 9px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  font-family: 'DM Mono', monospace;
  margin-bottom: 14px;
}

.upload-zone {
  border: 1px dashed rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s;
  background: rgba(255,255,255,0.03);
}

.upload-zone:hover, .upload-zone.drag { border-color: var(--gold); background: rgba(184,134,11,0.08); }
.upload-zone input { display: none; }
.upload-icon { font-size: 22px; margin-bottom: 8px; display: block; opacity: 0.6; }
.upload-text { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.6; }
.upload-text strong { color: var(--gold); font-weight: 500; }

.upload-progress {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; margin-top: 10px;
  background: rgba(184,134,11,0.1);
  border: 1px solid rgba(184,134,11,0.3);
  border-radius: 6px;
}

.spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(184,134,11,0.3);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.upload-progress-text { font-size: 11px; color: var(--gold); font-family: 'DM Mono', monospace; }

.doc-list { display: flex; flex-direction: column; gap: 6px; }

.doc-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  transition: all 0.2s;
  animation: slideIn 0.3s ease both;
}

.doc-item:hover { background: rgba(255,255,255,0.07); }

.doc-dot {
  width: 6px; height: 6px;
  background: var(--sage);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px var(--sage);
}

.doc-name {
  flex: 1; font-size: 11px;
  color: rgba(255,255,255,0.55);
  font-family: 'DM Mono', monospace;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.doc-delete {
  background: none; border: none;
  color: rgba(255,255,255,0.2);
  cursor: pointer; font-size: 14px;
  padding: 2px 4px; border-radius: 3px;
  transition: all 0.15s; line-height: 1;
}

.doc-delete:hover { color: var(--rust); background: rgba(192,57,43,0.15); }
.no-docs { font-size: 11px; color: rgba(255,255,255,0.2); font-family: 'DM Mono', monospace; text-align: center; padding: 10px; }

.modes { display: flex; flex-direction: column; gap: 4px; }

.mode-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px;
  background: transparent; border: 1px solid transparent;
  border-radius: 6px;
  color: rgba(255,255,255,0.45);
  font-family: 'DM Sans', sans-serif; font-size: 13px;
  cursor: pointer; transition: all 0.15s;
  text-align: left; width: 100%;
}

.mode-btn:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border-color: rgba(255,255,255,0.1); }
.mode-btn.active { background: rgba(184,134,11,0.12); border-color: rgba(184,134,11,0.35); color: var(--gold); }
.mode-icon { font-size: 14px; width: 20px; text-align: center; }
.mode-active-dot { width: 5px; height: 5px; background: var(--gold); border-radius: 50%; opacity: 0; transition: opacity 0.15s; margin-left: auto; }
.mode-btn.active .mode-active-dot { opacity: 1; }

.sidebar-footer {
  padding: 20px 28px; margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.status-row { display: flex; align-items: center; gap: 8px; font-size: 11px; color: rgba(255,255,255,0.3); font-family: 'DM Mono', monospace; }
.status-indicator { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.15); transition: all 0.3s; }
.status-indicator.online { background: var(--sage); box-shadow: 0 0 8px var(--sage); }
.status-indicator.error { background: var(--rust); }

.main { display: flex; flex-direction: column; background: var(--surface); overflow: hidden; position: relative; }

.main::before {
  content: '';
  position: absolute; top: 0; right: 0;
  width: 400px; height: 400px;
  background: radial-gradient(circle at top right, rgba(184,134,11,0.05), transparent 60%);
  pointer-events: none;
}

.topbar {
  padding: 18px 36px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface); position: relative; z-index: 10;
}

.topbar-left { display: flex; align-items: center; gap: 14px; }

.mode-badge {
  display: flex; align-items: center; gap: 7px;
  background: var(--gold-light);
  border: 1px solid rgba(184,134,11,0.3);
  border-radius: 4px; padding: 5px 12px;
  font-size: 11px; font-weight: 600;
  color: var(--gold); font-family: 'DM Mono', monospace;
  letter-spacing: 1px; text-transform: uppercase;
}

.topbar-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--ink); font-weight: 400; }

.doc-count-badge {
  font-size: 11px; color: var(--muted);
  font-family: 'DM Mono', monospace;
  background: var(--cream); border: 1px solid var(--border);
  border-radius: 4px; padding: 4px 10px;
}

.messages {
  flex: 1; overflow-y: auto;
  padding: 40px 36px;
  display: flex; flex-direction: column; gap: 28px;
  scrollbar-width: thin; scrollbar-color: var(--sand) transparent;
}

.messages::-webkit-scrollbar { width: 4px; }
.messages::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 4px; }

.welcome {
  margin: auto; max-width: 520px;
  text-align: center;
  animation: fadeUp 0.6s ease both;
}

.welcome-ornament { font-size: 52px; margin-bottom: 20px; display: block; }

.welcome h2 {
  font-family: 'Playfair Display', serif;
  font-size: 32px; font-weight: 700;
  color: var(--ink); margin-bottom: 12px; line-height: 1.2;
}

.welcome-sub { font-size: 14px; color: var(--muted); line-height: 1.75; margin-bottom: 32px; }

.divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.divider-line { flex: 1; height: 1px; background: var(--border); }
.divider-text { font-size: 10px; color: var(--muted); letter-spacing: 2px; text-transform: uppercase; font-family: 'DM Mono', monospace; }

.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.quick-btn {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--ink); border-radius: 6px; padding: 10px 14px;
  font-size: 12px; font-family: 'DM Sans', sans-serif;
  cursor: pointer; transition: all 0.2s; text-align: left; line-height: 1.4;
}

.quick-btn:hover {
  border-color: var(--gold); background: var(--gold-light);
  color: var(--gold); transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.message { display: flex; gap: 16px; animation: fadeUp 0.3s ease both; }
.message.user { flex-direction: row-reverse; }

.avatar {
  width: 36px; height: 36px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px; font-size: 14px;
}

.avatar.user-av { background: var(--ink); color: var(--paper); font-family: 'Playfair Display', serif; font-weight: 700; font-size: 15px; }
.avatar.agent-av { background: var(--gold-light); border: 1px solid rgba(184,134,11,0.3); }

.bubble-wrap { display: flex; flex-direction: column; gap: 4px; max-width: 74%; }
.message.user .bubble-wrap { align-items: flex-end; }

.bubble-meta { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; letter-spacing: 0.5px; padding: 0 4px; }

.bubble { padding: 14px 18px; border-radius: 10px; font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
.bubble.user { background: var(--ink); color: var(--paper); border-bottom-right-radius: 3px; }
.bubble.agent { background: white; border: 1px solid var(--border); color: var(--ink); border-bottom-left-radius: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.bubble.error { background: var(--rust-light); border-color: rgba(192,57,43,0.25); color: var(--rust); }

.typing { display: flex; align-items: center; gap: 5px; padding: 4px 2px; }
.typing span { width: 7px; height: 7px; background: var(--sand); border-radius: 50%; animation: bounce 1.3s infinite; }
.typing span:nth-child(2) { animation-delay: 0.15s; }
.typing span:nth-child(3) { animation-delay: 0.3s; }

.input-area {
  padding: 20px 36px 28px;
  border-top: 1px solid var(--border);
  background: var(--surface); position: relative; z-index: 10;
}

.input-wrap {
  background: white; border: 1.5px solid var(--border);
  border-radius: 10px; transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.input-wrap:focus-within { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(184,134,11,0.08); }

.input-row { display: flex; align-items: flex-end; padding: 12px 14px; gap: 10px; }

textarea {
  flex: 1; background: transparent; border: none; outline: none;
  font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
  resize: none; min-height: 24px; max-height: 140px; line-height: 1.65;
}

textarea::placeholder { color: var(--sand); }

.send-btn {
  width: 36px; height: 36px; background: var(--ink);
  border: none; border-radius: 7px; color: var(--paper);
  font-size: 16px; cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}

.send-btn:hover:not(:disabled) { background: var(--gold); transform: translateY(-1px); box-shadow: 0 4px 10px rgba(184,134,11,0.3); }
.send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.input-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px 10px; border-top: 1px solid var(--cream);
}

.input-hint { font-size: 10px; color: var(--muted); font-family: 'DM Mono', monospace; }

.reset-btn {
  background: none; border: none; font-size: 10px;
  color: var(--muted); cursor: pointer;
  font-family: 'DM Mono', monospace; letter-spacing: 0.5px;
  transition: color 0.15s; padding: 2px 4px;
}

.reset-btn:hover { color: var(--rust); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const MODES = [
  { id: "chat",      icon: "◆", label: "Free Chat",  desc: "Ask anything" },
  { id: "quiz",      icon: "◈", label: "Quiz Mode",  desc: "Practice questions" },
  { id: "summary",   icon: "◉", label: "Summarize",  desc: "Concise overviews" },
  { id: "flashcard", icon: "◇", label: "Flashcards", desc: "Q&A cards" },
];

const QUICK = [
  "What are the key topics covered?",
  "Summarize the most important concepts",
  "Generate 5 practice questions",
  "What should I focus on for the exam?",
  "Create flashcards for this material",
  "Explain the hardest concept simply",
];

export default function ExamPrepAgent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [docs, setDocs] = useState([]);
  const [status, setStatus] = useState("checking");
  const [drag, setDrag] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { checkHealth(); fetchDocs(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const checkHealth = async () => {
    try {
      const r = await fetch(`${API}/health`);
      setStatus(r.ok ? "online" : "error");
    } catch { setStatus("error"); }
  };

  const fetchDocs = async () => {
    try {
      const r = await fetch(`${API}/documents`);
      const d = await r.json();
      setDocs(d.documents || []);
    } catch {}
  };

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach(f => form.append("files", f));
    try {
      const r = await fetch(`${API}/upload`, { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      await fetchDocs();
      setMessages(prev => [...prev, {
        role: "agent",
        content: `✓ Indexed: ${d.files.join(", ")}\n\nYour study material is ready. Ask me anything about it.`
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "agent", content: `Upload failed: ${e.message}`, error: true }]);
    } finally { setUploading(false); }
  };

  const deleteDoc = async (name) => {
    try {
      await fetch(`${API}/documents/${encodeURIComponent(name)}`, { method: "DELETE" });
      setDocs(prev => prev.filter(d => d !== name));
    } catch {}
  };

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, namespace: "default", mode }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setMessages(prev => [...prev, { role: "agent", content: d.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "agent", content: e.message, error: true }]);
    } finally { setLoading(false); }
  };

  const resetChat = async () => {
    try {
      await fetch(`${API}/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ namespace: "default" }) });
    } catch {}
    setMessages([]);
  };

  const currentMode = MODES.find(m => m.id === mode);

  return (
    <>
      <style>{css}</style>
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-text">Exam<span className="logo-accent">Prep</span></div>
            <div className="logo-sub">AI Study Assistant</div>
          </div>

          <div className="sidebar-section">
            <div className="section-label">Study Material</div>
            <div
              className={`upload-zone ${drag ? "drag" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleUpload(e.dataTransfer.files); }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={e => handleUpload(e.target.files)} />
              <span className="upload-icon">⊕</span>
              <div className="upload-text"><strong>Drop PDFs here</strong><br />or click to browse</div>
            </div>
            {uploading && (
              <div className="upload-progress">
                <div className="spinner" />
                <span className="upload-progress-text">Indexing document...</span>
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <div className="section-label">Documents ({docs.length})</div>
            <div className="doc-list">
              {docs.length === 0
                ? <div className="no-docs">no documents yet</div>
                : docs.map(d => (
                  <div key={d} className="doc-item">
                    <div className="doc-dot" />
                    <span className="doc-name">{d}</span>
                    <button className="doc-delete" onClick={() => deleteDoc(d)}>×</button>
                  </div>
                ))
              }
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-label">Study Mode</div>
            <div className="modes">
              {MODES.map(m => (
                <button key={m.id} className={`mode-btn ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)}>
                  <span className="mode-icon">{m.icon}</span>
                  <span>{m.label}</span>
                  <div className="mode-active-dot" />
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="status-row">
              <div className={`status-indicator ${status}`} />
              <span>{status === "online" ? "api connected" : status === "error" ? "api offline" : "connecting..."}</span>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="mode-badge">{currentMode?.icon} {currentMode?.label}</div>
              <div className="topbar-title">{currentMode?.desc}</div>
            </div>
            <div className="doc-count-badge">{docs.length} doc{docs.length !== 1 ? "s" : ""} indexed</div>
          </div>

          <div className="messages">
            {messages.length === 0 && !loading && (
              <div className="welcome">
                <span className="welcome-ornament">📖</span>
                <h2>Ready to Study?</h2>
                <p className="welcome-sub">Upload your lecture notes, textbooks, or any PDF. Then ask questions, generate quizzes, or create flashcards — powered by your own material.</p>
                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">Quick Start</span>
                  <div className="divider-line" />
                </div>
                <div className="quick-grid">
                  {QUICK.map(q => <button key={q} className="quick-btn" onClick={() => sendMessage(q)}>{q}</button>)}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className={`avatar ${msg.role === "user" ? "user-av" : "agent-av"}`}>
                  {msg.role === "user" ? "U" : "✦"}
                </div>
                <div className="bubble-wrap">
                  <div className="bubble-meta">{msg.role === "user" ? "YOU" : "EXAMPREP AI"}</div>
                  <div className={`bubble ${msg.role} ${msg.error ? "error" : ""}`}>{msg.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message agent">
                <div className="avatar agent-av">✦</div>
                <div className="bubble-wrap">
                  <div className="bubble-meta">EXAMPREP AI</div>
                  <div className="bubble agent"><div className="typing"><span /><span /><span /></div></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrap">
              <div className="input-row">
                <textarea
                  ref={textareaRef}
                  placeholder={`${currentMode?.desc}...`}
                  value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                />
                <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>↑</button>
              </div>
              <div className="input-footer">
                <span className="input-hint">enter to send · shift+enter for new line</span>
                <button className="reset-btn" onClick={resetChat}>clear session</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
