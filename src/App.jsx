const { useState, useRef, useEffect, useCallback } = React;

const API_URL = "http://localhost:8000/chat";

const STARTERS = [
  { icon: "◐", title: "What is the MS ADS program?", hint: "Overview & structure" },
  { icon: "◇", title: "What courses are required?",  hint: "Core curriculum" },
  { icon: "◈", title: "How do I apply?",              hint: "Admissions process" },
  { icon: "◉", title: "What are capstone projects?",  hint: "Capstone overview" },
];

const K_OPTIONS = [3, 5, 8];

// Return a clean URL from backend source object.
// Expected backend shape:
// { url: "https://...", chunk_id: 1, preview: "..." }
function sourceUrl(source) {
  return source?.url || source?.source_url || "";
}

function shortUrl(url) {
  if (!url) return "Unknown source";
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function App() {
  const [messages, setMessages] = useState([]); // {role, content, sources?, error?, id}
  const [input, setInput] = useState("");
  const [k, setK] = useState(3);
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Auto-focus input on load
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = useCallback(async (questionText) => {
    const question = (questionText ?? input).trim();
    if (!question || loading) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, k }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer ?? "(No answer returned.)",
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          error: true,
          content:
            "Couldn't reach the assistant. Make sure the backend is running at " +
            API_URL +
            " and that CORS is enabled. (" + (err?.message || "network error") + ")",
        },
      ]);
    } finally {
      setLoading(false);
      // Refocus input
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [input, k, loading]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    if (loading) return;
    setMessages([]);
  };

  return (
    <div className="app">
      <Header onClear={clearChat} hasMessages={messages.length > 0} />

      <main className="scroller" ref={scrollerRef}>
        <div className="thread">
          {messages.length === 0 ? (
            <EmptyState onPick={(q) => send(q)} />
          ) : (
            messages.map((m) => <MessageRow key={m.id} message={m} />)
          )}
          {loading && <ThinkingRow />}
        </div>
      </main>

      <Composer
        input={input}
        setInput={setInput}
        onSend={() => send()}
        onKeyDown={onKeyDown}
        k={k}
        setK={setK}
        loading={loading}
        inputRef={inputRef}
      />
    </div>
  );
}

/* ---------- Header ---------- */

function Header({ onClear, hasMessages }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="seal" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="0.6" />
              <text x="20" y="24" textAnchor="middle" fontFamily="Crimson Pro, serif" fontSize="13" fontWeight="600" fill="currentColor">ADS</text>
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="title">MS ADS Program Assistant</h1>
            <p className="subtitle">
              Ask questions about the University of Chicago MS in Applied Data Science program
            </p>
          </div>
        </div>
        {hasMessages && (
          <button className="ghost-btn" onClick={onClear} title="Start a new conversation">
            <span className="ghost-btn-icon">↺</span> New chat
          </button>
        )}
      </div>
      <div className="header-rule" />
    </header>
  );
}

/* ---------- Empty state with starter prompts ---------- */

function EmptyState({ onPick }) {
  return (
    <div className="empty">
      <div className="empty-eyebrow">Start a conversation</div>
      <h2 className="empty-title">
        How can I help you<br />explore the program?
      </h2>
      <p className="empty-lede">
        I draw answers from official MS in Applied Data Science materials. Pick a starter below
        or type your own question.
      </p>

      <div className="starter-grid">
        {STARTERS.map((s) => (
          <button key={s.title} className="starter" onClick={() => onPick(s.title)}>
            <div className="starter-icon">{s.icon}</div>
            <div>
              <div className="starter-title">{s.title}</div>
              <div className="starter-hint">{s.hint}</div>
            </div>
            <div className="starter-arrow">→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Messages ---------- */

function MessageRow({ message }) {
  if (message.role === "user") {
    return (
      <div className="row row-user">
        <div className="bubble bubble-user">{message.content}</div>
      </div>
    );
  }
  return <AssistantMessage message={message} />;
}

function AssistantMessage({ message }) {
  return (
    <div className="row row-assistant">
      <div className="avatar" aria-hidden="true">A</div>
      <div className="assistant-body">
        {message.error ? (
          <div className="error-card">
            <div className="error-title">
              <span className="error-dot" /> Connection error
            </div>
            <div className="error-text">{message.content}</div>
          </div>
        ) : (
          <>
            <div className="answer">{message.content}</div>
            {message.sources && message.sources.length > 0 && (
              <SourcesPanel sources={message.sources} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ThinkingRow() {
  return (
    <div className="row row-assistant">
      <div className="avatar" aria-hidden="true">A</div>
      <div className="assistant-body">
        <div className="thinking">
          <span className="dot" /><span className="dot" /><span className="dot" />
          <span className="thinking-label">Consulting program documents…</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sources (collapsible) ---------- */

function SourcesPanel({ sources }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={"sources " + (open ? "sources-open" : "")}>
      <button className="sources-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="sources-chevron">{open ? "▾" : "▸"}</span>
        <span className="sources-label">Sources</span>
        <span className="sources-count">{sources.length}</span>
      </button>

      {open && (
        <ol className="sources-list">
          {sources.map((s, i) => {
            const url = sourceUrl(s);

            return (
              <li key={i} className="source-card">
                <div className="source-head">
                  <span className="source-num">{String(i + 1).padStart(2, "0")}</span>

                  {url ? (
                    <a
                      className="source-link"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={url}
                    >
                      {shortUrl(url)}
                    </a>
                  ) : (
                    <span className="source-link source-link-missing">
                      Unknown source
                    </span>
                  )}

                  <span className="source-chunk">chunk #{s.chunk_id}</span>
                </div>

                {s.preview && (
                  <div className="source-preview">{s.preview}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ---------- Composer (input bar) ---------- */

function Composer({ input, setInput, onSend, onKeyDown, k, setK, loading, inputRef }) {
  return (
    <div className="composer-wrap">
      <div className="composer">
        <div className="composer-meta">
          <label className="k-field">
            <span className="k-label">Sources</span>
            <div className="k-select-wrap">
              <select
                className="k-select"
                value={k}
                onChange={(e) => setK(parseInt(e.target.value, 10))}
                disabled={loading}
              >
                {K_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="k-caret">▾</span>
            </div>
          </label>
          <div className="composer-hint">
            <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for newline
          </div>
        </div>

        <div className="composer-row">
          <textarea
            ref={inputRef}
            className="input"
            placeholder="Ask about admissions, courses, capstones, deadlines…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="send"
            onClick={onSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <span className="send-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="footnote">
        Answers are generated from official program documents. Verify details on the official program site.
      </div>
    </div>
  );
}

window.App = App;
