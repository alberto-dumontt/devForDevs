import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

const FILTER_KEYS = ['all', 'frontend', 'backend', 'devops', 'ai', 'career', 'free', 'paid'];
const TAG_KEYS = FILTER_KEYS.filter(k => k !== 'all');
const PAGE_SIZE = 10;

const initials = (str) =>
  str ? str.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const EMPTY_FORM = { name: '', platform: '', description: '', url: '', tags: [] };

async function fetchPage({ tag, sort, showMine, userId, pg }) {
  let q = supabase
    .from('courses')
    .select(`
      id, name, description, platform, url, tags, created_at, author_id,
      author:profiles(name, job_title),
      course_likes(count),
      course_comments(count)
    `);

  if (showMine && userId) q = q.eq('author_id', userId);
  if (tag !== 'all') q = q.contains('tags', [tag]);

  const ascending = sort === 'oldest';
  q = q.order('created_at', { ascending }).range(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE - 1);

  const { data } = await q;

  let likedSet = new Set();
  if (userId && data?.length) {
    const { data: likes } = await supabase
      .from('course_likes')
      .select('course_id')
      .eq('user_id', userId);
    likedSet = new Set(likes?.map(l => l.course_id));
  }

  return {
    items: (data ?? []).map(c => ({
      ...c,
      like_count: Number(c.course_likes?.[0]?.count ?? 0),
      comment_count: Number(c.course_comments?.[0]?.count ?? 0),
      liked: likedSet.has(c.id),
    })),
    hasMore: (data ?? []).length === PAGE_SIZE,
  };
}

export default function Courses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [activeTag, setActiveTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showMine, setShowMine] = useState(false);

  const [openComments, setOpenComments] = useState(new Set());
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsLoading, setCommentsLoading] = useState(new Set());

  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [updating, setUpdating] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);

  const requireAuth = () => {
    if (!user) { navigate('/login', { state: { from: location } }); return false; }
    return true;
  };

  // ── Initial fetch / filter change ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { items, hasMore: more } = await fetchPage({ tag: activeTag, sort: sortBy, showMine, userId: user?.id, pg: 0 });
      if (cancelled) return;
      setCourses(items);
      setPage(0);
      setHasMore(more);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user, activeTag, sortBy, showMine]);

  // ── Load more ─────────────────────────────────────────────
  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { items, hasMore: more } = await fetchPage({ tag: activeTag, sort: sortBy, showMine, userId: user?.id, pg: nextPage });
    setCourses(prev => [...prev, ...items]);
    setPage(nextPage);
    setHasMore(more);
    setLoadingMore(false);
  };

  // ── Like ──────────────────────────────────────────────────
  const handleLike = async (id) => {
    if (!requireAuth()) return;
    const course = courses.find(c => c.id === id);
    const nowLiked = !course.liked;
    setCourses(prev => prev.map(c =>
      c.id === id ? { ...c, liked: nowLiked, like_count: c.like_count + (nowLiked ? 1 : -1) } : c
    ));
    if (nowLiked) {
      await supabase.from('course_likes').insert({ course_id: id, user_id: user.id });
    } else {
      await supabase.from('course_likes').delete().eq('course_id', id).eq('user_id', user.id);
    }
  };

  // ── Comments ──────────────────────────────────────────────
  const handleToggleComments = async (id) => {
    const isOpen = openComments.has(id);
    setOpenComments(prev => {
      const next = new Set(prev);
      isOpen ? next.delete(id) : next.add(id);
      return next;
    });
    if (isOpen || comments[id]) return;

    setCommentsLoading(prev => new Set(prev).add(id));
    const { data } = await supabase
      .from('course_comments')
      .select(`
        id, content, created_at, author_id,
        author:profiles(name, job_title),
        course_comment_likes(count)
      `)
      .eq('course_id', id)
      .order('created_at');

    let likedSet = new Set();
    if (user && data?.length) {
      const { data: clikes } = await supabase
        .from('course_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', data.map(c => c.id));
      likedSet = new Set(clikes?.map(l => l.comment_id));
    }

    setComments(prev => ({
      ...prev,
      [id]: (data ?? []).map(c => ({
        ...c,
        like_count: Number(c.course_comment_likes?.[0]?.count ?? 0),
        liked: likedSet.has(c.id),
      })),
    }));
    setCommentsLoading(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleCommentLike = async (courseId, commentId) => {
    if (!requireAuth()) return;
    const comment = comments[courseId]?.find(c => c.id === commentId);
    const nowLiked = !comment.liked;
    setComments(prev => ({
      ...prev,
      [courseId]: prev[courseId].map(c =>
        c.id === commentId ? { ...c, liked: nowLiked, like_count: c.like_count + (nowLiked ? 1 : -1) } : c
      ),
    }));
    if (nowLiked) {
      await supabase.from('course_comment_likes').insert({ comment_id: commentId, user_id: user.id });
    } else {
      await supabase.from('course_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
    }
  };

  const handleAddComment = async (courseId) => {
    if (!requireAuth()) return;
    const text = (commentInputs[courseId] || '').trim();
    if (!text) return;

    const { data } = await supabase
      .from('course_comments')
      .insert({ course_id: courseId, author_id: user.id, content: text })
      .select('id, content, created_at, author_id, author:profiles(name, job_title)')
      .single();

    if (!data) return;
    setComments(prev => ({
      ...prev,
      [courseId]: [...(prev[courseId] ?? []), { ...data, like_count: 0, liked: false }],
    }));
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, comment_count: c.comment_count + 1 } : c));
    setCommentInputs(prev => ({ ...prev, [courseId]: '' }));
  };

  // ── Submit new ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    setSubmitting(true);

    const { data } = await supabase
      .from('courses')
      .insert({ name: form.name.trim(), description: form.description.trim(), platform: form.platform.trim() || null, url: form.url.trim() || null, tags: form.tags, author_id: user.id })
      .select('id, name, description, platform, url, tags, created_at, author_id, author:profiles(name, job_title)')
      .single();

    setSubmitting(false);
    if (!data) return;

    setCourses(prev => [{ ...data, like_count: 0, comment_count: 0, liked: false }, ...prev]);
    setForm(EMPTY_FORM);
    setComposerOpen(false);
  };

  // ── Edit ──────────────────────────────────────────────────
  const startEdit = (course) => {
    setEditingId(course.id);
    setEditForm({ name: course.name, platform: course.platform ?? '', description: course.description, url: course.url ?? '', tags: course.tags });
  };
  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_FORM); };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    setUpdating(true);
    const patch = { name: editForm.name.trim(), description: editForm.description.trim(), platform: editForm.platform.trim() || null, url: editForm.url.trim() || null, tags: editForm.tags };
    const { error } = await supabase.from('courses').update(patch).eq('id', id);
    setUpdating(false);
    if (error) { console.error('Course update error:', error?.code, error?.message); return; }
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    cancelEdit();
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = (id) => setPendingDelete(id);
  const confirmDelete = async () => {
    await supabase.from('courses').delete().eq('id', pendingDelete);
    setCourses(prev => prev.filter(c => c.id !== pendingDelete));
    setPendingDelete(null);
  };

  const toggleFormTag = (tag) =>
    setForm(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }));

  const toggleEditTag = (tag) =>
    setEditForm(prev => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag] }));

  const displayed = sortBy === 'liked' ? [...courses].sort((a, b) => b.like_count - a.like_count) : courses;
  const userInitials = initials(user?.user_metadata?.name ?? user?.email ?? '');

  return (
    <div className="rec-page">
      {pendingDelete && (
        <ConfirmModal
          message={t('common.confirmDelete')}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="rec-header">
        <h1 className="rec-title">{t('courses.title')}</h1>
        <p className="rec-subtitle">{t('courses.subtitle')}</p>
      </div>

      {/* ── Filters + Sort ── */}
      <div className="rec-controls">
        <div className="rec-filters">
          {user && (
            <>
              <button
                className={`rec-filter-btn${showMine ? ' active' : ''}`}
                onClick={() => setShowMine(p => !p)}
              >
                {t('common.myPosts')}
              </button>
              <span className="rec-filter-sep" />
            </>
          )}
          {FILTER_KEYS.map(key => (
            <button
              key={key}
              className={`rec-filter-btn${activeTag === key ? ' active' : ''}`}
              onClick={() => setActiveTag(key)}
            >
              {t(`courses.tags.${key}`)}
            </button>
          ))}
        </div>
        <select className="rec-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="recent">{t('common.sortRecent')}</option>
          <option value="oldest">{t('common.sortOldest')}</option>
          <option value="liked">{t('common.sortLiked')}</option>
        </select>
      </div>

      {/* ── Composer ── */}
      {user && (
        <div className="composer-card">
          {!composerOpen ? (
            <button className="rec-composer-trigger" onClick={() => setComposerOpen(true)}>
              + {t('courses.suggest')}
            </button>
          ) : (
            <form className="rec-composer-form" onSubmit={handleSubmit}>
              <div className="rec-composer-row">
                <div className="login-field" style={{ flex: 2 }}>
                  <label className="login-label">{t('courses.form.name')} *</label>
                  <input type="text" className="login-input" placeholder={t('courses.form.namePlaceholder')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="login-field" style={{ flex: 1 }}>
                  <label className="login-label">{t('courses.form.platform')}</label>
                  <input type="text" className="login-input" placeholder={t('courses.form.platformPlaceholder')} value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} />
                </div>
                <div className="login-field" style={{ flex: 1 }}>
                  <label className="login-label">{t('courses.form.url')}</label>
                  <input type="url" className="login-input" placeholder="https://..." value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
                </div>
              </div>
              <div className="login-field">
                <label className="login-label">{t('courses.form.description')} *</label>
                <textarea className="login-input register-textarea" placeholder={t('courses.form.descriptionPlaceholder')} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value.slice(0, 600) }))} rows={3} maxLength={600} required />
                <p className={`rec-char-count${form.description.length >= 540 ? ' rec-char-count--warn' : ''}`}>{form.description.length}/600</p>
              </div>
              <div>
                <span className="login-label">{t('courses.form.tags')}</span>
                <div className="composer-tags" style={{ marginTop: '0.5rem' }}>
                  {TAG_KEYS.map(tag => (
                    <button key={tag} type="button" className={`composer-tag-btn${form.tags.includes(tag) ? ' selected' : ''}`} onClick={() => toggleFormTag(tag)}>
                      {t(`courses.tags.${tag}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="profile-form-actions">
                <button type="button" className="profile-cancel-btn" onClick={() => { setComposerOpen(false); setForm(EMPTY_FORM); }}>{t('profile.cancel')}</button>
                <button type="submit" className="profile-save-btn" disabled={submitting || !form.name.trim() || !form.description.trim()}>
                  {submitting ? t('courses.form.submitting') : t('courses.form.submit')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── States ── */}
      {loading && <p className="rec-state-text">{t('courses.loading')}</p>}
      {!loading && displayed.length === 0 && <p className="rec-state-text">{t('courses.empty')}</p>}

      {/* ── Grid ── */}
      <div className="rec-grid">
        {displayed.map(course => (
          <div key={course.id} className="rec-card">
            {editingId === course.id ? (
              <form className="rec-composer-form" onSubmit={e => handleUpdate(e, course.id)}>
                <div className="rec-composer-row">
                  <div className="login-field" style={{ flex: 2 }}>
                    <label className="login-label">{t('courses.form.name')} *</label>
                    <input type="text" className="rec-edit-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="login-field" style={{ flex: 1 }}>
                    <label className="login-label">{t('courses.form.platform')}</label>
                    <input type="text" className="rec-edit-input" placeholder={t('courses.form.platformPlaceholder')} value={editForm.platform} onChange={e => setEditForm(p => ({ ...p, platform: e.target.value }))} />
                  </div>
                  <div className="login-field" style={{ flex: 1 }}>
                    <label className="login-label">{t('courses.form.url')}</label>
                    <input type="url" className="rec-edit-input" placeholder="https://..." value={editForm.url} onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))} />
                  </div>
                </div>
                <div className="login-field">
                  <label className="login-label">{t('courses.form.description')} *</label>
                  <textarea className="rec-edit-input rec-edit-textarea" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value.slice(0, 600) }))} rows={4} maxLength={600} required />
                  <p className={`rec-char-count${editForm.description.length >= 540 ? ' rec-char-count--warn' : ''}`}>{editForm.description.length}/600</p>
                </div>
                <div>
                  <span className="login-label">{t('courses.form.tags')}</span>
                  <div className="composer-tags" style={{ marginTop: '0.5rem' }}>
                    {TAG_KEYS.map(tag => (
                      <button key={tag} type="button" className={`composer-tag-btn${editForm.tags.includes(tag) ? ' selected' : ''}`} onClick={() => toggleEditTag(tag)}>
                        {t(`courses.tags.${tag}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="profile-form-actions">
                  <button type="button" className="profile-cancel-btn" onClick={cancelEdit}>{t('profile.cancel')}</button>
                  <button type="submit" className="profile-save-btn" disabled={updating || !editForm.name.trim() || !editForm.description.trim()}>
                    {updating ? t('profile.saving') : t('profile.save')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="rec-card-top">
                  <h3 className="rec-tool-name">
                    {course.url ? <a href={course.url} target="_blank" rel="noreferrer" className="rec-tool-link">{course.name} ↗</a> : course.name}
                  </h3>
                  <button className={`rec-like-btn${course.liked ? ' liked' : ''}`} onClick={() => handleLike(course.id)}>
                    <HeartIcon filled={course.liked} />
                    <span>{course.like_count}</span>
                  </button>
                </div>

                {course.platform && <span className="rec-course-platform">{course.platform}</span>}

                <p className="rec-tool-desc">{course.description}</p>

                {course.tags.length > 0 && (
                  <div className="rec-tool-tags">
                    {course.tags.map(tag => <span key={tag} className="rec-tool-tag">{t(`courses.tags.${tag}`)}</span>)}
                  </div>
                )}

                <div className="rec-card-footer">
                  <div className="rec-author-avatar">{initials(course.author?.name ?? '')}</div>
                  <div className="rec-author-info">
                    <Link to={`/u/${course.author_id}`} className="rec-author-name rec-author-link">{course.author?.name ?? '—'}</Link>
                    {course.author?.job_title && <span className="rec-author-role">{course.author.job_title}</span>}
                  </div>
                  <button className={`post-action-btn rec-comment-toggle${openComments.has(course.id) ? ' active' : ''}`} onClick={() => handleToggleComments(course.id)}>
                    <CommentIcon />
                    <span>{course.comment_count}</span>
                  </button>
                </div>

                {user?.id === course.author_id && (
                  <div className="rec-author-actions">
                    <button className="rec-author-action-btn" onClick={() => startEdit(course)}>{t('common.edit')}</button>
                    <span className="rec-author-action-sep">·</span>
                    <button className="rec-author-action-btn rec-author-action-delete" onClick={() => handleDelete(course.id)}>{t('common.delete')}</button>
                  </div>
                )}
              </>
            )}

            {editingId !== course.id && openComments.has(course.id) && (
              <div className="comments-section">
                {commentsLoading.has(course.id) ? <p className="comments-empty">...</p> : (
                  <>
                    {(comments[course.id] ?? []).length === 0 && <p className="comments-empty">{t('community.noComments')}</p>}
                    {(comments[course.id] ?? []).map(comment => (
                      <div key={comment.id} className="comment">
                        <div className="comment-avatar">{initials(comment.author?.name ?? '?')}</div>
                        <div className="comment-body">
                          <div className="comment-meta">
                            <Link to={`/u/${comment.author_id}`} className="comment-author-name comment-author-link">{comment.author?.name}</Link>
                            {comment.author?.job_title && <span className="comment-author-role">{comment.author.job_title}</span>}
                          </div>
                          <p className="comment-content">{comment.content}</p>
                          <button className={`comment-like-btn${comment.liked ? ' liked' : ''}`} onClick={() => handleCommentLike(course.id, comment.id)}>
                            <HeartIcon filled={comment.liked} />
                            <span>{comment.like_count}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div className="comment-input-row">
                  <div className="comment-avatar">{userInitials}</div>
                  <input type="text" className="comment-input" placeholder={user ? t('community.addComment') : t('courses.loginToComment')} value={commentInputs[course.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [course.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleAddComment(course.id); }} disabled={!user} maxLength={500} />
                  <button className="btn-comment-send" onClick={() => handleAddComment(course.id)} disabled={!user || !(commentInputs[course.id] || '').trim()}>→</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? '...' : t('community.loadMore')}
        </button>
      )}
    </div>
  );
}
