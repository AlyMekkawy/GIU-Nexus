import { useState } from 'react';
import api from '../services/api';
import './SaveJobButton.css';

function SaveJobButton({ jobId, initialSaved = false, jobStatus }) {
    const [saved, setSaved] = useState(initialSaved);
    const [loading, setLoading] = useState(false);

    const isDisabled = jobStatus !== 'open' || loading;

    async function handleToggle() {
        if (isDisabled) return;
        setLoading(true);
        try {
            const res = await api.post(`/jobs/${jobId}/save`);
            setSaved(res.data.saved);
        } catch (err) {
            console.error('Save toggle failed:', err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            className={`save-job-btn ${saved ? 'saved' : ''}`}
            onClick={handleToggle}
            disabled={isDisabled}
            title={saved ? 'Unsave job' : 'Save job'}
        >
            <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {saved ? 'Saved' : 'Save'}
        </button>
    );
}

export default SaveJobButton;
