import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './NexiChatWidget.css';

const WELCOME = "Hi, I'm Nexi! I can help you find jobs, improve your profile, check your applications, and understand market trends. What would you like to do?";

const CHIPS_BY_ROLE = {
  jobSeeker: [
    { label: 'Find jobs for me',              message: 'Find jobs that match my skills' },
    { label: 'Improve my profile',            message: 'How can I improve my profile?' },
    { label: 'What skills are trending?',     message: 'What skills are trending right now?' },
    { label: 'My applications',               message: 'Summarize my applications' },
    { label: 'Help with cover letter',        message: 'Help me with a cover letter' },
  ],
  recruiter: [
    { label: 'Market trends',                 message: 'What skills are trending right now?' },
    { label: 'Improve my profile',            message: 'How can I improve my recruiter profile?' },
    { label: 'Cover letter tips',             message: 'Help me with a cover letter' },
  ],
  default: [
    { label: 'What skills are trending?',     message: 'What skills are trending right now?' },
    { label: 'Improve my profile',            message: 'How can I improve my profile?' },
  ],
};

// Render **bold** markdown in message text
function renderBubbleText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function toInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase() || 'U';
}

export default function NexiChatWidget() {
  const { isAuthenticated, user } = useAuth();

  const [open,          setOpen]          = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(() => user?.profilePicture || null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: WELCOME },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showDot,  setShowDot]  = useState(true);

  // Reset all chat state when the user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setOpen(false);
      setMessages([{ role: 'assistant', text: WELCOME }]);
      setInput('');
      setError('');
      setLoading(false);
      setShowDot(true);
      setProfilePicUrl(null);
    }
  }, [isAuthenticated]);

  // Keep profile picture in sync: prefer user context (kept warm by Navbar),
  // fall back to a single API fetch if the context still lacks it.
  useEffect(() => {
    if (user?.profilePicture) {
      setProfilePicUrl(user.profilePicture);
      return;
    }
    if (!isAuthenticated || profilePicUrl) return;
    api.get('/profile').then(res => {
      const pic = res.data?.user?.profilePicture;
      if (pic) setProfilePicUrl(pic);
    }).catch(() => {});
  }, [isAuthenticated, user?.profilePicture]);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setShowDot(false);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError('');
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/nexi/chat', { message: trimmed });
      const answer = res.data?.answer || "I'm sorry, I couldn't process that right now.";
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      setError(msg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "I ran into an issue. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Only render for authenticated users
  if (!isAuthenticated) return null;

  const initials = toInitials(user?.name);
  const chips = CHIPS_BY_ROLE[user?.role] || CHIPS_BY_ROLE.default;

  return (
    <>
      {/* ── Chat panel ───────────────────────────────────────────── */}
      {open && (
        <div className="ncw-panel" role="dialog" aria-label="Nexi Assistant">

          {/* Header */}
          <div className="ncw-header">
            <div className="ncw-header__mascot">
              <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" />
            </div>
            <div className="ncw-header__text">
              <p className="ncw-header__title">Nexi Assistant</p>
              <p className="ncw-header__subtitle">Jobs · Profile · Applications · Trends</p>
            </div>
            <div className="ncw-header__status">
              <span className="ncw-header__status-dot" />
              Online
            </div>
            <button
              className="ncw-close-btn"
              onClick={() => setOpen(false)}
              aria-label="Close Nexi chat"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="ncw-messages" role="log" aria-live="polite">

            {messages.map((msg, i) => (
              <div key={i} className={`ncw-msg ncw-msg--${msg.role}`}>

                {msg.role === 'assistant' ? (
                  <div className="ncw-msg__avatar">
                    <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" />
                  </div>
                ) : (
                  <div className="ncw-msg__user-avatar">
                    {profilePicUrl
                      ? <img src={profilePicUrl} alt={user?.name || 'User'} className="ncw-msg__user-pic" />
                      : initials}
                  </div>
                )}

                <div className="ncw-msg__bubble">
                  {renderBubbleText(msg.text)}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <div className="ncw-msg ncw-msg--assistant">
                <div className="ncw-msg__avatar">
                  <img src="/Nexi/Nexi_InsightB.png" alt="Nexi thinking" />
                </div>
                <div className="ncw-thinking">
                  <div className="ncw-thinking__dots">
                    <span /><span /><span />
                  </div>
                  <span className="ncw-thinking__text">Nexi is thinking…</span>
                </div>
              </div>
            )}

            {/* Quick chips — shown only when there's just the welcome message */}
            {messages.length === 1 && !loading && (
              <div className="ncw-chips">
                {chips.map(chip => (
                  <button
                    key={chip.label}
                    className="ncw-chip"
                    onClick={() => sendMessage(chip.message)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && <div className="ncw-error-msg">{error}</div>}

          {/* Input */}
          <div className="ncw-input-area">
            <div className="ncw-input-row">
              <textarea
                ref={inputRef}
                className="ncw-input"
                rows={1}
                placeholder="Ask Nexi anything…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Message input"
              />
              <button
                className="ncw-send-btn"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── Floating action button ─────────────────────────────── */}
      <button
        className={`ncw-fab${open ? ' ncw-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Nexi chat' : 'Open Nexi chat'}
        aria-expanded={open}
      >
        {showDot && !open && <span className="ncw-fab__dot" aria-hidden="true" />}
        <img
          src={open ? '/Nexi/Nexi_InsightB.png' : '/Nexi/Nexi_Summarize.png'}
          alt="Nexi"
          className="ncw-fab__img"
        />
      </button>
    </>
  );
}
