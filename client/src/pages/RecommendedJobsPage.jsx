import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import '../styles/RecommendedJobsPage.css';

function RecommendedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const res = await api.get("/jobs/recommended");
        setJobs(res.data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommended();
  }, []);

  const toggleSaveJob = async (jobId) => {
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data.success) {
        const newSaved = new Set(savedJobs);
        if (res.data.saved) {
          newSaved.add(jobId);
        } else {
          newSaved.delete(jobId);
        }
        setSavedJobs(newSaved);
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  const getCategoryBadgeClass = (category) => {
    const map = {
      'Frontend': 'frontend',
      'Backend': 'backend',
      'AI/ML': 'ai',
      'DevOps': 'devops',
      'Data Engineering': 'data',
      'Other': 'other',
    };
    return map[category] || 'other';
  };

  return (
    <>
      <Navbar />
      <main className="recommended-main">
        <div className="main-container">

          {/* Hero Section */}
          <header className="recommended-header">
            <h1>Recommended for you</h1>
            <p>
              Our AI ranking engine has analyzed your profile bio and preferences to curate these
              opportunities specifically for your career trajectory.
            </p>
          </header>

          {loading ? (
            <Spinner />
          ) : error ? (
            <section className="empty-state">
              <div className="empty-state-icon">
                <span className="material-symbols-outlined">wifi_off</span>
              </div>
              <h2>AI service unavailable</h2>
              <p>The recommendation engine is temporarily unavailable. Browse all jobs instead.</p>
              <Link to="/jobs" className="empty-state-link">Browse All Jobs</Link>
            </section>
          ) : jobs.length === 0 ? (
            <section className="empty-state">
              <div className="empty-state-icon">
                <span className="material-symbols-outlined">person_search</span>
              </div>
              <h2>No recommendations yet.</h2>
              <p>
                Our AI needs a bit more context to find your perfect fit. Add a detailed bio to your
                profile to unlock personalized matches.
              </p>
              <Link to="/profile" className="empty-state-link">Update Profile Bio</Link>
            </section>
          ) : (
            <>
              <p style={{ color: '#6e6e73', fontSize: '14px', marginBottom: '24px' }}>
                {jobs.length} opportunities matched to your profile
              </p>
              <div className="job-grid">
                {jobs.map((job) => (
                  <div key={job._id} className="glass-card">
                    <div className="card-header">
                      <div className="card-avatar">
                        {job.company?.charAt(0).toUpperCase() || 'J'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span className={`card-badge ${getCategoryBadgeClass(job.category)}`}>
                          <span className="material-symbols-outlined">auto_awesome</span>
                          {job.category || 'Other'}
                        </span>
                        {job.score !== undefined && job.score > 0 && (
                          <span style={{ background: '#004e9f', color: '#fff', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700' }}>
                            {Math.round(job.score * 100)}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="card-title">{job.title}</h3>
                    <p className="card-company">{job.company} · {job.location}</p>

                    <div className="card-skills">
                      {(job.requirements || []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>

                    <div className="card-footer">
                      <Link
                        to={`/jobs/${job._id}`}
                        style={{ color: '#004e9f', fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}
                      >
                        View Details →
                      </Link>
                      <button
                        className="bookmark-btn"
                        onClick={() => toggleSaveJob(job._id)}
                        title={savedJobs.has(job._id) ? 'Unsave job' : 'Save job'}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontVariationSettings: savedJobs.has(job._id) ? "'FILL' 1" : "'FILL' 0",
                            color: savedJobs.has(job._id) ? '#004e9f' : undefined
                          }}
                        >
                          bookmark
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default RecommendedJobsPage;