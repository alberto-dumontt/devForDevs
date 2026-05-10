import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { PageLoadingContext } from '../contexts/PageLoadingContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [spinnerHiding, setSpinnerHiding] = useState(false);
  const readyRef = useRef(false);
  const location = useLocation();

  const dismiss = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    setSpinnerHiding(true);
    setTimeout(() => setPageLoading(false), 300);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setPageLoading(true);
    setSpinnerHiding(false);
    readyRef.current = false;
    const fallback = setTimeout(dismiss, 600);
    return () => clearTimeout(fallback);
  }, [location.pathname, dismiss]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <header className="topbar">
          <button
            className="btn-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <span /><span /><span />
          </button>
        </header>

        <div className="page-content">
          {pageLoading && (
            <div className={`page-spinner-overlay${spinnerHiding ? ' hiding' : ''}`}>
              <div className="page-spinner" />
            </div>
          )}
          <PageLoadingContext.Provider value={dismiss}>
            <div key={location.pathname} className="page-slide-in">
              <Outlet />
            </div>
          </PageLoadingContext.Provider>
        </div>
      </div>
    </div>
  );
}
