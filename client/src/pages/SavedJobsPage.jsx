import { useState, useEffect, useCallback } from "react";
import JobCard from "../components/JobCard";
import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import "./SavedJobsPage.css";

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/jobs/saved");

      // Temporary: check what the API actually returns
      console.log("Saved jobs response:", res.data);

      // Handle common response shapes
      const jobs =
          res.data.jobs ??
          res.data.data ??
          res.data.savedJobs ??
          (Array.isArray(res.data) ? res.data : []);

      setSavedJobs(jobs);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to load saved jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  // Called by JobCard when user clicks Unsave; removes card optimistically
  const handleUnsave = (jobId) => {
    setSavedJobs((prev) => prev.filter((j) => (j._id ?? j.id) !== jobId));
  };

  return (
    <>
      <Navbar />

      <div className="saved-jobs-page">
        <header className="saved-jobs-header">
          <h1 className="saved-jobs-title">
            <span className="bookmark-icon">🔖</span> Saved Jobs
          </h1>
          <p className="saved-jobs-subtitle">
            Positions you&apos;ve bookmarked for later
          </p>
        </header>

        {loading && (
          <div className="saved-jobs-loading">
            <Spinner />
            <p>Loading your saved jobs…</p>
          </div>
        )}

        {error && !loading && (
          <div className="saved-jobs-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchSavedJobs}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && savedJobs.length === 0 && (
          <div className="saved-jobs-empty">
            <span className="empty-icon">📭</span>
            <h2>No saved jobs yet</h2>
            <p>
              Browse listings and click the bookmark icon on any job to save it
              here.
            </p>
            <a href="/jobs" className="browse-btn">
              Browse Jobs
            </a>
          </div>
        )}

        {!loading && !error && savedJobs.length > 0 && (
          <>
            <p className="saved-jobs-count">
              {savedJobs.length} saved {savedJobs.length === 1 ? "job" : "jobs"}
            </p>
            <div className="saved-jobs-grid">
              {savedJobs.map((job) => (
                <JobCard
                  key={job._id ?? job.id}
                  job={job}
                  initialSaved={true}
                  onUnsave={handleUnsave}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
