import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkillChip from '../components/SkillChip';
import Spinner from '../components/Spinner';

/* ─── Sub-navigation tabs ─────────────────────────────────────── */
const TABS = ['Overview', 'Recommended', 'Saved', 'Applications'];
const TAB_ROUTES = {
  Overview: '/profile',
  Recommended: '/jobs/recommended',
  Saved: '/jobs/saved',
  Applications: '/applications/my',
};

/* ─── Inline avatar placeholder ───────────────────────────────── */
function AvatarPlaceholder({ name, size = 160 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.32,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Client-side skill extractor (fallback when API unavailable) ──── */
const SKILL_KEYWORDS = [
  // Languages
  'Python','JavaScript','TypeScript','Java','C++','C#','C','Ruby','Go','Rust',
  'Swift','Kotlin','PHP','Scala','R','MATLAB','SQL','HTML','CSS','Bash','Shell',
  // Frontend
  'React','React.js','Vue','Vue.js','Angular','Next.js','Svelte','Redux','Tailwind',
  'Bootstrap','SASS','LESS','Webpack','Vite','jQuery',
  // Backend
  'Node.js','Express','Django','Flask','FastAPI','Spring','Laravel','Rails',
  'GraphQL','REST','gRPC','Microservices',
  // Databases
  'MongoDB','PostgreSQL','MySQL','Redis','Firebase','Supabase','SQLite','Cassandra',
  'Elasticsearch','DynamoDB',
  // Cloud & DevOps
  'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','DevOps','Terraform','Linux',
  'Git','GitHub','GitLab','Jenkins','Nginx',
  // AI / ML / Data
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras','NLP',
  'Computer Vision','Data Science','Data Analysis','Pandas','NumPy','scikit-learn',
  'LLM','OpenAI','Hugging Face','AI','Neural Networks','Reinforcement Learning',
  // Concepts & Methodologies
  'Agile','Scrum','Kanban','OOP','Functional Programming','Blockchain','Web3',
  'Cybersecurity','Cloud Architecture','System Design','API Design',
  // Soft skills
  'Leadership','Communication','Problem Solving','Teamwork','Project Management',
  'Critical Thinking','Mentoring','Public Speaking',
];

function extractSkillsClientSide(bioText) {
  if (!bioText) return [];
  const text = bioText.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
    return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(text);
  });
}


/* ─── Main ProfilePage ────────────────────────────────────────── */
function ProfilePage() {
  const { user } = useAuth();

  /* Server state */
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* Bio editing */
  const [bioEditing, setBioEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [bioError, setBioError] = useState('');

  /* Skills / extract */
  const [skills, setSkills] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  /* Add-skill input */
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const addInputRef = useRef(null);

  /* Active tab (display only — real navigation handled by router) */
  const [activeTab, setActiveTab] = useState('Recommended');

  /* ── Load profile ── */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/profile');
        const profileData = data.user || data;
        if (mounted) {
          setProfile(profileData);
          setSkills(profileData.skills || []);
        }
      } catch (_err) {
        /* API unavailable — fall back to auth context data with empty bio/skills */
        if (mounted) {
          setProfile({
            name: user?.name || '',
            email: user?.email || '',
            profilePicture: user?.profilePicture || null,
            headline: '',
            location: '',
            website: '',
            bio: '',
          });
          setSkills([]);
          setError('');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Focus add-skill input when it opens ── */
  useEffect(() => {
    if (addSkillOpen && addInputRef.current) addInputRef.current.focus();
  }, [addSkillOpen]);

  /* ── Save bio + auto-extract skills ── */
  async function handleSaveBio() {
    if (!bioDraft.trim()) return;
    try {
      setSavingBio(true);
      setBioError('');
      const saved = bioDraft.trim();
      try {
        const { data } = await api.patch('/profile', { bio: saved });
        const updatedBio = data.updatedFields?.bio ?? saved;
        setProfile(prev => ({ ...prev, bio: updatedBio }));
      } catch (_apiErr) {
        /* API unavailable — update local state only */
        setProfile(prev => ({ ...prev, bio: saved }));
      }
      setBioEditing(false);
      /* Auto-extract skills after saving bio */
      try {
        setExtracting(true);
        setExtractError('');
        const { data } = await api.post('/profile/extract-skills');
        const apiSkills = data.skills || [];
        setSkills(apiSkills.length > 0 ? apiSkills : extractSkillsClientSide(saved));
      } catch {
        /* API unavailable — fall back to client-side keyword extraction */
        const fallback = extractSkillsClientSide(saved);
        if (fallback.length > 0) setSkills(fallback);
      } finally {
        setExtracting(false);
      }
    } finally {
      setSavingBio(false);
    }
  }

  /* ── Extract skills from bio (manual trigger) ── */
  async function handleExtractSkills() {
    if (!profile?.bio) {
      setExtractError('Your bio is empty. Add a bio first before extracting skills.');
      return;
    }
    try {
      setExtracting(true);
      setExtractError('');
      const { data } = await api.post('/profile/extract-skills');
      const apiSkills = data.skills || [];
      setSkills(apiSkills.length > 0 ? apiSkills : extractSkillsClientSide(profile.bio));
    } catch {
      /* Fall back to client-side extraction */
      const fallback = extractSkillsClientSide(profile.bio);
      if (fallback.length > 0) {
        setSkills(fallback);
      } else {
        setExtractError('Could not extract skills from your bio. Try adding more specific technologies.');
      }
    } finally {
      setExtracting(false);
    }
  }

  /* ── Add skill manually ── */
  async function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const updated = [...skills, trimmed];
    /* Optimistic update — apply locally first, then try to persist */
    setSkills(updated);
    setNewSkill('');
    setAddSkillOpen(false);
    try {
      await api.patch('/profile', { skills: updated });
    } catch (_apiErr) {
      /* API unavailable — local state already updated, no error shown */
    }
  }

  /* ── Remove skill ── */
  async function handleRemoveSkill(idx) {
    const updated = skills.filter((_, i) => i !== idx);
    /* Optimistic update */
    setSkills(updated);
    try {
      await api.patch('/profile', { skills: updated });
    } catch (_apiErr) {
      /* API unavailable — local state already updated */
    }
  }

  /* ────────────────────────────────────────────────────────────── */
  /*  Render                                                         */
  /* ────────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-canvas-parchment)' }}>
      <Navbar />

      <main
        style={{
          paddingTop: '88px',
          paddingBottom: '80px',
          paddingLeft: '24px',
          paddingRight: '24px',
          maxWidth: '980px',
          margin: '0 auto',
          width: '100%',
          flex: 1,
        }}
      >
        {loading && <Spinner />}

        {!loading && error && (
          <div
            style={{
              background: 'var(--color-error-container)',
              color: 'var(--color-status-rejected-text)',
              padding: '16px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              marginBottom: '24px',
              border: '1px solid rgba(180,35,24,0.15)',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {/* ── Profile Hero ── */}
            <section
              className="animate-fade-up"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: '32px',
                marginBottom: '48px',
              }}
            >
              {/* Avatar + edit button */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid var(--color-surface-container-lowest)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  }}
                >
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <AvatarPlaceholder name={profile.name} size={160} />
                  )}
                </div>
                <Link
                  to="/profile/edit"
                  id="edit-avatar-btn"
                  title="Edit profile"
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </Link>
              </div>

              {/* Name, title, meta */}
              <div style={{ flex: 1, minWidth: '240px', paddingBottom: '8px' }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: '40px',
                    fontWeight: 700,
                    color: 'var(--color-on-surface)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.1,
                  }}
                >
                  {profile.name}
                </h1>
                {profile.headline && (
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: '20px',
                      fontWeight: 400,
                      color: 'var(--color-ink-muted)',
                      lineHeight: 1.3,
                    }}
                  >
                    {profile.headline}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '16px',
                    fontSize: '13px',
                    color: 'var(--color-on-surface-variant)',
                  }}
                >
                  {profile.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>location_on</span>
                      {profile.location}
                    </span>
                  )}
                  {profile.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>mail</span>
                      {profile.email}
                    </span>
                  )}
                  {profile.website && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>link</span>
                      {profile.website}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Sub-navigation ── */}
            <nav
              id="profile-subnav"
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--color-hairline)',
                gap: '32px',
                marginBottom: '48px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
              className="animate-fade-up animate-fade-up-delay-1"
            >
              {TABS.map(tab => {
                const isActive = tab === activeTab;
                return (
                  <Link
                    key={tab}
                    to={TAB_ROUTES[tab]}
                    id={`tab-${tab.toLowerCase()}`}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      paddingBottom: '12px',
                      fontSize: '15px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                      borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                      textDecoration: 'none',
                      transition: 'color 0.2s, border-color 0.2s',
                      marginBottom: '-1px',
                    }}
                  >
                    {tab}
                  </Link>
                );
              })}
            </nav>

            {/* ── Bio Card ── */}
            <article
              id="bio-card"
              className="animate-fade-up animate-fade-up-delay-1"
              style={{
                background: 'var(--color-surface-container-lowest)',
                borderRadius: '12px',
                padding: '32px',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 4px 24px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Decorative quote watermark */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  padding: '16px',
                  opacity: 0.04,
                  pointerEvents: 'none',
                  lineHeight: 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>format_quote</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: '22px',
                    fontWeight: 700,
                    color: 'var(--color-on-surface)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Professional Bio
                </h2>
                {!bioEditing && (
                  <button
                    id="edit-bio-btn"
                    onClick={() => { setBioDraft(profile.bio || ''); setBioEditing(true); setBioError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      padding: 0,
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      transition: 'text-decoration 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Edit Bio
                  </button>
                )}
              </div>

              {bioEditing ? (
                <div>
                  <textarea
                    id="bio-textarea"
                    value={bioDraft}
                    onChange={e => setBioDraft(e.target.value)}
                    rows={8}
                    placeholder="Write your professional bio — skills will be extracted automatically on submit…"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid var(--color-primary)',
                      background: 'var(--color-surface-container-low)',
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: 'var(--color-on-surface)',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'Inter, sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{ margin: '8px 0 16px', fontSize: '13px', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                    Skills will be automatically extracted from your bio when you submit.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      id="submit-bio-btn"
                      onClick={handleSaveBio}
                      disabled={savingBio || !bioDraft.trim()}
                      style={{ ...primaryBtnStyle, opacity: (savingBio || !bioDraft.trim()) ? 0.7 : 1 }}
                    >
                      {savingBio ? 'Saving…' : 'Submit Bio'}
                    </button>
                    <button
                      id="cancel-bio-btn"
                      onClick={() => { setBioEditing(false); setBioDraft(''); }}
                      disabled={savingBio}
                      style={ghostBtnStyle}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : profile.bio ? (
                <div>
                  {profile.bio.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      style={{
                        margin: i === 0 ? 0 : '16px 0 0',
                        fontSize: '16px',
                        lineHeight: 1.7,
                        color: 'var(--color-on-surface-variant)',
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '15px', fontStyle: 'italic' }}>
                  No bio yet. Click <strong>Edit Bio</strong> to add a professional summary.
                </p>
              )}
            </article>

            {/* ── Skills Card ── */}
            <section
              id="skills-card"
              className="animate-fade-up animate-fade-up-delay-2"
              style={{
                background: 'var(--color-surface-container-lowest)',
                borderRadius: '12px',
                padding: '32px',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 4px 24px -1px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  marginBottom: '28px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: 700,
                      color: 'var(--color-on-surface)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Skills from your bio
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                    AI-extracted keywords from your professional summary
                  </p>
                </div>

                <button
                  id="extract-skills-btn"
                  onClick={handleExtractSkills}
                  disabled={extracting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--color-surface-pearl)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: 'var(--color-primary)',
                    padding: '10px 20px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: extracting ? 'not-allowed' : 'pointer',
                    opacity: extracting ? 0.7 : 1,
                    transition: 'background 0.15s, transform 0.1s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => !extracting && (e.currentTarget.style.background = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface-pearl)')}
                >
                  {extracting ? 'Extracting…' : 'Re-extract Skills'}
                </button>
              </div>

              {/* Extract error */}
              {extractError && (
                <div
                  id="extract-skills-error"
                  style={{
                    background: 'var(--color-error-container)',
                    color: 'var(--color-status-rejected-text)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '20px',
                    border: '1px solid rgba(180,35,24,0.12)',
                  }}
                >
                  {extractError}
                </div>
              )}

              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {skills.map((skill, idx) => (
                  <SkillChip
                    key={`${skill}-${idx}`}
                    label={skill}
                    onRemove={() => handleRemoveSkill(idx)}
                  />
                ))}

                {/* Add Skill button / inline input */}
                {addSkillOpen ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      id="add-skill-input"
                      ref={addInputRef}
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddSkill();
                        if (e.key === 'Escape') { setAddSkillOpen(false); setNewSkill(''); }
                      }}
                      placeholder="e.g. Node.js"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        border: '1.5px solid var(--color-primary)',
                        fontSize: '13px',
                        outline: 'none',
                        width: '140px',
                        fontFamily: 'Inter, sans-serif',
                        background: 'var(--color-surface-container-lowest)',
                        color: 'var(--color-on-surface)',
                      }}
                    />
                    <button
                      id="add-skill-confirm-btn"
                      onClick={handleAddSkill}
                      style={{ ...primaryBtnStyle, padding: '6px 16px', fontSize: '13px' }}
                    >
                      Add
                    </button>
                    <button
                      id="add-skill-cancel-btn"
                      onClick={() => { setAddSkillOpen(false); setNewSkill(''); }}
                      style={{ ...ghostBtnStyle, padding: '6px 12px', fontSize: '13px' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    id="add-skill-btn"
                    onClick={() => setAddSkillOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#fff',
                      color: 'var(--color-secondary)',
                      padding: '6px 16px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: '1.5px dashed var(--color-outline-variant)',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                      e.currentTarget.style.color = 'var(--color-secondary)';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>add</span>
                    Add Skill
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* Bio save error (toast-style) */}
      {bioError && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-error-container)',
            color: 'var(--color-status-rejected-text)',
            padding: '12px 24px',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 300,
          }}
        >
          {bioError}
        </div>
      )}
    </div>
  );
}

/* ─── Shared button styles ───────────────────────────────────── */
const primaryBtnStyle = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: '9999px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  transition: 'opacity 0.15s, transform 0.1s',
};

const ghostBtnStyle = {
  background: 'none',
  color: 'var(--color-on-surface-variant)',
  border: '1px solid var(--color-outline-variant)',
  borderRadius: '9999px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  transition: 'background 0.15s',
};

export default ProfilePage;
