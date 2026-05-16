import { useState } from "react";
import api from "../services/api";
import "./SaveJobButton.css";

/**
 * SaveJobButton
 * Calls POST /api/v1/jobs/:jobId/save (same endpoint toggles save/unsave).
 * Reads `saved` boolean from the response to confirm new state.
 * Disabled when job status !== "open" (backend returns 400 otherwise).
 *
 * Props:
 *   jobId        — MongoDB ObjectId string
 *   jobStatus    — "open" | "closed" | etc.
 *   initialSaved — boolean
 *   onToggle(newSaved: boolean) — optional callback
 */
export default function SaveJobButton({
  jobId,
  jobStatus,
  initialSaved = false,
  onToggle,
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  const isDisabled = jobStatus !== "open" || loading;

  const handleClick = async (e) => {
    e.stopPropagation(); // prevent card navigation
    if (isDisabled) return;

    setLoading(true);
    try {
      const res = await api.post(`/api/v1/jobs/${jobId}/save`);
      const newSaved = res.data.saved ?? !saved;
      setSaved(newSaved);
      onToggle?.(newSaved);
    } catch (err) {
      console.error("Save toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`save-job-btn ${saved ? "save-job-btn--saved" : ""}`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={saved ? "Unsave job" : "Save job"}
      title={
        jobStatus !== "open"
          ? "Job is closed"
          : saved
          ? "Remove from saved"
          : "Save job"
      }
    >
      {loading ? (
        <span className="save-job-btn__spinner" aria-hidden />
      ) : saved ? (
        /* Filled bookmark */
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"
          />
        </svg>
      ) : (
        /* Outline bookmark */
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5z"
          />
        </svg>
      )}
    </button>
  );
}
