import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getCountries } from '../lib/countries';

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

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const { signUp, signInWithGitHub, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Step 1 fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Step 2 fields
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [seniority, setSeniority] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t('register.passwordMismatch')); return; }
    if (password.length < 6) { setError(t('register.passwordTooShort')); return; }
    setStep(2);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: err } = await signUp(email, password, {
      name,
      job_title: jobTitle,
      seniority,
      company,
      country,
      bio,
      github,
      linkedin,
      setup_complete: true,
    });

    setLoading(false);
    if (err) { setError(err.message); return; }

    if (data.session) {
      navigate('/', { replace: true });
    } else {
      setEmailSent(true);
    }
  };

  const handleGitHub = async () => {
    setError('');
    const { error: err } = await signInWithGitHub();
    if (err) setError(err.message);
  };

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err.message);
  };

  if (emailSent) {
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
            <h1 className="login-title">{t('register.checkEmailTitle')}</h1>
            <p className="login-subtitle">{t('register.checkEmailDesc', { email })}</p>
          </div>
          <Link to="/login" className="login-btn" style={{ textAlign: 'center', display: 'block', marginTop: '1rem' }}>
            {t('register.goToLogin')}
          </Link>
        </div>
      </div>
    );
  }

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

        {/* Step indicator */}
        <div className="register-steps">
          <div className={`register-step${step >= 1 ? ' active' : ''}`}>
            <span className="register-step-number">1</span>
            <span className="register-step-label">{t('register.step1Label')}</span>
          </div>
          <div className="register-step-divider" />
          <div className={`register-step${step >= 2 ? ' active' : ''}`}>
            <span className="register-step-number">2</span>
            <span className="register-step-label">{t('register.step2Label')}</span>
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="login-header">
              <h1 className="login-title">{t('register.title')}</h1>
              <p className="login-subtitle">{t('register.subtitle')}</p>
            </div>

            <form className="login-form" onSubmit={handleStep1}>
              {error && <p className="login-error">{error}</p>}

              <div className="login-field">
                <label className="login-label">{t('login.email')}</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label">{t('login.password')}</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder={t('register.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label">{t('register.confirmPassword')}</label>
                <input
                  type="password"
                  className="login-input"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={!email.trim() || !password.trim() || !confirm.trim()}
              >
                {t('register.next')}
              </button>
            </form>

            <div className="login-register-row">
              <span className="login-footer-text">{t('register.hasAccount')}</span>
              <Link to="/login" className="login-register-btn">{t('login.submit')}</Link>
            </div>

            <Link to="/" className="login-back">{t('login.back')}</Link>
          </>
        )}

        {step === 2 && (
          <>
            <div className="login-header">
              <h1 className="login-title">{t('register.profileTitle')}</h1>
              <p className="login-subtitle">{t('register.profileSubtitle')}</p>
            </div>

            <form className="login-form" onSubmit={handleStep2}>
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
                    {getCountries(t).map(c => (
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
                {loading ? t('register.registering') : t('register.submit')}
              </button>
            </form>

            <button className="login-back" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setStep(1); setError(''); }}>
              ← {t('register.backToStep1')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
