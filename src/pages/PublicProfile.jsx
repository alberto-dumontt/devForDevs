import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';

const countryFlag = (code) =>
  code ? code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397)) : '';

const countryName = (code) => COUNTRIES.find(c => c.code === code)?.name ?? code;

const initials = (str) =>
  str ? str.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

export default function PublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwn = user?.id === id;

  const seniorityLabel = {
    beginner: t('register.seniorityBeginner'),
    junior:   t('register.seniorityJunior'),
    mid:      t('register.seniorityMid'),
    senior:   t('register.senioritySenior'),
  };

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setProfile(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return null;

  if (notFound) {
    return (
      <div className="profile-page">
        <p className="profile-empty">{t('profile.notFound')}</p>
      </div>
    );
  }

  const displayName = profile.name || '—';

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1 className="profile-title">{displayName}</h1>
      </div>

      <div className="profile-card">
        {/* ── Identity ── */}
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

          {isOwn && (
            <Link to="/profile" className="profile-edit-btn">
              {t('profile.edit')}
            </Link>
          )}
        </div>

        {/* ── Bio ── */}
        {profile.bio && (
          <div className="profile-section">
            <span className="profile-section-label">{t('register.bio')}</span>
            <p className="profile-bio">{profile.bio}</p>
          </div>
        )}

        {/* ── Links ── */}
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
          <p className="profile-empty">{t('profile.emptyPublic')}</p>
        )}
      </div>
    </div>
  );
}
