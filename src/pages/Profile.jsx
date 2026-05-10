import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';

const countryFlag = (code) =>
  code
    ? code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
    : '';

const countryName = (code) => COUNTRIES.find(c => c.code === code)?.name ?? code;

const initials = (str) =>
  str ? str.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [seniority, setSeniority] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const p = data ?? {};
        setProfile(p);
        setName(p.name ?? '');
        setJobTitle(p.job_title ?? '');
        setSeniority(p.seniority ?? '');
        setCompany(p.company ?? '');
        setCountry(p.country ?? '');
        setBio(p.bio ?? '');
        setGithub(p.github ?? '');
        setLinkedin(p.linkedin ?? '');
        setPageLoading(false);
      });
  }, [user]);

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setName(profile.name ?? '');
    setJobTitle(profile.job_title ?? '');
    setSeniority(profile.seniority ?? '');
    setCompany(profile.company ?? '');
    setCountry(profile.country ?? '');
    setBio(profile.bio ?? '');
    setGithub(profile.github ?? '');
    setLinkedin(profile.linkedin ?? '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = { name, job_title: jobTitle, seniority, company, country, bio, github, linkedin };
    const { error: err } = await updateProfile(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }

    setProfile(prev => ({ ...prev, ...payload }));
    setEditing(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const seniorityLabel = {
    beginner: t('register.seniorityBeginner'),
    junior:   t('register.seniorityJunior'),
    mid:      t('register.seniorityMid'),
    senior:   t('register.senioritySenior'),
  };

  if (pageLoading) return null;

  const displayName = profile.name || user.email;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">{t('profile.title')}</h1>
      </div>

      {success && <p className="profile-success">{t('profile.saved')}</p>}

      <div className="profile-card">
        {/* ── Identity bar ── */}
        <div className="profile-identity">
          <div className="profile-avatar-lg">
            {initials(displayName)}
          </div>

          <div className="profile-identity-info">
            <span className="profile-name">{displayName}</span>

            {(profile.job_title || profile.seniority) && (
              <div className="profile-meta-row">
                {profile.job_title && <span className="profile-job">{profile.job_title}</span>}
                {profile.job_title && profile.seniority && <span className="profile-sep">·</span>}
                {profile.seniority && <span className="profile-badge">{seniorityLabel[profile.seniority]}</span>}
              </div>
            )}

            {(profile.country || profile.company) && (
              <div className="profile-meta-row profile-location">
                {profile.country && (
                  <span>{countryFlag(profile.country)} {countryName(profile.country)}</span>
                )}
                {profile.country && profile.company && <span className="profile-sep">·</span>}
                {profile.company && <span>{profile.company}</span>}
              </div>
            )}
          </div>

          {!editing && (
            <button className="profile-edit-btn" onClick={() => setEditing(true)}>
              {t('profile.edit')}
            </button>
          )}
        </div>

        {/* ── View mode ── */}
        {!editing && (
          <>
            {profile.bio && (
              <div className="profile-section">
                <span className="profile-section-label">{t('register.bio')}</span>
                <p className="profile-bio">{profile.bio}</p>
              </div>
            )}

            {(profile.github || profile.linkedin) && (
              <div className="profile-section">
                <span className="profile-section-label">{t('profile.links')}</span>
                <div className="profile-links">
                  {profile.github && (
                    <a
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link"
                    >
                      github.com/{profile.github}
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link"
                    >
                      linkedin.com/in/{profile.linkedin}
                    </a>
                  )}
                </div>
              </div>
            )}

            {!profile.bio && !profile.github && !profile.linkedin && (
              <p className="profile-empty">{t('profile.empty')}</p>
            )}
          </>
        )}

        {/* ── Edit form ── */}
        {editing && (
          <form className="profile-form" onSubmit={handleSave}>
            {error && <p className="login-error">{error}</p>}

            <div className="login-field">
              <label className="login-label">
                {t('register.name')} <span className="register-required">*</span>
              </label>
              <input
                type="text"
                className="login-input"
                placeholder={t('register.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="register-row">
              <div className="login-field">
                <label className="login-label">{t('register.jobTitle')}</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder={t('register.jobTitlePlaceholder')}
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>
              <div className="login-field">
                <label className="login-label">{t('register.seniority')}</label>
                <select className="login-input" value={seniority} onChange={e => setSeniority(e.target.value)}>
                  <option value="">{t('register.senioritySelect')}</option>
                  <option value="beginner">{t('register.seniorityBeginner')}</option>
                  <option value="junior">{t('register.seniorityJunior')}</option>
                  <option value="mid">{t('register.seniorityMid')}</option>
                  <option value="senior">{t('register.senioritySenior')}</option>
                </select>
              </div>
            </div>

            <div className="register-row">
              <div className="login-field">
                <label className="login-label">{t('register.country')}</label>
                <select className="login-input" value={country} onChange={e => setCountry(e.target.value)}>
                  <option value="">{t('register.countrySelect')}</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="login-field">
                <label className="login-label">{t('register.company')}</label>
                <input
                  type="text"
                  className="login-input"
                  placeholder={t('register.companyPlaceholder')}
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">{t('register.bio')}</label>
              <textarea
                className="login-input register-textarea"
                placeholder={t('register.bioPlaceholder')}
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="register-row">
              <div className="login-field">
                <label className="login-label">GitHub</label>
                <div className="register-input-prefix">
                  <span>github.com/</span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder={t('register.githubPlaceholder')}
                    value={github}
                    onChange={e => setGithub(e.target.value)}
                  />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">LinkedIn</label>
                <div className="register-input-prefix">
                  <span>linkedin.com/in/</span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder={t('register.linkedinPlaceholder')}
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="profile-form-actions">
              <button type="button" className="profile-cancel-btn" onClick={handleCancel}>
                {t('profile.cancel')}
              </button>
              <button type="submit" className="profile-save-btn" disabled={saving || !name.trim()}>
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
