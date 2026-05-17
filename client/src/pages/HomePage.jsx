import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import Hero from "../components/Hero";
import IntelligenceCards from "../components/IntelligenceCards";
import JobCard from "../components/JobCard";
import RecommendedJobCard from "../components/RecommendedJobCard";
import TrendingJobRow from "../components/TrendingJobRow";

function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await api.get("/jobs?status=open&limit=6");
        setJobs(res.data.jobs || []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "jobSeeker") return;
    async function fetchRecommended() {
      setLoadingRec(true);
      try {
        const res = await api.get("/jobs/recommended");
        setRecommended(res.data.jobs || []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoadingRec(false);
      }
    }
    fetchRecommended();
  }, [isAuthenticated, user]);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    navigate(`/jobs?${params.toString()}`);
  }

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Navbar />

      <main style={{ paddingTop: '64px' }}>
        <Hero
          keyword={keyword} setKeyword={setKeyword}
          location={location} setLocation={setLocation}
          type={type} setType={setType}
          onSearch={handleSearch}
        />

        <IntelligenceCards />

        {/* Recommended for You */}
        {isAuthenticated && user?.role === "jobSeeker" && (
          <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '34px', fontWeight: '600', margin: '0 0 4px', color: '#1b1b1d' }}>Recommended for You</h2>
                <p style={{ fontSize: '17px', color: '#414753', margin: 0 }}>AI-curated opportunities based on your profile.</p>
              </div>
              <Link to="/jobs/recommended" style={{ color: '#004e9f', fontWeight: '600', textDecoration: 'none' }}>View All</Link>
            </div>

            {loadingRec ? <Spinner /> : recommended.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#727784', display: 'block', marginBottom: '16px' }}>auto_awesome</span>
                <p style={{ color: '#414753', margin: '0 0 16px' }}>No recommendations yet.</p>
                <Link to="/profile" style={{ color: '#004e9f', fontWeight: '600', textDecoration: 'none' }}>Extract skills from your bio →</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {recommended.slice(0, 3).map(job => <RecommendedJobCard key={job._id} job={job} />)}
              </div>
            )}
          </section>
        )}

        {/* Trending Jobs */}
        <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
          <h2 style={{ fontSize: '34px', fontWeight: '600', margin: '0 0 24px', color: '#1b1b1d' }}>Trending Jobs</h2>
          {loadingJobs ? <Spinner /> : jobs.length === 0 ? (
            <p style={{ color: '#414753', textAlign: 'center', padding: '32px 0' }}>No jobs available.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {jobs.slice(0, 3).map(job => <TrendingJobRow key={job._id} job={job} />)}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;