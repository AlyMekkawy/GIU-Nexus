import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./JobCard.css";

const BADGE_CLASS = {
  Frontend:          "frontend",
  Backend:           "backend",
  "AI/ML":           "ai",
  DevOps:            "devops",
  "Data Engineering": "data",
  Other:             "other",
};

function getRequirementList(requirements) {
  if (Array.isArray(requirements)) return requirements;
  if (typeof requirements === "string") {
    return requirements.split(",").map((req) => req.trim()).filter(Boolean);
  }
  return [];
}

export default function JobCard({
  job,
  initialSaved = false,
  onUnsave,
  isSaved,
  onSaveChange,
}) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const {
    _id,
    title,
    company,
    location,
    category,
    requirements,
    score,
  } = job;

  const jobId = _id ?? job.id;
  const effectiveSaved = typeof isSaved === "boolean" ? isSaved : saved;
  const badgeClass = `rj-badge rj-badge--${BADGE_CLASS[category] || "other"}`;
  const requirementList = getRequirementList(requirements);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!jobId) return;

    setSaving(true);
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      if (res.data?.success) {
        const nextSaved = !!res.data.saved;
        if (typeof isSaved === "boolean") {
          onSaveChange?.(nextSaved);
        } else {
          setSaved(nextSaved);
        }
        if (!nextSaved && onUnsave) {
          onUnsave(jobId);
        }
      }
    } catch (err) {
      console.error("Error saving job:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenJob = () => navigate(`/jobs/${jobId}`);

  return (
    <article
      className="job-card"
      onClick={handleOpenJob}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleOpenJob()}
    >
      <div className="job-card__head">
        <div className="job-card__avatar">{company?.charAt(0).toUpperCase() || "J"}</div>

        <div className="job-card__badges">
          <span className={badgeClass}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            {category || "Other"}
          </span>

          {score !== undefined && score > 0 && (
            <span className="rj-badge rj-badge--score">
              ✦ {Math.round(score * 100)}% Match
            </span>
          )}
        </div>
      </div>

      <h3 className="job-card__title">{title}</h3>
      <p className="job-card__company">
        {company}{location ? ` · ${location}` : ""}
      </p>

      {requirementList.length > 0 && (
        <div className="job-card__skills">
          {requirementList.slice(0, 3).map((skill, idx) => (
            <span key={`${skill}-${idx}`} className="job-card__skill">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="job-card__foot">
        <Link to={`/jobs/${jobId}`} className="job-card__link" onClick={(e) => e.stopPropagation()}>
          View Details →
        </Link>

        <button
          className={`job-card__bookmark${effectiveSaved ? " saved" : ""}`}
          onClick={handleToggleSave}
          title={effectiveSaved ? "Unsave job" : "Save job"}
          type="button"
          disabled={saving}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: effectiveSaved ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark
          </span>
        </button>
      </div>
    </article>
  );
}
