import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './OnboardingPage.css';

const STEPS = [
  { id: 'welcome',     label: 'Welcome'     },
  { id: 'profile',     label: 'Profile'     },
  { id: 'academic',    label: 'Academic'    },
  { id: 'skills',      label: 'Skills'      },
  { id: 'discover',    label: 'Discover'    },
  { id: 'apply',       label: 'First Apply' },
  { id: 'done',        label: 'Done'        },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function ProgressBar({ current, total }) {
  const pct = Math.round((current / (total - 1)) * 100);
  return (
    <div className="ob-progress">
      <div className="ob-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StepDots({ steps, current }) {
  return (
    <div className="ob-dots">
      {steps.map((s, i) => (
        <div
          key={s.id}
          className={`ob-dot ${i < current ? 'ob-dot--done' : i === current ? 'ob-dot--active' : ''}`}
          title={s.label}
        />
      ))}
    </div>
  );
}

function NexiSpeech({ msg, img = '/Nexi/Nexi_Summarize.png', thinking = false }) {
  return (
    <div className="ob-nexi">
      <div className="ob-nexi__frame">
        <img src={img} alt="Nexi" className={thinking ? 'ob-nexi__img--pulse' : ''} />
      </div>
      <div className="ob-nexi__bubble">
        {thinking
          ? <span className="ob-nexi__dots"><span /><span /><span /></span>
          : msg}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stepIdx, setStepIdx] = useState(0);

  // Step 2 – Profile
  const [name,        setName]        = useState(user?.name || '');
  const [bio,         setBio]         = useState('');
  const [photoFile,   setPhotoFile]   = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError,  setProfileError]  = useState('');
  const photoRef = useRef(null);

  // Step 3 – Academic
  const [university,      setUniversity]      = useState('');
  const [degree,          setDegree]          = useState('');
  const [major,           setMajor]           = useState('');
  const [gpa,             setGpa]             = useState('');
  const [graduationDate,  setGraduationDate]  = useState('');
  const [academicSaving,  setAcademicSaving]  = useState(false);
  const [academicError,   setAcademicError]   = useState('');

  // Step 4 – Skills
  const [skills,          setSkills]          = useState([]);
  const [skillsLoading,   setSkillsLoading]   = useState(false);
  const [skillsError,     setSkillsError]     = useState('');
  const [skillsExtracted, setSkillsExtracted] = useState(false);
  const [manualSkill,     setManualSkill]     = useState('');

  // Step 5 – Discover
  const [jobs,         setJobs]         = useState([]);
  const [jobsLoading,  setJobsLoading]  = useState(false);

  // Step 6 – Apply
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [coverLetter,   setCoverLetter]   = useState('');
  const [suggesting,    setSuggesting]    = useState(false);
  const [applying,      setApplying]      = useState(false);
  const [applyError,    setApplyError]    = useState('');
  const [applySuccess,  setApplySuccess]  = useState(false);

  // Guard: skip onboarding if already completed
  useEffect(() => {
    if (!isAuthenticated) { navigate('/login', { replace: true }); return; }
    if (user?.role !== 'jobSeeker') { navigate('/', { replace: true }); return; }
    if (user?.hasCompletedOnboarding) { navigate('/', { replace: true }); return; }
  }, [isAuthenticated, user]);

  const advance = useCallback(() => setStepIdx(i => clamp(i + 1, 0, STEPS.length - 1)), []);
  const back    = useCallback(() => setStepIdx(i => clamp(i - 1, 0, STEPS.length - 1)), []);

  // ── Step 2: Save profile ──────────────────────────────────────────────────
  async function handleProfileSave() {
    if (!name.trim()) { setProfileError('Name is required.'); return; }
    setProfileSaving(true);
    setProfileError('');
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      if (bio.trim()) fd.append('bio', bio.trim());
      if (photoFile)  fd.append('profilePicture', photoFile);
      await api.patch('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ name: name.trim() });
      advance();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // ── Step 3: Save academic info ────────────────────────────────────────────
  async function handleAcademicSave() {
    if (gpa !== '' && (Number(gpa) < 0 || Number(gpa) > 4)) {
      setAcademicError('GPA must be between 0 and 4.0.');
      return;
    }
    setAcademicSaving(true);
    setAcademicError('');
    try {
      const ai = {};
      if (university)     ai.university     = university;
      if (degree)         ai.degree         = degree;
      if (major)          ai.major          = major;
      if (gpa !== '')     ai.gpa            = Number(gpa);
      if (graduationDate) ai.graduationDate = graduationDate;

      if (Object.keys(ai).length > 0) {
        const fd = new FormData();
        fd.append('academicInformation', JSON.stringify(ai));
        // Need at least one other field to pass validation
        fd.append('name', name.trim() || user?.name || '');
        await api.patch('/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      advance();
    } catch (err) {
      setAcademicError(err.response?.data?.message || 'Failed to save academic info.');
    } finally {
      setAcademicSaving(false);
    }
  }

  // ── Step 4: Extract skills ────────────────────────────────────────────────
  async function handleExtractSkills() {
    if (skillsExtracted) { advance(); return; }
    setSkillsLoading(true);
    setSkillsError('');
    try {
      const res = await api.post('/profile/extract-skills');
      setSkills(res.data.skills || res.data.extracted || []);
      setSkillsExtracted(true);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('bio')) {
        setSkillsError('Add a bio in your profile first so Nexi can detect your skills.');
      } else {
        setSkillsError(msg || 'Skill extraction failed. You can add skills manually.');
      }
    } finally {
      setSkillsLoading(false);
    }
  }

  function addManualSkill() {
    const s = manualSkill.trim();
    if (!s || skills.includes(s)) return;
    setSkills(prev => [...prev, s]);
    setManualSkill('');
  }

  function removeSkill(sk) { setSkills(prev => prev.filter(s => s !== sk)); }

  async function saveSkills() {
    if (skills.length > 0) {
      try {
        await api.patch('/profile', { skills });
      } catch (_) {}
    }
    advance();
  }

  // ── Step 5: Load recommended jobs ─────────────────────────────────────────
  useEffect(() => {
    if (STEPS[stepIdx].id !== 'discover') return;
    setJobsLoading(true);
    api.get('/jobs/recommended')
      .then(r => setJobs((r.data.jobs || []).slice(0, 3)))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, [stepIdx]);

  // ── Step 6: Cover letter suggestion ───────────────────────────────────────
  async function handleSuggestCL(jobId) {
    setSuggesting(true);
    try {
      const res = await api.post(`/jobs/${jobId}/cover-letter-suggestion`);
      setCoverLetter(res.data.coverLetter || '');
    } catch (_) {}
    finally { setSuggesting(false); }
  }

  async function handleApply() {
    if (!selectedJob) return;
    setApplying(true);
    setApplyError('');
    try {
      await api.post(`/jobs/${selectedJob._id}/apply`, { coverLetter });
      setApplySuccess(true);
      setTimeout(advance, 1400);
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Application failed.');
    } finally {
      setApplying(false);
    }
  }

  // ── Completion ────────────────────────────────────────────────────────────
  async function handleComplete() {
    try {
      await api.patch('/profile/complete-onboarding');
    } catch (_) {}
    updateUser({ hasCompletedOnboarding: true });
    navigate('/', { replace: true });
  }

  const stepId = STEPS[stepIdx].id;

  // ── Shared nexi message by step ───────────────────────────────────────────
  const nexiMessages = {
    welcome:  "Hi, I'm Nexi. I'll help you get set up and ready to discover opportunities.",
    profile:  "Let's start with the basics. A strong profile helps recruiters notice you.",
    academic: "Tell me about your studies. Recruiters love seeing your academic background.",
    skills:   bio.trim()
                ? "Nexi found these skills from your profile. You can add more or remove any."
                : "Add a bio first to let Nexi detect your skills, or add them manually below.",
    discover: "These opportunities look like a strong fit for your profile.",
    apply:    selectedJob
                ? `Let's apply to ${selectedJob.title} at ${selectedJob.company}. I can write your cover letter.`
                : "Pick a job from the list and I'll help you apply.",
    done:     "You're all set! Your profile is complete and opportunities are waiting.",
  };

  return (
    <div className="ob-root">
      {/* Ambient glow */}
      <div className="ob-glow ob-glow--tl" />
      <div className="ob-glow ob-glow--br" />

      <div className="ob-card">

        {/* Top bar */}
        <div className="ob-topbar">
          <div className="ob-logo">GIU<span className="ob-logo-dot">.</span>Nexus</div>
          <StepDots steps={STEPS} current={stepIdx} />
          <button className="ob-skip-btn" onClick={handleComplete} title="Skip onboarding">
            Skip <span className="material-symbols-outlined" style={{ fontSize: 15 }}>skip_next</span>
          </button>
        </div>

        <ProgressBar current={stepIdx} total={STEPS.length} />

        {/* Nexi mascot + bubble */}
        <NexiSpeech
          msg={nexiMessages[stepId]}
          img={stepId === 'done' ? '/Nexi/Nexi_Summarize.png' : '/Nexi/Nexi_InsightB.png'}
          thinking={skillsLoading || jobsLoading || suggesting}
        />

        {/* ── Step content ──────────────────────────────────────────── */}
        <div className="ob-body">

          {/* STEP 1: Welcome */}
          {stepId === 'welcome' && (
            <div className="ob-step ob-step--center">
              <h1 className="ob-title">Welcome to GIU Nexus</h1>
              <p className="ob-sub">
                I'll walk you through setting up your profile, discovering opportunities,
                and landing your first application — all in a few quick steps.
              </p>
              <div className="ob-feature-list">
                {[
                  ['person', 'Build your profile'],
                  ['school', 'Add academic info'],
                  ['psychology', 'Discover your skills'],
                  ['work', 'Find matching jobs'],
                  ['send', 'Submit your first application'],
                ].map(([icon, label]) => (
                  <div key={icon} className="ob-feature">
                    <span className="material-symbols-outlined ob-feature__icon">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
              <button className="ob-btn ob-btn--primary ob-btn--lg" onClick={advance}>
                Let's get started →
              </button>
            </div>
          )}

          {/* STEP 2: Profile */}
          {stepId === 'profile' && (
            <div className="ob-step">
              <h2 className="ob-step-title">Complete Your Profile</h2>

              {/* Photo */}
              <div className="ob-photo-row">
                <div
                  className="ob-photo-circle"
                  onClick={() => photoRef.current?.click()}
                  title="Upload photo"
                >
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" />
                    : <span className="material-symbols-outlined ob-photo-circle__icon">add_a_photo</span>}
                </div>
                <div className="ob-photo-hint">
                  <p>Upload a profile photo</p>
                  <p className="ob-muted">PNG or JPG, recommended 200×200</p>
                </div>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>

              <div className="ob-field">
                <label className="ob-label">Full Name *</label>
                <input
                  className="ob-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="ob-field">
                <label className="ob-label">
                  Bio
                  <span className="ob-label-hint"> — helps Nexi detect your skills</span>
                </label>
                <textarea
                  className="ob-textarea"
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell recruiters about yourself, your experience and what you're looking for…"
                />
                <p className="ob-char-count">{bio.length} / 500</p>
              </div>

              {profileError && <p className="ob-error">{profileError}</p>}

              <div className="ob-actions">
                <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                <button className="ob-btn ob-btn--primary" onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving ? <><span className="ob-spinner" /> Saving…</> : 'Save & Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Academic */}
          {stepId === 'academic' && (
            <div className="ob-step">
              <h2 className="ob-step-title">Academic Information</h2>

              <div className="ob-grid-2">
                <div className="ob-field">
                  <label className="ob-label">University</label>
                  <input className="ob-input" value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. German International University" />
                </div>
                <div className="ob-field">
                  <label className="ob-label">Degree</label>
                  <input className="ob-input" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. Bachelor of Science" />
                </div>
                <div className="ob-field">
                  <label className="ob-label">Major</label>
                  <input className="ob-input" value={major} onChange={e => setMajor(e.target.value)} placeholder="e.g. Computer Science" />
                </div>
                <div className="ob-field">
                  <label className="ob-label">GPA <span className="ob-muted">(0 – 4.0)</span></label>
                  <input className="ob-input" type="number" step="0.01" min="0" max="4" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="3.50" />
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Expected Graduation Date</label>
                <input className="ob-input" type="date" value={graduationDate} onChange={e => setGraduationDate(e.target.value)} />
              </div>

              {academicError && <p className="ob-error">{academicError}</p>}

              <div className="ob-actions">
                <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                <button className="ob-btn ob-btn--ghost" onClick={advance}>Skip for now</button>
                <button className="ob-btn ob-btn--primary" onClick={handleAcademicSave} disabled={academicSaving}>
                  {academicSaving ? <><span className="ob-spinner" /> Saving…</> : 'Save & Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Skills */}
          {stepId === 'skills' && (
            <div className="ob-step">
              <h2 className="ob-step-title">Skill Discovery</h2>

              {!skillsExtracted && !skillsError && (
                <button
                  className="ob-btn ob-btn--primary"
                  onClick={handleExtractSkills}
                  disabled={skillsLoading}
                >
                  {skillsLoading
                    ? <><span className="ob-spinner" /> Nexi is scanning your bio…</>
                    : 'Detect My Skills with Nexi'}
                </button>
              )}

              {skillsError && (
                <p className="ob-error">{skillsError}</p>
              )}

              {skills.length > 0 && (
                <div className="ob-skills-wrap">
                  <p className="ob-skills-label">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check_circle</span>
                    {skillsExtracted ? 'Nexi found these skills from your profile:' : 'Your current skills:'}
                  </p>
                  <div className="ob-chips">
                    {skills.map(sk => (
                      <span key={sk} className="ob-chip">
                        {sk}
                        <button className="ob-chip__rm" onClick={() => removeSkill(sk)} aria-label={`Remove ${sk}`}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="ob-manual-skill">
                <input
                  className="ob-input"
                  placeholder="Add a skill manually…"
                  value={manualSkill}
                  onChange={e => setManualSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addManualSkill()}
                />
                <button className="ob-btn ob-btn--ghost" onClick={addManualSkill} disabled={!manualSkill.trim()}>Add</button>
              </div>

              <div className="ob-actions">
                <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                <button className="ob-btn ob-btn--primary" onClick={saveSkills}>
                  {skills.length > 0 ? 'Save Skills & Continue →' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Discover */}
          {stepId === 'discover' && (
            <div className="ob-step">
              <h2 className="ob-step-title">Opportunity Discovery</h2>

              {jobsLoading && (
                <div className="ob-jobs-loading">
                  <span className="ob-spinner ob-spinner--dark" />
                  Nexi is finding matches…
                </div>
              )}

              {!jobsLoading && jobs.length === 0 && (
                <div className="ob-empty">
                  <span className="material-symbols-outlined ob-empty__icon">search_off</span>
                  <p>No strong matches found yet. Add more skills to get better recommendations.</p>
                </div>
              )}

              {!jobsLoading && jobs.length > 0 && (
                <div className="ob-job-cards">
                  {jobs.map(job => (
                    <div key={job._id} className="ob-job-card">
                      <div className="ob-job-card__body">
                        <p className="ob-job-card__title">{job.title}</p>
                        <p className="ob-job-card__company">{job.company} · {job.location}</p>
                        {job.matchScore != null && (
                          <span className="ob-job-card__match">{job.matchScore}% match</span>
                        )}
                      </div>
                      <span className={`ob-job-card__badge ob-job-card__badge--${job.type?.replace('-', '')}`}>
                        {job.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="ob-actions">
                <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                <button
                  className="ob-btn ob-btn--primary"
                  onClick={() => { setSelectedJob(jobs[0] || null); advance(); }}
                >
                  {jobs.length > 0 ? 'Apply to Your Best Match →' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Apply */}
          {stepId === 'apply' && (
            <div className="ob-step">
              <h2 className="ob-step-title">Submit Your First Application</h2>

              {/* Job picker */}
              {jobs.length > 0 && (
                <div className="ob-job-picker">
                  {jobs.map(job => (
                    <button
                      key={job._id}
                      className={`ob-job-pick-btn ${selectedJob?._id === job._id ? 'ob-job-pick-btn--active' : ''}`}
                      onClick={() => { setSelectedJob(job); setCoverLetter(''); setApplyError(''); setApplySuccess(false); }}
                    >
                      <span className="ob-job-pick-btn__title">{job.title}</span>
                      <span className="ob-job-pick-btn__co">{job.company}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedJob && !applySuccess && (
                <>
                  {/* Nexi cover letter card */}
                  <div
                    className="ob-cl-card"
                    onClick={() => !suggesting && handleSuggestCL(selectedJob._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && !suggesting && handleSuggestCL(selectedJob._id)}
                  >
                    <div className="ob-cl-card__inner">
                      <div className="ob-cl-card__img-wrap">
                        <img
                          src={suggesting ? '/Nexi/Nexi_InsightB.png' : '/Nexi/Nexi_Summarize.png'}
                          alt="Nexi"
                          className={suggesting ? 'ob-pulse' : ''}
                        />
                      </div>
                      <div className="ob-cl-card__text">
                        <span className="ob-cl-card__label">Draft with Nexi</span>
                        <span className="ob-cl-card__sub">
                          {suggesting ? 'Crafting your cover letter…' : 'Generate a personalized cover letter from your bio'}
                        </span>
                      </div>
                      <span className="ob-cl-card__icon material-symbols-outlined">
                        {suggesting ? 'hourglass_top' : 'auto_awesome'}
                      </span>
                    </div>
                  </div>

                  <div className="ob-field">
                    <label className="ob-label">
                      Cover Letter <span className="ob-muted">(optional)</span>
                    </label>
                    <textarea
                      className="ob-textarea"
                      rows={5}
                      placeholder="Tell the recruiter why you're a great fit…"
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                      disabled={applying}
                    />
                  </div>

                  {applyError && <p className="ob-error">{applyError}</p>}

                  <div className="ob-actions">
                    <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                    <button className="ob-btn ob-btn--ghost" onClick={advance}>Skip</button>
                    <button
                      className="ob-btn ob-btn--primary"
                      onClick={handleApply}
                      disabled={applying}
                    >
                      {applying ? <><span className="ob-spinner" /> Applying…</> : `Apply to ${selectedJob.company} →`}
                    </button>
                  </div>
                </>
              )}

              {applySuccess && (
                <div className="ob-apply-success">
                  <span className="material-symbols-outlined ob-apply-success__icon">check_circle</span>
                  <p>Application submitted! Moving on…</p>
                </div>
              )}

              {!selectedJob && jobs.length === 0 && (
                <div className="ob-actions">
                  <button className="ob-btn ob-btn--ghost" onClick={back}>Back</button>
                  <button className="ob-btn ob-btn--primary" onClick={advance}>Continue →</button>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Done */}
          {stepId === 'done' && (
            <div className="ob-step ob-step--center">
              <div className="ob-done-check">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h1 className="ob-title">You're Ready.</h1>
              <p className="ob-sub">
                Your profile is complete and you're ready to explore opportunities on GIU Nexus.
              </p>
              <div className="ob-done-pills">
                <span className="ob-done-pill">Profile ✓</span>
                <span className="ob-done-pill">Academic Info ✓</span>
                <span className="ob-done-pill">Skills ✓</span>
                {applySuccess && <span className="ob-done-pill">First Application ✓</span>}
              </div>
              <button className="ob-btn ob-btn--primary ob-btn--lg" onClick={handleComplete}>
                Explore GIU Nexus →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
