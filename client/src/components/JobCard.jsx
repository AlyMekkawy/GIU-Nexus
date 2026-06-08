import { Link } from 'react-router-dom';
import './JobCard.css';

// Maps category value → CSS modifier class
const BADGE_CLASS = {
  'Frontend':         'frontend',
  'Backend':          'backend',
  'AI/ML':            'ai',
  'DevOps':           'devops',
  'Data Engineering': 'data',
  'Other':            'other',
};

/**
 * JobCard
 *
 * Props:
 *   job      {object}   – job data object
 *   isSaved  {boolean}  – whether this job is currently saved
 *   onToggleSave {fn}   – called with job._id when the bookmark is clicked
 */
function JobCard({ job, isSaved, onToggleSave }) {
  const badgeClass = `rj-badge rj-badge--${BADGE_CLASS[job.category] || 'other'}`;
  const saved = isSaved ?? job.saved ?? job.isSaved ?? false;
  const canToggleSave = typeof onToggleSave === 'function';

  return (
      <article className="rj-card" data-cy={`job-card-${job._id}`}>

        {/* Card header */}
        <div className="rj-card__head">
          <div className="rj-card__avatar">
            {job.company?.charAt(0).toUpperCase() || 'J'}
          </div>
          <div className="rj-card__badges">
          <span className={badgeClass}>
            <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            {job.category || 'Other'}
          </span>
            {job.score !== undefined && job.score > 0 && (
                <span className="rj-badge rj-badge--score">
              ✦ {Math.round(job.score * 100)}% Match
            </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <h3 className="rj-card__title">{job.title}</h3>
        <p className="rj-card__company">
          {job.company}{job.location ? ` · ${job.location}` : ''}
        </p>

        {/* Skill tags */}
        {(job.requirements || []).length > 0 && (
            <div className="rj-card__skills">
              {(job.requirements || []).slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="rj-skill">{skill}</span>
              ))}
            </div>
        )}

        {/* Card footer */}
        <div className="rj-card__foot">
          <Link to={`/jobs/${job._id}`} className="rj-card__link" data-cy={`job-card-details-${job._id}`}>
            View Details →
          </Link>
          <button
              className={`rj-card__bookmark${saved ? ' saved' : ''}`}
              onClick={() => canToggleSave && onToggleSave(job._id)}
              title={canToggleSave ? (saved ? 'Unsave job' : 'Save job') : 'Save jobs after signing in'}
              disabled={!canToggleSave}
              aria-pressed={saved}
              type="button"
              data-cy={`job-card-save-${job._id}`}
          >
          <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
          </button>
        </div>

      </article>
  );
}

export default JobCard;