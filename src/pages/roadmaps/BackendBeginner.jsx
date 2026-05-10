import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function BackendBeginner() {
  const { t } = useTranslation();
  const steps = t('roadmaps.backendBeginner.steps', { returnObjects: true });
  const projects = t('roadmaps.backendBeginner.projectIdeas.items', { returnObjects: true });
  const projectIdeas = t('roadmaps.backendBeginner.projectIdeas', { returnObjects: true });

  return (
    <div className="roadmap-page">
      <Link to="/roadmaps" className="roadmap-back">← {t('nav.roadmaps')}</Link>

      <div className="roadmap-header">
        <span className="roadmap-category">{t('roadmaps.backendBeginner.category')}</span>
        <h1 className="roadmap-title">{t('roadmaps.backendBeginner.title')}</h1>
        <p className="roadmap-subtitle">{t('roadmaps.backendBeginner.subtitle')}</p>
      </div>

      <div className="recommender-block">
        <span className="recommender-label">{t('roadmaps.backendBeginner.recommendedBy')}</span>
        <div className="recommender-card">
          <div className="recommender-avatar">AD</div>
          <div className="recommender-info">
            <span className="recommender-name">Alberto Dumontt</span>
            <span className="recommender-role">{t('roadmaps.backendBeginner.recommenderRole')}</span>
            <span className="recommender-exp">{t('roadmaps.backendBeginner.recommenterExp')}</span>
          </div>
          <div className="recommender-right">
            <p className="recommender-bio">{t('roadmaps.backendBeginner.recommenterBio')}</p>
            <a
              href="https://github.com/alberto-dumontt"
              target="_blank"
              rel="noreferrer"
              className="recommender-github"
            >
              <GitHubIcon />
              github.com/alberto-dumontt
            </a>
          </div>
        </div>
      </div>

      <div className="roadmap-steps">
        {steps.map((step, i) => (
          <div key={i} className="roadmap-step">
            <div className="step-rail">
              <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
            <div className="step-body">
              <h2 className="step-title">{step.title}</h2>
              <p className="step-desc">{step.desc}</p>
              <div className="step-tags">
                {step.tags.map((tag) => (
                  <span key={tag} className="step-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="projects-section">
        <div className="projects-header">
          <h2 className="projects-title">{projectIdeas.title}</h2>
          <p className="projects-subtitle">{projectIdeas.subtitle}</p>
        </div>

        <div className="projects-list">
          {projects.map((project, i) => (
            <div key={i} className="project-card">
              <div className="project-card-top">
                <span className="project-index">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="project-title">{project.title}</h3>
              </div>
              <p className="project-desc">{project.desc}</p>
              <div className="project-tags-group">
                <div className="project-tags-row">
                  <span className="project-tags-label">{projectIdeas.conceptsLabel}</span>
                  <div className="step-tags">
                    {project.concepts.map((c) => (
                      <span key={c} className="step-tag step-tag--concept">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="project-tags-row">
                  <span className="project-tags-label">{projectIdeas.stackLabel}</span>
                  <div className="step-tags">
                    {project.stack.map((s) => (
                      <span key={s} className="step-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="roadmap-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}
