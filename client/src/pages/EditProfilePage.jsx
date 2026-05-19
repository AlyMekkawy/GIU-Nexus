import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

/* ─── Avatar Placeholder ─────────────────────────────────────── */
function AvatarPlaceholder({ name, size = 80 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #0066cc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.32,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── EditProfilePage ─────────────────────────────────────────── */
const BIO_MAX = 500;

function EditProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ── Form state ── */
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null); // URL string
  const [previewUrl, setPreviewUrl] = useState(null);          // local blob preview
  const fileInputRef = useRef(null);

  /* ── API state ── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── Load current profile ── */
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
        /* Fallback to auth user data if API fails */
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

  /* ── Handle photo file pick ── */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  /* ── Handle "Remove" photo ── */
  function handleRemovePhoto() {
    setPreviewUrl(null);
    setProfilePicture(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  /* ── Save changes ── */
  async function handleSave(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Create FormData to handle both JSON fields and file upload
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());
      
      // Add photo file if one was selected
      const photoFile = fileInputRef.current?.files?.[0];
      if (photoFile) {
        formData.append('profilePicture', photoFile);
      }

      // Single PATCH request with both data and file
      // Don't set Content-Type header - let axios handle it automatically with correct boundary
      await api.patch('/profile', formData);

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Bio character count ── */
  const bioCount = bio.length;

  /* ── Current avatar to display ── */
  const avatarSrc = previewUrl || profilePicture;

  /* ────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-canvas-parchment)' }}>
      <Navbar />

      <main
        style={{
          paddingTop: '88px',
          paddingBottom: '80px',
          paddingLeft: '24px',
          paddingRight: '24px',
          maxWidth: '980px',
          margin: '0 auto',
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
        }}
      >
        {/* ── Page Header ── */}
        <header style={{ marginBottom: '32px' }} className="animate-fade-up">
          <h1
            style={{
              margin: 0,
              fontSize: '34px',
              fontWeight: 700,
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            Edit Profile
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '16px',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
            }}
          >
            Keep your profile sharp so recruiters and recommendations understand you better.
          </p>
        </header>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div
            style={{
              background: 'var(--color-surface-container-lowest)',
              borderRadius: '12px',
              padding: '40px',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 4px 24px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid var(--color-outline-variant)',
                borderTop: '3px solid var(--color-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSave} noValidate className="animate-fade-up">

            {/* ─── Main Card ─── */}
            <div
              style={{
                background: 'var(--color-surface-container-lowest)',
                borderRadius: '12px',
                padding: '32px',
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 4px 24px -1px rgba(0,0,0,0.05)',
                marginBottom: '24px',
              }}
            >



              {/* ── Profile Photo ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '28px',
                  paddingBottom: '28px',
                  borderBottom: '1px solid var(--color-hairline)',
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid var(--color-surface-container)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                    }}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <AvatarPlaceholder name={name} size={80} />
                    )}
                  </div>
                  {/* SVG camera overlay — always renders, no icon-font dependency */}
                  <button
                    type="button"
                    id="trigger-photo-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change photo"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: '#000',
                      color: '#fff',
                      border: '2.5px solid #fff',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <svg viewBox="0 0 24 24" fill="white" width="14" height="14" aria-hidden="true">
                      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/>
                      <path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>
                    </svg>
                  </button>
                  <input
                    id="photo-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>

                {/* Photo info + actions */}
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: 'var(--color-on-surface)' }}>
                    Profile Photo
                  </p>
                  <p style={{ margin: '4px 0 10px', fontSize: '13px', color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                    Update your photo to help others recognize you.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button
                      id="upload-photo-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: '#000',
                        border: 'none',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        textDecoration: 'none',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'opacity 0.15s, background 0.15s',
                        borderRadius: '6px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      Upload New
                    </button>
                    <button
                      id="remove-photo-btn"
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-error)',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Full Name Field ── */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="full-name-input"
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--color-on-surface)',
                    marginBottom: '8px',
                  }}
                >
                  Full Name
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    fontSize: '15px',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')}
                />
              </div>

              {/* ── Bio Field ── */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label
                    htmlFor="bio-textarea"
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Bio
                  </label>
                </div>
                <textarea
                  id="bio-textarea"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={7}
                  maxLength={BIO_MAX}
                  placeholder="Describe your professional background, skills, and what you're looking for…"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-outline-variant)',
                    background: 'var(--color-surface-container-lowest)',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    color: 'var(--color-on-surface)',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-outline-variant)')}
                />
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: '13px',
                    color: 'var(--color-ink-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Recruiters use your bio to understand your unique value proposition beyond just skills.
                </p>
              </div>

              {/* ── Error / Success banners ── */}
              {error && (
                <div
                  id="edit-profile-error"
                  style={{
                    background: 'var(--color-error-container)',
                    color: 'var(--color-status-rejected-text)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '20px',
                    border: '1px solid rgba(180,35,24,0.15)',
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  id="edit-profile-success"
                  style={{
                    background: 'var(--color-cat-frontend-bg)',
                    color: 'var(--color-cat-frontend-text)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '20px',
                    border: '1px solid rgba(22,131,58,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  {success}
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={saving || bioCount > BIO_MAX}
                  style={{
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    opacity: saving ? 0.75 : 1,
                    transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.15s',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = saving ? '0.75' : '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {saving && (
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                  )}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>

                <button
                  id="cancel-edit-btn"
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={saving}
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    color: 'var(--color-on-surface-variant)',
                    border: '1.5px solid var(--color-outline-variant)',
                    borderRadius: '9999px',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-container)'; e.currentTarget.style.borderColor = 'var(--color-outline)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-container-lowest)'; e.currentTarget.style.borderColor = 'var(--color-outline-variant)'; }}
                >
                  Cancel
                </button>
              </div>
            </div>{/* /Main Card */}

            {/* ─── Bottom Info Cards ─── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Privacy Control Card */}
              <div
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 2px 12px -1px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '22px', color: 'var(--color-primary)' }}
                  >
                    visibility
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Privacy Control
                  </h2>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-ink-muted)',
                    lineHeight: 1.55,
                  }}
                >
                  Your full profile is only visible to verified GIU Nexus recruiters and partners you have applied to.
                </p>
              </div>

              {/* Profile Strength Card */}
              <div
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 2px 12px -1px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '22px', color: 'var(--color-primary)' }}
                  >
                    bar_chart
                  </span>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'var(--color-on-surface)',
                    }}
                  >
                    Profile Strength
                  </h2>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: '6px',
                    background: 'var(--color-surface-container-high)',
                    borderRadius: '9999px',
                    overflow: 'hidden',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: bio.trim() ? '70%' : '40%',
                      background: 'var(--color-primary)',
                      borderRadius: '9999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-ink-muted)',
                    lineHeight: 1.55,
                  }}
                >
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
