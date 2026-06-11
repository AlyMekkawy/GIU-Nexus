import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './InterviewPage.css';

const TOTAL_QUESTIONS = 6;

const CATEGORY_ICONS = {
  'Technical':       'code',
  'Scenario-Based':  'layers',
  'Problem-Solving': 'psychology',
  'Behavioral':      'group',
  'Skill-Gap':       'trending_up',
  'General':         'chat',
};

function ScoreRing({ value, label, size = 72 }) {
  const r       = (size / 2) - 6;
  const circ    = 2 * Math.PI * r;
  const filled  = value != null ? circ - (circ * value) / 100 : circ;
  const color   = value >= 80 ? '#4ade80' : value >= 60 ? '#FFCE00' : '#f87171';
  return (
    <div className="iv-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} className="iv-ring__track" />
        <circle
          cx={size/2} cy={size/2} r={r}
          className="iv-ring__fill"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={filled}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="iv-ring__label">
        <span className="iv-ring__value">{value ?? '—'}</span>
        <span className="iv-ring__sub">{label}</span>
      </div>
    </div>
  );
}

function PerformanceTrend({ scores }) {
  if (!scores.length) return null;
  const max = 100;
  const w = 120, h = 48, pad = 6;
  const pts = scores.map((s, i) => {
    const x = pad + (i / Math.max(scores.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((s / max) * (h - pad * 2));
    return `${x},${y}`;
  }).join(' ');
  const color = scores[scores.length - 1] >= 75 ? '#4ade80' : scores[scores.length - 1] >= 55 ? '#FFCE00' : '#f87171';
  return (
    <div className="iv-trend">
      <p className="iv-trend__label">Performance trend</p>
      <svg width={w} height={h} className="iv-trend__svg">
        {scores.length > 1 && <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />}
        {scores.map((s, i) => {
          const x = pad + (i / Math.max(scores.length - 1, 1)) * (w - pad * 2);
          const y = h - pad - ((s / max) * (h - pad * 2));
          return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
      </svg>
    </div>
  );
}

export default function InterviewPage() {
  const { id: jobId } = useParams();
  const navigate      = useNavigate();

  // Phase: 'loading' | 'question' | 'feedback' | 'completed' | 'error'
  const [phase, setPhase]             = useState('loading');
  const [sessionId, setSessionId]     = useState(null);
  const [question, setQuestion]       = useState('');
  const [category, setCategory]       = useState('General');
  const [questionNum, setQuestionNum] = useState(1);
  const [answer, setAnswer]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [feedback, setFeedback]       = useState(null);
  const [scores, setScores]           = useState([]);       // per-question scores
  const [finalScores, setFinalScores] = useState(null);
  const [statusMsg, setStatusMsg]     = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [jobTitle, setJobTitle]       = useState('');
  const [jobCompany, setJobCompany]   = useState('');

  const textareaRef = useRef(null);

  // Start the interview session on mount
  useEffect(() => {
    async function init() {
      try {
        setStatusMsg('Nexi is preparing your personalized interview…');
        const res = await api.post(`/jobs/${jobId}/interview`, { mode: 'start' });
        if (res.data.success) {
          setSessionId(res.data.sessionId);
          setQuestion(res.data.question);
          setCategory(res.data.category || 'General');
          setQuestionNum(1);
          // Fetch job title for display
          const jobRes = await api.get(`/jobs/${jobId}`);
          setJobTitle(jobRes.data.job?.title || '');
          setJobCompany(jobRes.data.job?.company || '');
          setPhase('question');
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to start interview. Please try again.');
        setPhase('error');
      }
    }
    init();
  }, [jobId]);

  // Auto-focus textarea when question phase begins
  useEffect(() => {
    if (phase === 'question') {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [phase, questionNum]);

  async function handleSubmitAnswer() {
    if (!answer.trim() || submitting) return;
    setSubmitting(true);
    setStatusMsg('Nexi is reviewing your answer…');
    try {
      const res = await api.post(`/interview/${sessionId}/respond`, { answer: answer.trim() });
      const d   = res.data;
      setFeedback(d.feedback);
      setScores(prev => [...prev, d.feedback.score]);
      setAnswer('');

      if (d.completed) {
        setFinalScores(d.finalScores);
        setPhase('completed');
      } else {
        setPhase('feedback');
        // Store next question details so we can advance
        setQuestion(d.nextQuestion);
        setCategory(d.nextCategory || 'General');
        setQuestionNum(d.questionNumber);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  }

  function handleNextQuestion() {
    setFeedback(null);
    setPhase('question');
  }

  const scoreColor = (v) => v >= 80 ? '#4ade80' : v >= 60 ? '#FFCE00' : '#f87171';

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <>
        <Navbar />
        <div className="iv-loading">
          <div className="iv-loading__mascot">
            <img src="/Nexi/Nexi_InsightB.png" alt="Nexi preparing" />
          </div>
          <p className="iv-loading__msg">{statusMsg}</p>
          <div className="iv-loading__dots"><span /><span /><span /></div>
        </div>
        <Footer />
      </>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <Navbar />
        <div className="iv-error-screen">
          <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" className="iv-error__img" />
          <h2>Something went wrong</h2>
          <p>{errorMsg}</p>
          <button className="iv-btn iv-btn--primary" onClick={() => navigate(`/jobs/${jobId}`)}>
            Back to Job
          </button>
        </div>
        <Footer />
      </>
    );
  }

  if (phase === 'completed') {
    const f = finalScores || {};
    return (
      <>
        <Navbar />
        <div className="iv-page">
          <div className="iv-completed">
            <div className="iv-completed__header">
              <div className="iv-completed__mascot">
                <img src="/Nexi/Nexi_Summarize.png" alt="Nexi" />
              </div>
              <div>
                <h1 className="iv-completed__title">Nexi Interview Report</h1>
                <p className="iv-completed__sub">{jobTitle} · {jobCompany}</p>
              </div>
            </div>

            {/* Score rings */}
            <div className="iv-completed__rings">
              <ScoreRing value={f.overall}           label="Overall"    size={90} />
              <ScoreRing value={f.technicalAccuracy} label="Technical"  size={74} />
              <ScoreRing value={f.communication}     label="Comm."      size={74} />
              <ScoreRing value={f.completeness}      label="Complete"   size={74} />
            </div>

            {/* Performance trend */}
            <PerformanceTrend scores={scores} />

            <div className="iv-completed__grid">
              {/* Strengths */}
              {f.topStrengths?.length > 0 && (
                <div className="iv-completed__card iv-completed__card--green">
                  <div className="iv-completed__card-title">
                    <span className="material-symbols-outlined">thumb_up</span>
                    Top Strengths
                  </div>
                  <ul>
                    {f.topStrengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {f.keyWeaknesses?.length > 0 && (
                <div className="iv-completed__card iv-completed__card--red">
                  <div className="iv-completed__card-title">
                    <span className="material-symbols-outlined">build</span>
                    Areas to Improve
                  </div>
                  <ul>
                    {f.keyWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Recommended skills */}
              {f.recommendedSkills?.length > 0 && (
                <div className="iv-completed__card iv-completed__card--blue iv-completed__card--full">
                  <div className="iv-completed__card-title">
                    <span className="material-symbols-outlined">school</span>
                    Recommended Skills to Develop
                  </div>
                  <div className="iv-completed__skill-chips">
                    {f.recommendedSkills.map((sk, i) => (
                      <span key={i} className="iv-completed__skill-chip">{sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="iv-completed__actions">
              <button className="iv-btn iv-btn--primary" onClick={() => navigate(`/jobs/${jobId}`)}>
                View Job &amp; Apply
              </button>
              <button className="iv-btn iv-btn--ghost" onClick={() => navigate('/jobs')}>
                Browse More Jobs
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ── Active interview (question + feedback) ──────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="iv-page">
        <div className="iv-header">
          <div className="iv-header__title-block">
            <h1 className="iv-header__title">Nexi Interview Simulator</h1>
            <p className="iv-header__sub">Practice before the real interview.</p>
          </div>
          {jobTitle && (
            <div className="iv-header__job">
              <span className="material-symbols-outlined">work</span>
              {jobTitle} · {jobCompany}
            </div>
          )}
        </div>

        <div className="iv-layout">

          {/* ── Left: Mascot ─────────────────────────────────────── */}
          <aside className="iv-mascot-col">
            <div className="iv-mascot-wrap">
              <div className="iv-mascot-frame">
                <img
                  src={phase === 'feedback' || submitting ? '/Nexi/Nexi_InsightB.png' : '/Nexi/Nexi_Summarize.png'}
                  alt="Nexi"
                  className="iv-mascot-img"
                />
              </div>
              <div className="iv-speech-bubble">
                {submitting
                  ? 'Reviewing your answer…'
                  : phase === 'feedback'
                    ? 'Here is my assessment!'
                    : "Let's see how ready you are for this role."}
              </div>
            </div>
          </aside>

          {/* ── Center: Question / Feedback ──────────────────────── */}
          <main className="iv-center-col">
            {phase === 'question' && (
              <div className="iv-question-card">
                <div className="iv-question-card__header">
                  <span className="iv-category-badge">
                    <span className="material-symbols-outlined">
                      {CATEGORY_ICONS[category] || 'chat'}
                    </span>
                    {category}
                  </span>
                  <span className="iv-q-num">Q{questionNum} of {TOTAL_QUESTIONS}</span>
                </div>

                <p className="iv-question-text">{question}</p>

                <textarea
                  ref={textareaRef}
                  className="iv-answer-box"
                  rows={6}
                  placeholder="Type your answer here… Think aloud, be specific, use examples."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  disabled={submitting}
                />

                {errorMsg && <p className="iv-inline-error">{errorMsg}</p>}

                <button
                  className="iv-btn iv-btn--primary iv-submit-btn"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                >
                  {submitting ? (
                    <><span className="iv-spinner" /> {statusMsg || 'Submitting…'}</>
                  ) : 'Submit Answer →'}
                </button>
              </div>
            )}

            {phase === 'feedback' && feedback && (
              <div className="iv-feedback-card">
                <div className="iv-feedback-card__title">
                  <img src="/Nexi/Nexi_InsightB.png" alt="Nexi" className="iv-feedback-card__icon" />
                  Nexi Assessment
                </div>

                {/* Score row */}
                <div className="iv-feedback-scores">
                  <div className="iv-feedback-score">
                    <span className="iv-feedback-score__value" style={{ color: scoreColor(feedback.score) }}>
                      {feedback.score}%
                    </span>
                    <span className="iv-feedback-score__label">Overall</span>
                  </div>
                  <div className="iv-feedback-score">
                    <span className="iv-feedback-score__value">{feedback.technicalAccuracy}%</span>
                    <span className="iv-feedback-score__label">Technical</span>
                  </div>
                  <div className="iv-feedback-score">
                    <span className="iv-feedback-score__value">{feedback.communication}%</span>
                    <span className="iv-feedback-score__label">Comm.</span>
                  </div>
                  <div className="iv-feedback-score">
                    <span className="iv-feedback-score__value">{feedback.completeness}%</span>
                    <span className="iv-feedback-score__label">Complete</span>
                  </div>
                </div>

                <div className="iv-feedback-body">
                  {feedback.strengths?.length > 0 && (
                    <div className="iv-feedback-section iv-feedback-section--green">
                      <p className="iv-feedback-section__title">
                        <span className="material-symbols-outlined">thumb_up</span> Strengths
                      </p>
                      <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}

                  {feedback.improvements?.length > 0 && (
                    <div className="iv-feedback-section iv-feedback-section--amber">
                      <p className="iv-feedback-section__title">
                        <span className="material-symbols-outlined">build</span> Areas for Improvement
                      </p>
                      <ul>{feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}

                  {feedback.strongCandidateTips?.length > 0 && (
                    <div className="iv-feedback-section iv-feedback-section--blue">
                      <p className="iv-feedback-section__title">
                        <span className="material-symbols-outlined">school</span> What strong candidates mention
                      </p>
                      <ul>{feedback.strongCandidateTips.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}

                  {feedback.suggestedAnswer && (
                    <div className="iv-feedback-suggested">
                      <p className="iv-feedback-suggested__title">Suggested approach</p>
                      <p className="iv-feedback-suggested__body">{feedback.suggestedAnswer}</p>
                    </div>
                  )}
                </div>

                <button
                  className="iv-btn iv-btn--primary"
                  onClick={handleNextQuestion}
                >
                  Next Question →
                </button>
              </div>
            )}
          </main>

          {/* ── Right: Progress panel ────────────────────────────── */}
          <aside className="iv-progress-col">
            <div className="iv-progress-panel">
              <p className="iv-progress-panel__title">Interview Progress</p>

              <div className="iv-progress-steps">
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => {
                  const answered = i < scores.length;
                  const active   = i === scores.length && phase !== 'completed';
                  const s        = scores[i];
                  return (
                    <div key={i} className={`iv-step ${answered ? 'iv-step--done' : active ? 'iv-step--active' : ''}`}>
                      <div className="iv-step__dot">
                        {answered
                          ? <span className="material-symbols-outlined" style={{ color: scoreColor(s), fontSize: 14 }}>check_circle</span>
                          : active
                            ? <span className="iv-step__pulse" />
                            : <span className="iv-step__num">{i + 1}</span>}
                      </div>
                      <div className="iv-step__info">
                        <span className="iv-step__name">{CATEGORY_ICONS[TOTAL_QUESTIONS] ? '' : `Q${i + 1}`}</span>
                        {answered && <span className="iv-step__score" style={{ color: scoreColor(s) }}>{s}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {scores.length > 0 && (
                <>
                  <div className="iv-progress-avg">
                    <ScoreRing
                      value={Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}
                      label="Avg Score"
                      size={80}
                    />
                  </div>
                  <PerformanceTrend scores={scores} />
                </>
              )}

              <div className="iv-progress-note">
                <span className="material-symbols-outlined">info</span>
                Nexi adapts difficulty based on your performance.
              </div>
            </div>
          </aside>

        </div>
      </div>
      <Footer />
    </>
  );
}
