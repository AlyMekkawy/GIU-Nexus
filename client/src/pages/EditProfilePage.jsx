import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './EditProfilePage.css';

const BIO_MAX = 500;

function EditProfilePage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName]               = useState('');
  const [bio, setBio]                 = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl]   = useState(null);

  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  /* ── Load profile ── */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get('/profile');
        const profileData = data.user || data;
        if (mounted) {
          setName(profileData.name || '');
          setBio(profileData.bio || '');
          setProfilePicture(profileData.profilePicture || null);
        }
      } catch {
        if (mounted && user) {
          setName(user.name || '');
          setBio('');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setPreviewUrl(null);
    setProfilePicture(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());
      const photoFile = fileInputRef.current?.files?.[0];
      if (photoFile) formData.append('profilePicture', photoFile);

      await api.patch('/profile', formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  const bioCount  = bio.length;
  const avatarSrc = previewUrl || profilePicture;
  const initials  = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const profileStrength = bio.trim() ? 70 : 40;

  return (
    <div className="ep-page">
      <Navbar />

      <main className="ep-main">
        {/* ── Page header ── */}
        <header className="ep-header">
          <button
            className="ep-header__back"
            type="button"
            onClick={() => navigate('/profile')}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Back to Profile
          </button>
          <h1 className="ep-header__title">Edit Profile</h1>
          <p className="ep-header__subtitle">
            Keep your profile sharp so recruiters and recommendations understand you better.
          </p>
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div className="ep-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid var(--border-s)', borderTopColor: 'var(--red)',
              animation: 'ep-spin 0.75s linear infinite',
            }} />
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSave} noValidate>

            {/* ── Main card ── */}
            <div className="ep-card">

              {/* Photo section */}
              <div className="ep-photo">
                <div className="ep-photo__avatar-wrap">
                  <div className="ep-photo__avatar">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Profile" />
                    ) : (
                      <div className="ep-photo__initials">{initials}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ep-photo__camera"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change photo"
                    aria-label="Change photo"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      photo_camera
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>

                <div className="ep-photo__text">
                  <h3>Profile Photo</h3>
                  <p>Update your photo to help others recognize you.</p>
                  <div className="ep-photo__actions">
                    <button
                      type="button"
                      className="ep-photo__upload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload New
                    </button>
                    <button
                      type="button"
                      className="ep-photo__remove"
                      onClick={handleRemovePhoto}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="ep-field">
                <label className="ep-label" htmlFor="ep-name">Full Name</label>
                <input
                  id="ep-name"
                  className="ep-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              {/* Bio */}
              <div className="ep-field">
                <label className="ep-label" htmlFor="ep-bio">
                  Bio
                  <span style={{ float: 'right', fontWeight: 400, color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    {bioCount}/{BIO_MAX}
                  </span>
                </label>
                <textarea
                  id="ep-bio"
                  className="ep-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={7}
                  maxLength={BIO_MAX}
                  placeholder="Describe your professional background, skills, and what you're looking for…"
                />
                <p className="ep-hint">
                  Recruiters use your bio to understand your unique value proposition beyond just skills.
                </p>
              </div>

              {/* Banners */}
              {error   && <div className="ep-error">{error}</div>}
              {success && (
                <div className="ep-success">
                  <span className="material-symbols-outlined">check_circle</span>
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="ep-actions">
                <button
                  type="submit"
                  className="ep-btn-save"
                  disabled={saving || bioCount > BIO_MAX}
                >
                  {saving && <span className="ep-btn-spinner" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="ep-btn-cancel"
                  onClick={() => navigate('/profile')}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* ── Info cards ── */}
            <div className="ep-info-grid">
              <div className="ep-info-card">
                <div className="ep-info-card__head">
                  <span className="material-symbols-outlined ep-info-card__icon">visibility</span>
                  <h2 className="ep-info-card__title">Privacy Control</h2>
                </div>
                <p className="ep-info-card__body">
                  Your full profile is only visible to verified GIU Nexus recruiters and partners you have applied to.
                </p>
              </div>

              <div className="ep-info-card">
                <div className="ep-info-card__head">
                  <span className="material-symbols-outlined ep-info-card__icon">bar_chart</span>
                  <h2 className="ep-info-card__title">Profile Strength</h2>
                </div>
                <div className="ep-progress">
                  <div className="ep-progress__fill" style={{ width: `${profileStrength}%` }} />
                </div>
                <p className="ep-info-card__body">
                  Adding a professional bio increases profile views by 40%.
                </p>
              </div>
            </div>

          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default EditProfilePage;
