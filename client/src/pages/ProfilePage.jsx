import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkillChip from '../components/SkillChip';
import Spinner from '../components/Spinner';
import './ProfilePage.css';

/* ─── Sub-navigation tabs ─────────────────────────────────────── */
const TABS = ['Overview', 'Recommended', 'Saved', 'Applications'];
const TAB_ROUTES = {
  Overview:     '/profile',
  Recommended:  '/jobs/recommended',
  Saved:        '/jobs/saved',
  Applications: '/applications/my',
};

/* ─── Client-side skill extractor ─────────────────────────────── */
const SKILL_KEYWORDS = [
  'Python','JavaScript','TypeScript','Java','C++','C#','C','Ruby','Go','Rust',
  'Swift','Kotlin','PHP','Scala','R','MATLAB','SQL','HTML','CSS','Bash','Shell',
  'React','React.js','Vue','Vue.js','Angular','Next.js','Svelte','Redux','Tailwind',
  'Bootstrap','SASS','LESS','Webpack','Vite','jQuery',
  'Node.js','Express','Django','Flask','FastAPI','Spring','Laravel','Rails',
  'GraphQL','REST','gRPC','Microservices',
  'MongoDB','PostgreSQL','MySQL','Redis','Firebase','Supabase','SQLite','Cassandra',
  'Elasticsearch','DynamoDB',
  'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','DevOps','Terraform','Linux',
  'Git','GitHub','GitLab','Jenkins','Nginx',
  'Machine Learning','Deep Learning','TensorFlow','PyTorch','Keras','NLP',
  'Computer Vision','Data Science','Data Analysis','Pandas','NumPy','scikit-learn',
  'LLM','OpenAI','Hugging Face','AI','Neural Networks','Reinforcement Learning',
  'Agile','Scrum','Kanban','OOP','Functional Programming','Blockchain','Web3',
  'Cybersecurity','Cloud Architecture','System Design','API Design',
  'Leadership','Communication','Problem Solving','Teamwork','Project Management',
  'Critical Thinking','Mentoring','Public Speaking',
];

function extractSkillsClientSide(bioText) {
  if (!bioText) return [];
  return SKILL_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
    return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(bioText);
  });
}

/* ─── Main ProfilePage ────────────────────────────────────────── */
function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const [bioEditing, setBioEditing]   = useState(false);
  const [bioDraft, setBioDraft]       = useState('');
  const [savingBio, setSavingBio]     = useState(false);
  const [bioError, setBioError]       = useState('');

  const [skills, setSkills]           = useState([]);
  const [extracting, setExtracting]   = useState(false);
  const [extractError, setExtractError] = useState('');

  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill]         = useState('');
  const addInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('Overview');

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
      } catch {
        if (mounted) {
          setProfile({
            name: user?.name || '',
            email: user?.email || '',
            profilePicture: user?.profilePicture || null,
            headline: '', location: '', website: '', bio: '',
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

  useEffect(() => {
    if (addSkillOpen && addInputRef.current) addInputRef.current.focus();
  }, [addSkillOpen]);

  /* ── Save bio ── */
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
      } catch {
        setProfile(prev => ({ ...prev, bio: saved }));
      }
      setBioEditing(false);
      try {
        setExtracting(true);
        setExtractError('');
        const { data } = await api.post('/profile/extract-skills');
        const apiSkills = data.skills || [];
        setSkills(apiSkills.length > 0 ? apiSkills : extractSkillsClientSide(saved));
      } catch {
        const fallback = extractSkillsClientSide(saved);
        if (fallback.length > 0) setSkills(fallback);
      } finally {
        setExtracting(false);
      }
    } finally {
      setSavingBio(false);
    }
  }

  /* ── Extract skills ── */
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

  /* ── Add skill ── */
  async function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkill('');
    setAddSkillOpen(false);
    try { await api.patch('/profile', { skills: updated }); } catch {}
  }

  /* ── Remove skill ── */
  async function handleRemoveSkill(idx) {
    const updated = skills.filter((_, i) => i !== idx);
    setSkills(updated);
    try { await api.patch('/profile', { skills: updated }); } catch {}
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="pf-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pf-hero">
        <div className="pf-hero__inner">
          {loading && <Spinner />}

          {!loading && error && (
            <div className="pf-error-banner">{error}</div>
          )}

          {!loading && !error && profile && (
            <div className="pf-identity">
              {/* Avatar */}
              <div className="pf-avatar-wrap">
                <div className="pf-avatar">
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" />
                  ) : (
                    <div className="pf-avatar-initials">{initials}</div>
                  )}
                </div>
                <Link to="/profile/edit" className="pf-avatar-edit" title="Edit profile">
                  <span className="material-symbols-outlined">edit</span>
                </Link>
              </div>

              {/* Name / headline / meta */}
              <div className="pf-identity-text">
                <h1 className="pf-name">{profile.name}</h1>
                {profile.headline && (
                  <p className="pf-headline">{profile.headline}</p>
                )}
                <div className="pf-meta">
                  {profile.location && (
                    <span className="pf-meta-item">
                      <span className="material-symbols-outlined">location_on</span>
                      {profile.location}
                    </span>
                  )}
                  {profile.email && (
                    <span className="pf-meta-item">
                      <span className="material-symbols-outlined">mail</span>
                      {profile.email}
                    </span>
                  )}
                  {profile.website && (
                    <span className="pf-meta-item">
                      <span className="material-symbols-outlined">link</span>
                      {profile.website}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Sub-navigation ── */}
      <nav className="pf-tabs">
        {TABS.map(tab => (
          <Link
            key={tab}
            to={TAB_ROUTES[tab]}
            className={`pf-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Link>
        ))}
      </nav>

      {/* ── Content ── */}
      {!loading && !error && profile && (
        <div className="pf-content">

          {/* Bio Card */}
          <article className="pf-card">
            <div className="pf-card__header">
              <div>
                <h2 className="pf-card__title">Professional Bio</h2>
              </div>
              {!bioEditing && (
                <button
                  className="pf-card__action"
                  onClick={() => { setBioDraft(profile.bio || ''); setBioEditing(true); setBioError(''); }}
                >
                  Edit Bio
                </button>
              )}
            </div>

            {bioEditing ? (
              <div>
                <textarea
                  className="pf-bio-textarea"
                  value={bioDraft}
                  onChange={e => setBioDraft(e.target.value)}
                  rows={8}
                  placeholder="Write your professional bio — skills will be extracted automatically on submit…"
                />
                <p className="pf-bio-hint">
                  Skills will be automatically extracted from your bio when you submit.
                </p>
                <div className="pf-bio-actions">
                  <button
                    className="pf-btn-primary"
                    onClick={handleSaveBio}
                    disabled={savingBio || !bioDraft.trim()}
                  >
                    {savingBio ? 'Saving…' : 'Submit Bio'}
                  </button>
                  <button
                    className="pf-btn-ghost"
                    onClick={() => { setBioEditing(false); setBioDraft(''); }}
                    disabled={savingBio}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : profile.bio ? (
              <p className="pf-bio-text">{profile.bio}</p>
            ) : (
              <p className="pf-bio-empty">
                No bio yet. Click <strong>Edit Bio</strong> to add a professional summary.
              </p>
            )}
          </article>

          {/* Skills Card */}
          <section className="pf-card">
            <div className="pf-card__header">
              <div>
                <h2 className="pf-card__title">Skills from your bio</h2>
                <p className="pf-card__subtitle">AI-extracted keywords from your professional summary</p>
              </div>
              <button
                className="pf-btn-ghost"
                onClick={handleExtractSkills}
                disabled={extracting}
              >
                {extracting ? 'Extracting…' : 'Re-extract Skills'}
              </button>
            </div>

            {extractError && (
              <div className="pf-error-banner">{extractError}</div>
            )}

            <div className="pf-skills-chips">
              {skills.map((skill, idx) => (
                <SkillChip
                  key={`${skill}-${idx}`}
                  label={skill}
                  onRemove={() => handleRemoveSkill(idx)}
                />
              ))}

              {addSkillOpen ? (
                <div className="pf-add-skill-inline">
                  <input
                    ref={addInputRef}
                    className="pf-add-skill-input"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddSkill();
                      if (e.key === 'Escape') { setAddSkillOpen(false); setNewSkill(''); }
                    }}
                    placeholder="e.g. Node.js"
                  />
                  <button className="pf-btn-primary" onClick={handleAddSkill}
                    style={{ padding: '0.38rem 1rem', fontSize: '0.82rem' }}>
                    Add
                  </button>
                  <button className="pf-btn-icon" onClick={() => { setAddSkillOpen(false); setNewSkill(''); }}>
                    ✕
                  </button>
                </div>
              ) : (
                <button className="pf-btn-add-skill" onClick={() => setAddSkillOpen(true)}>
                  <span className="material-symbols-outlined">add</span>
                  Add Skill
                </button>
              )}
            </div>
          </section>

          {/* Nexi Market Trends card */}
          <section className="pf-card pf-nexi-trends-card">
            <div className="pf-nexi-trends__inner">
              <div className="pf-nexi-trends__img-wrap">
                <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" className="pf-nexi-trends__img" />
              </div>
              <div className="pf-nexi-trends__body">
                <h2 className="pf-nexi-trends__title">Not sure what to learn next?</h2>
                <p className="pf-nexi-trends__sub">
                  Nexi will scan every open role and tell you exactly which in-demand skills you're missing — personalized to your profile.
                </p>
              </div>
              <Link to="/jobs/market-trends" className="pf-nexi-trends__btn">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>
                  trending_up
                </span>
                Let Nexi Analyze
              </Link>
            </div>
          </section>

        </div>
      )}

      <Footer />

      {/* Bio save error toast */}
      {bioError && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(221,0,0,0.1)', color: 'var(--red)',
          padding: '12px 24px', borderRadius: '9999px', fontSize: '14px',
          fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          border: '1px solid rgba(221,0,0,0.2)', zIndex: 300,
        }}>
          {bioError}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
