import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SaveJobButton from "./SaveJobButton";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import "./JobCard.css";

// Category → colour map (spec §5)
const CATEGORY_COLORS = {
  Frontend:         { bg: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  Backend:          { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  "AI/ML":          { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  DevOps:           { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" },
  "Data Engineering":{ bg: "#ffedd5", text: "#9a3412", border: "#fdba74" },
  Other:            { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" },
};

export default function JobCard({ job, initialSaved = false, onUnsave }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);

  const {
    _id,
    title,
    company,
    location,
    type,
    status,
    category,
    applicationStatus, // present if the seeker has applied
  } = job;

  const catStyle = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;

  const handleSaveToggle = (newSaved) => {
    setSaved(newSaved);
    // If we're on the SavedJobsPage, propagate the unsave upward
    if (!newSaved && onUnsave) {
      onUnsave(_id);
    }
  };

  return (
    <div
      className="job-card"
      onClick={() => navigate(`/jobs/${_id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/jobs/${_id}`)}
    >
      {/* Category badge */}
      <span
        className="job-card__category"
        style={{
          background: catStyle.bg,
          color: catStyle.text,
          border: `1px solid ${catStyle.border}`,
        }}
      >
        {category ?? "Other"}
      </span>

      <h3 className="job-card__title">{title}</h3>
      <p className="job-card__company">{company}</p>

      <div className="job-card__meta">
        {location && (
          <span className="job-card__meta-item">
            <span aria-hidden>📍</span> {location}
          </span>
        )}
        {type && (
          <span className="job-card__meta-item">
            <span aria-hidden>💼</span> {type}
          </span>
        )}
      </div>

      {/* Application status (if the seeker already applied) */}
      {applicationStatus && (
        <div className="job-card__app-status">
          <ApplicationStatusBadge status={applicationStatus} />
        </div>
      )}

      {/* Save / Unsave — stop propagation so clicking the icon doesn't open the detail page */}
      <div
        className="job-card__save"
        onClick={(e) => e.stopPropagation()}
      >
        <SaveJobButton
          jobId={_id}
          jobStatus={status}
          initialSaved={saved}
          onToggle={handleSaveToggle}
        />
      </div>
    </div>
  );
}
