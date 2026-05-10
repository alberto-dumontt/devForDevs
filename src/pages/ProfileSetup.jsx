import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { COUNTRIES } from '../lib/countries';

function BrandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#1a1a1a"/>
      <path d="M11 8L5 16L11 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="18.5" y1="7" x2="14.5" y2="25" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M21 8L27 16L21 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ProfileSetup() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const meta = user?.user_metadata ?? {};
  const [name, setName] = useState(meta.full_name ?? meta.name ?? '');
  const [jobTitle, setJobTitle] = useState(meta.job_title ?? '');
  const [seniority, setSeniority] = useState(meta.seniority ?? '');
  const [company, setCompany] = useState(meta.company ?? '');
  const [bio, setBio] = useState(meta.bio ?? '');
  const [country, setCountry] = useState(meta.country ?? '');
  const [github, setGithub] = useState(meta.github ?? meta.user_name ?? '');
  const [linkedin, setLinkedin] = useState(meta.linkedin ?? '');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await updateProfile({
      name,
      job_title: jobTitle,
      seniority,
      country,
      company,
      bio,
      github,
      linkedin,
      setup_complete: true,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate('/', { replace: true });
  };

  const handleSkip = async () => {
    await updateProfile({ setup_complete: true });
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <BrandIcon />
          <div className="login-brand-text">
            <span className="login-brand-name">dev for devs</span>
            <span className="login-brand-rel">1:n · one to many</span>
          </div>
        </div>

        <div className="login-header">
          <h1 className="login-title">{t('profileSetup.title')}</h1>
          <p className="login-subtitle">{t('profileSetup.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="login-error">{error}</p>}

          <div className="login-field">
            <label className="login-label">
              {t('register.name')}
              <span className="register-required">*</span>
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
              <select
                className="login-input"
                value={seniority}
                onChange={e => setSeniority(e.target.value)}
              >
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
              <select
                className="login-input"
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
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

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !name.trim()}
          >
            {loading ? t('register.registering') : t('profileSetup.save')}
          </button>
        </form>

        <button
          type="button"
          className="login-back"
          style={{ background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem' }}
          onClick={handleSkip}
        >
          {t('profileSetup.skip')}
        </button>
      </div>
    </div>
  );
}
