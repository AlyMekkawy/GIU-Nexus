import { Link } from "react-router-dom";

function TrendingJobRow({ job }) {
  return (
    <Link
      to={`/jobs/${job._id}`}
      style={{
        background: '#fafafc', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px',
        padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
        textDecoration: 'none', transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f0edef'}
      onMouseLeave={e => e.currentTarget.style.background = '#fafafc'}
    >
      <div style={{
        width: '40px', height: '40px', background: '#eae7ea', borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', color: '#004e9f', fontSize: '16px', flexShrink: 0,
      }}>
        {job.company?.charAt(0).toUpperCase() || 'J'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#1b1b1d', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
        <p style={{ fontSize: '12px', color: '#414753', margin: 0 }}>{job.company}</p>
      </div>
      <span className="material-symbols-outlined" style={{ color: '#727784', flexShrink: 0 }}>chevron_right</span>
    </Link>
  );
}

export default TrendingJobRow;