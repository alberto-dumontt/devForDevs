import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 10;
const DESC_LIMIT = 220;

function BotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function formatRelativeDate(dateStr, t) {
  if (!dateStr) return null;
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays <= 0) return t('jobs.publishedToday');
  if (diffDays === 1) return t('jobs.publishedYesterday');
  return t('jobs.publishedDaysAgo', { count: diffDays });
}

function translateField(value, ns, t) {
  if (!value || value === 'NOT_DEFINED') return t('jobs.notInformed');
  const key = `jobs.${ns}.${value}`;
  const result = t(key, { defaultValue: value });
  return result;
}

async function fetchPage({ search, sort, pg }) {
  let q = supabase
    .from('jobs')
    .select('id, title, company, location, workplace_type, employment_type, seniority_level, published_at, url, description');

  if (search.trim()) q = q.ilike('title', `%${search.trim()}%`);

  q = q
    .order('published_at', { ascending: sort === 'oldest', nullsFirst: false })
    .range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1);

  const { data } = await q;
  return { items: data ?? [], hasMore: (data ?? []).length === PAGE_SIZE };
}

export default function Jobs() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [expanded, setExpanded] = useState(new Set());
  const debounceRef = useRef(null);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { items, hasMore: more } = await fetchPage({ search, sort, pg: 0 });
      setJobs(items);
      setPage(0);
      setHasMore(more);
      setLoading(false);
    }, search ? 300 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [search, sort]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    const { items, hasMore: more } = await fetchPage({ search, sort, pg: next });
    setJobs(prev => [...prev, ...items]);
    setPage(next);
    setHasMore(more);
    setLoadingMore(false);
  };

  return (
    <div className="rec-page">
      <div className="rec-header">
        <div className="jobs-title-row">
          <h1 className="rec-title">{t('jobs.title')}</h1>
          <span className="beta-badge">{t('jobs.betaBadge')}</span>
        </div>
        <p className="rec-subtitle">{t('jobs.subtitle')}</p>
      </div>

      <div className="devradar-info">
        <div className="devradar-info-icon"><BotIcon /></div>
        <div>
          <span className="devradar-info-label">{t('jobs.botLabel')}</span>
          <p className="devradar-info-desc">{t('jobs.botDesc')}</p>
        </div>
      </div>

      <div className="jobs-search-row">
        <input
          type="search"
          className="jobs-search-input"
          placeholder={t('jobs.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="rec-sort-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="newest">{t('common.sortRecent')}</option>
          <option value="oldest">{t('common.sortOldest')}</option>
        </select>
      </div>

      {loading ? (
        <p className="jobs-status-msg">{t('jobs.loading')}</p>
      ) : jobs.length === 0 ? (
        <p className="jobs-status-msg">{t('jobs.empty')}</p>
      ) : (
        <>
          <div className="jobs-list">
            {jobs.map(job => {
              const relDate = formatRelativeDate(job.published_at, t);
              const wpType = translateField(job.workplace_type, 'workplaceType', t);
              const empType = translateField(job.employment_type, 'employmentType', t);
              const senLevel = translateField(job.seniority_level, 'seniorityLevel', t);
              return (
                <div key={job.id} className="job-card">
                  <div className="job-card-top">
                    <div className="job-title-block">
                      <h3 className="job-title">
                        {job.url
                          ? <a href={job.url} target="_blank" rel="noreferrer" className="rec-tool-link">{job.title} ↗</a>
                          : job.title
                        }
                      </h3>
                      <span className="job-advertiser">{job.company}</span>
                    </div>
                    {relDate && <span className="job-date">{relDate}</span>}
                  </div>

                  {(!job.description || job.description === 'NOT_DEFINED') ? (
                    <p className="job-description job-description--empty">{t('jobs.noDescription')}</p>
                  ) : (() => {
                    const isLong = job.description.length > DESC_LIMIT;
                    const isExpanded = expanded.has(job.id);
                    const text = isLong && !isExpanded
                      ? job.description.slice(0, DESC_LIMIT).trimEnd() + '…'
                      : job.description;
                    return (
                      <div>
                        <p className="job-description">{text}</p>
                        {isLong && (
                          <button className="job-expand-btn" onClick={() => toggleExpand(job.id)}>
                            {isExpanded ? t('jobs.showLess') : t('jobs.showMore')}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <div className="job-card-bottom">
                    <div className="rec-tool-tags">
                      {job.location && <span className="rec-tool-tag">{job.location}</span>}
                      <span className="rec-tool-tag">{wpType}</span>
                      <span className="rec-tool-tag">{empType}</span>
                      <span className="rec-tool-tag">{senLevel}</span>
                    </div>
                    <div className="job-bot-badge">
                      <BotIcon />
                      <span>DevRadar</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="jobs-load-more">
              <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? '...' : t('community.loadMore')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
