import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

function BrandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#1a1a1a"/>
      <path d="M11 8L5 16L11 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="18.5" y1="7" x2="14.5" y2="25" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M21 8L27 16L21 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${open ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-inner">
            <div className="sidebar-brand-top">
              <BrandIcon />
              <span className="sidebar-brand-name">dev for devs</span>
            </div>
            <span className="sidebar-brand-rel">1:n · one to many</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Fechar menu">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('nav.home')}
          </NavLink>
        </nav>

        <span className="sidebar-nav-label">{t('nav.toolsLabel')}</span>

        <nav className="sidebar-nav">
          <NavLink
            to="/spec"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('nav.devspecai')}
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('jobs.navItem')}
          </NavLink>
          <NavLink
            to="/recommendations"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('nav.recommendations')}
          </NavLink>
        </nav>

        <span className="sidebar-nav-label">{t('nav.studyLabel')}</span>

        <nav className="sidebar-nav">
          <NavLink
            to="/roadmaps"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('nav.roadmaps')}
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('nav.courses')}
          </NavLink>
        </nav>

        <span className="sidebar-nav-label">{t('community.navLabel')}</span>

        <nav className="sidebar-nav">
          <NavLink
            to="/community"
            className={({ isActive }) => `sidebar-link sidebar-link--tool${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            {t('community.navItem')}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <>
              <Link to="/profile" className="sidebar-user" onClick={onClose}>
                <div className="sidebar-user-avatar">
                  {(user.user_metadata?.name || user.email || '?')
                    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">
                    {user.user_metadata?.name || user.email}
                  </span>
                  <span className="sidebar-user-sub">{t('profile.viewProfile')}</span>
                </div>
              </Link>
              <button className="sidebar-login-btn" onClick={handleSignOut}>
                {t('login.logout')}
              </button>
            </>
          ) : (
            <Link to="/login" className="sidebar-login-btn" onClick={onClose}>
              {t('login.loginBtn')}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </aside>
    </>
  );
}
