import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LOCKED_KEYS = ['backendMid', 'cyberSecurity', 'ai', 'devops'];

export default function RoadmapsIndex() {
  const { t } = useTranslation();

  return (
    <div className="roadmap-index-page">
      <div className="roadmap-index-header">
        <h1 className="roadmap-index-title">{t('roadmaps.index.title')}</h1>
        <p className="roadmap-index-subtitle">{t('roadmaps.index.subtitle')}</p>
      </div>

      <div className="roadmap-cards-grid">
        <Link to="/roadmaps/backend-beginner" className="roadmap-card roadmap-card--active">
          <div className="roadmap-card-top">
            <span className="roadmap-card-area">Backend</span>
            <span className="roadmap-card-level">{t('roadmaps.backendBeginner.level')}</span>
          </div>
          <h2 className="roadmap-card-title">{t('roadmaps.backendBeginner.navLabel')}</h2>
          <p className="roadmap-card-desc">{t('roadmaps.backendBeginner.cardDesc')}</p>
          <div className="roadmap-card-footer">
            <div className="roadmap-card-author">
              <span className="author-avatar">AD</span>
              <span className="author-name">Alberto Dumontt</span>
            </div>
            <span className="roadmap-card-cta">→</span>
          </div>
        </Link>

        {LOCKED_KEYS.map((key) => {
          const item = t(`roadmaps.locked.${key}`, { returnObjects: true });
          return (
            <div key={key} className="roadmap-card roadmap-card--locked">
              <div className="roadmap-card-top">
                <span className="roadmap-card-area">{item.area}</span>
                <span className="roadmap-card-soon">{t('roadmaps.index.comingSoon')}</span>
              </div>
              <h2 className="roadmap-card-title">{item.label}</h2>
              <div className="roadmap-card-placeholder">
                <span /><span /><span />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
