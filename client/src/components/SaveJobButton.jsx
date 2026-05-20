import { useState } from 'react';
import api from '../services/api';

export default function SaveJobButton({ jobId, isSaved = false, onSaveChange }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [error, setError] = useState(null);

  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError(null);

    try {
      const res = await api.post(`/jobs/${jobId}/save`);
      
      if (res.data.success) {
        setSaved(res.data.saved);
        if (onSaveChange) {
          onSaveChange(res.data.saved);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save job');
      console.error('Error saving job:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSaveClick}
      disabled={loading}
      className={`save-job-btn ${saved ? 'saved' : ''} ${loading ? 'loading' : ''}`}
      title={saved ? 'Remove from saved jobs' : 'Save this job'}
      aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
    >
      <span className="save-icon">
        {loading ? '⏳' : saved ? '❤️' : '🤍'}
      </span>
      <span className="save-text">
        {loading ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </span>
      {error && <span className="error-tooltip">{error}</span>}
    </button>
  );
}
