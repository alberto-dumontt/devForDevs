import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>
            {t('profile.cancel')}
          </button>
          <button className="confirm-delete-btn" onClick={onConfirm}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
