import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestGenerateSpec } from '../services/api';
import { supabase } from '../lib/supabase';

export default function GenerateSpec() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const [technologies, setTechnologies] = useState('');
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [spec, setSpec] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({ technologies: false, goal: false, level: false });

  const validate = () => {
    const next = {
      technologies: !technologies.trim(),
      goal: !goal.trim(),
      level: !level,
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { setSpec(''); return; }

    const levelMap = { '1': 'JUNIOR', '2': 'MID', '3': 'SENIOR' };

    try {
      setLoading(true);
      setSpec('');
      const language = i18n.language === 'pt-BR' ? 'pt-br' : 'en';
      const response = await requestGenerateSpec({
        technologies,
        professionalLevel: levelMap[level],
        careerObjective: goal,
        language,
      });
      setSpec(response.spec);
      await supabase.from('devspec_usages').insert({
        user_id: user.id,
        technologies,
        career_level: levelMap[level],
        career_goal: goal,
        language,
      });
    } catch {
      setSpec(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const copySpec = () => {
    navigator.clipboard.writeText(spec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (field, setter) => (e) => {
    setter(e.target.value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  return (
    <div className="spec-page">
      <div className="spec-header">
        <h1 className="spec-title">{t('spec.title')}</h1>
      </div>

      <p className="spec-description">{t('spec.description')}</p>

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className={`label${errors.technologies ? ' label--error' : ''}`}>
              {t('form.technologies')}
              {errors.technologies && <span className="error-dot" />}
            </label>
            <input
              type="text"
              value={technologies}
              onChange={handleChange('technologies', setTechnologies)}
              placeholder={t('form.technologiesPlaceholder')}
              className={errors.technologies ? 'input--error' : ''}
            />
          </div>

          <div className="field">
            <label className={`label${errors.goal ? ' label--error' : ''}`}>
              {t('form.goal')}
              {errors.goal && <span className="error-dot" />}
            </label>
            <input
              type="text"
              value={goal}
              onChange={handleChange('goal', setGoal)}
              placeholder={t('form.goalPlaceholder')}
              className={errors.goal ? 'input--error' : ''}
            />
          </div>

          <div className="field">
            <label className={`label${errors.level ? ' label--error' : ''}`}>
              {t('form.level')}
              {errors.level && <span className="error-dot" />}
            </label>
            <select
              value={level}
              onChange={handleChange('level', setLevel)}
              className={errors.level ? 'input--error' : ''}
            >
              <option value="">{t('form.levelSelect')}</option>
              <option value="1">{t('form.junior')}</option>
              <option value="2">{t('form.mid')}</option>
              <option value="3">{t('form.senior')}</option>
            </select>
          </div>

          {user ? (
            <button type="submit" className="btn-generate" disabled={loading}>
              {loading ? (
                <><span className="spinner" />{t('loading')}</>
              ) : (
                t('form.generate')
              )}
            </button>
          ) : (
            <p className="spec-auth-notice">
              {t('spec.loginRequired')}{' '}
              <Link to="/login" state={{ from: location }}>{t('spec.loginLink')}</Link>
            </p>
          )}
        </form>
      </div>

      {spec && (
        <div className="result-card">
          <div className="result-header">
            <span className="result-title">{t('result.title')}</span>
            <button className="btn-copy" onClick={copySpec}>
              {copied ? t('result.copied') : t('result.copy')}
            </button>
          </div>
          <pre className="result-content">{spec}</pre>
        </div>
      )}

      <footer className="spec-footer">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}
