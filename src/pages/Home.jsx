import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OFFERINGS = ['start', 'career', 'networking', 'resources'];

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="home">
      <section className="hero">
        <span className="hero-badge">1:n · one to many</span>
        <h1 className="hero-title">{t('home.hero.tagline')}</h1>
        <p className="hero-desc">{t('home.hero.description')}</p>
        <Link to="/community" className="btn-primary">
          {t('home.hero.cta')} <span className="btn-arrow">→</span>
        </Link>
      </section>

      <div className="divider" />

      <section className="offerings">
        <span className="section-label">{t('home.offering.title')}</span>
        <div className="offerings-grid">
          {OFFERINGS.map((key, i) => (
            <div key={key} className="offering-card">
              <span className="offering-index">0{i + 1}</span>
              <h3 className="offering-title">{t(`home.offering.${key}.title`)}</h3>
              <p className="offering-desc">{t(`home.offering.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="creator">
        <span className="section-label">{t('home.creator.label')}</span>
        <div className="creator-card">
          <div className="creator-avatar">AD</div>
          <div className="creator-body">
            <div className="creator-header">
              <h2 className="creator-name">Alberto Dumontt</h2>
              <span className="creator-role">{t('home.creator.role')}</span>
            </div>
            <p className="creator-bio">{t('home.creator.bio')}</p>
            <a
              href="https://github.com/alberto-dumontt"
              target="_blank"
              rel="noreferrer"
              className="creator-github-link"
            >
              <span className="github-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </span>
              {t('home.creator.github')}
              <span className="link-arrow">↗</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}
