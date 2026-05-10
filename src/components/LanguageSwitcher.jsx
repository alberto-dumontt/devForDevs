import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div className="lang-switcher">
      <button
        className={`lang-btn${current === 'en' ? ' active' : ''}`}
        onClick={() => i18n.changeLanguage('en')}
      >
        EN
      </button>
      <span className="lang-sep">|</span>
      <button
        className={`lang-btn${current === 'pt-BR' ? ' active' : ''}`}
        onClick={() => i18n.changeLanguage('pt-BR')}
      >
        PT
      </button>
    </div>
  );
}
