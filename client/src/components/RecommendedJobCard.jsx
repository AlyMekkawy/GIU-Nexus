import { Link } from "react-router-dom";
import { categoryConfig } from "./JobCard";

function RecommendedJobCard({ job }) {
  const cat = categoryConfig[job.category] || categoryConfig.Other;

  return (
    <div
      style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '18px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '48px', height: '48px', background: cat.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: cat.color }}>{cat.icon}</span>
        </div>
        {job.score !== undefined && (
          <div style={{ background: '#0066cc', color: '#fff', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
            {Math.round(job.score * 100)}% Match
          </div>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px', color: '#1b1b1d' }}>{job.title}</h4>
        <p style={{ fontSize: '14px', color: '#414753', margin: 0 }}>{job.company} • {job.location}</p>
      </div>

      {job.requirements && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {job.requirements.slice(0, 2).map((req, i) => (
            <span key={i} style={{ background: cat.bg, color: cat.color, padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500' }}>
              {req}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
        <span style={{ fontSize: '12px', color: '#727784' }}>{job.category}</span>
        <Link to={`/jobs/${job._id}`} style={{ fontSize: '14px', fontWeight: '600', color: '#004e9f', textDecoration: 'none' }}>
          View →
        </Link>
      </div>
    </div>
  );
}

export default RecommendedJobCard;