import { useState, useEffect } from 'react';
import { usePageReady } from '../hooks/usePageReady';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ConfirmModal from '../components/ConfirmModal';

const POST_TAG_KEYS = ['techQuestion', 'career', 'market', 'sharing', 'networking', 'linkedin', 'discussion'];
const MAX_CONTENT = 1000;
const PAGE_SIZE = 10;

const initials = (str) =>
  str ? str.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';

function relativeTime(dateStr, t) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('community.justNow');
  if (mins < 60) return t('community.timeMin', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('community.timeHour', { n: hours });
  const days = Math.floor(hours / 24);
  return t('community.timeDay', { n: days });
}

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

function buildQuery(tag, sort, from, to, mineId = null) {
  let q = supabase
    .from('posts')
    .select(`
      id, content, tags, created_at, author_id,
      author:profiles(name, job_title),
      post_likes(count),
      post_comments(count)
    `);

  if (mineId) q = q.eq('author_id', mineId);
  if (tag !== 'all') q = q.contains('tags', [tag]);

  const ascending = sort === 'oldest';
  return q.order('created_at', { ascending }).range(from, to);
}

async function mapWithLikes(data, userId) {
  let likedSet = new Set();
  if (userId && data?.length) {
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId);
    likedSet = new Set(likes?.map(l => l.post_id));
  }
  return (data ?? []).map(p => ({
    ...p,
    like_count: Number(p.post_likes?.[0]?.count ?? 0),
    comment_count: Number(p.post_comments?.[0]?.count ?? 0),
    liked: likedSet.has(p.id),
  }));
}

export default function Community() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  usePageReady(loading);
  const [hasMore, setHasMore] = useState(false);

  const [activeTag, setActiveTag] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showMine, setShowMine] = useState(false);

  const [composerText, setComposerText] = useState('');
  const [composerTags, setComposerTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [openComments, setOpenComments] = useState(new Set());
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentsLoading, setCommentsLoading] = useState(new Set());

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [updating, setUpdating] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null);

  const requireAuth = () => {
    if (!user) { navigate('/login', { state: { from: location } }); return false; }
    return true;
  };

  // ── Initial fetch / filter+sort change ────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const mineId = showMine && user ? user.id : null;
      const { data } = await buildQuery(activeTag, sortBy, 0, PAGE_SIZE - 1, mineId);
      if (cancelled) return;
      const mapped = await mapWithLikes(data, user?.id);
      setPosts(mapped);
      setPage(0);
      setHasMore((data ?? []).length === PAGE_SIZE);
      setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [user, activeTag, sortBy, showMine]);

  // ── Load more ─────────────────────────────────────────────
  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const mineId = showMine && user ? user.id : null;
    const { data } = await buildQuery(activeTag, sortBy, nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1, mineId);
    const mapped = await mapWithLikes(data, user?.id);
    setPosts(prev => [...prev, ...mapped]);
    setPage(nextPage);
    setHasMore((data ?? []).length === PAGE_SIZE);
    setLoadingMore(false);
  };

  // ── Like ──────────────────────────────────────────────────
  const handleLike = async (id) => {
    if (!requireAuth()) return;
    const post = posts.find(p => p.id === id);
    const nowLiked = !post.liked;
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked: nowLiked, like_count: p.like_count + (nowLiked ? 1 : -1) } : p
    ));
    if (nowLiked) {
      await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
    } else {
      await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', user.id);
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
      .from('post_comments')
      .select(`
        id, content, created_at, author_id,
        author:profiles(name, job_title),
        post_comment_likes(count)
      `)
      .eq('post_id', id)
      .order('created_at');

    let likedSet = new Set();
    if (user && data?.length) {
      const { data: clikes } = await supabase
        .from('post_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', data.map(c => c.id));
      likedSet = new Set(clikes?.map(l => l.comment_id));
    }

    setComments(prev => ({
      ...prev,
      [id]: (data ?? []).map(c => ({
        ...c,
        like_count: Number(c.post_comment_likes?.[0]?.count ?? 0),
        liked: likedSet.has(c.id),
      })),
    }));
    setCommentsLoading(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleCommentLike = async (postId, commentId) => {
    if (!requireAuth()) return;
    const comment = comments[postId]?.find(c => c.id === commentId);
    const nowLiked = !comment.liked;
    setComments(prev => ({
      ...prev,
      [postId]: prev[postId].map(c =>
        c.id === commentId ? { ...c, liked: nowLiked, like_count: c.like_count + (nowLiked ? 1 : -1) } : c
      ),
    }));
    if (nowLiked) {
      await supabase.from('post_comment_likes').insert({ comment_id: commentId, user_id: user.id });
    } else {
      await supabase.from('post_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
    }
  };

  const handleAddComment = async (postId) => {
    if (!requireAuth()) return;
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    const { data } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, author_id: user.id, content: text })
      .select('id, content, created_at, author_id, author:profiles(name, job_title)')
      .single();

    if (!data) return;
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] ?? []), { ...data, like_count: 0, liked: false }],
    }));
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // ── Publish ──────────────────────────────────────────────
  const publishPost = async () => {
    if (!requireAuth()) return;
    if (!composerText.trim()) return;
    setSubmitting(true);

    const { data } = await supabase
      .from('posts')
      .insert({ content: composerText.trim(), tags: composerTags, author_id: user.id })
      .select('id, content, tags, created_at, author_id, author:profiles(name, job_title)')
      .single();

    setSubmitting(false);
    if (!data) return;

    setPosts(prev => [{ ...data, like_count: 0, comment_count: 0, liked: false }, ...prev]);
    setComposerText('');
    setComposerTags([]);
  };

  // ── Edit ──────────────────────────────────────────────────
  const startEdit = (post) => { setEditingId(post.id); setEditText(post.content); setEditTags(post.tags); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); setEditTags([]); };

  const handleUpdate = async (id) => {
    if (!editText.trim()) return;
    setUpdating(true);
    const { error } = await supabase.from('posts').update({ content: editText.trim(), tags: editTags }).eq('id', id);
    setUpdating(false);
    if (error) { console.error('Post update error:', error?.code, error?.message); return; }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, content: editText.trim(), tags: editTags } : p));
    cancelEdit();
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = (id) => setPendingDelete(id);
  const confirmDelete = async () => {
    await supabase.from('posts').delete().eq('id', pendingDelete);
    setPosts(prev => prev.filter(p => p.id !== pendingDelete));
    setPendingDelete(null);
  };

  const toggleComposerTag = (tag) =>
    setComposerTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleEditTag = (tag) =>
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const displayed = sortBy === 'liked'
    ? [...posts].sort((a, b) => b.like_count - a.like_count)
    : posts;

  const userInitials = initials(user?.user_metadata?.name ?? user?.email ?? '');

  return (
    <div className="community-page">
      {pendingDelete && (
        <ConfirmModal
          message={t('common.confirmDelete')}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="community-header">
        <h1 className="community-title">{t('community.title')}</h1>
        <p className="community-subtitle">{t('community.subtitle')}</p>
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
          <button
            className={`rec-filter-btn${activeTag === 'all' ? ' active' : ''}`}
            onClick={() => setActiveTag('all')}
          >
            {t('recommendations.tags.all')}
          </button>
          {POST_TAG_KEYS.map(key => (
            <button
              key={key}
              className={`rec-filter-btn${activeTag === key ? ' active' : ''}`}
              onClick={() => setActiveTag(key)}
            >
              {t(`community.tags.${key}`)}
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
      <div className="composer-card">
        <div className="composer-top">
          <div className="post-avatar composer-avatar">{userInitials}</div>
          <div style={{ flex: 1 }}>
            <textarea
              className="composer-textarea"
              placeholder={user ? t('community.composerPlaceholder') : t('community.loginToPost')}
              value={composerText}
              onChange={e => setComposerText(e.target.value.slice(0, MAX_CONTENT))}
              rows={3}
              maxLength={MAX_CONTENT}
              disabled={!user}
              onFocus={() => { if (!user) requireAuth(); }}
            />
            {composerText.length > 0 && (
              <p className={`rec-char-count${composerText.length >= MAX_CONTENT * 0.9 ? ' rec-char-count--warn' : ''}`}>
                {composerText.length}/{MAX_CONTENT}
              </p>
            )}
          </div>
        </div>
        <div className="composer-bottom">
          <div className="composer-tags-row">
            <span className="composer-tags-label">{t('community.tagsLabel')}</span>
            <div className="composer-tags">
              {POST_TAG_KEYS.map(key => (
                <button
                  key={key}
                  className={`composer-tag-btn${composerTags.includes(key) ? ' selected' : ''}`}
                  onClick={() => { if (!requireAuth()) return; toggleComposerTag(key); }}
                  disabled={!user}
                >
                  {t(`community.tags.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn-publish"
            onClick={publishPost}
            disabled={!composerText.trim() || submitting}
          >
            {submitting ? '...' : t('community.publish')}
          </button>
        </div>
      </div>

      {/* ── States ── */}
      {loading && <p className="rec-state-text">{t('community.loading')}</p>}
      {!loading && displayed.length === 0 && (
        <p className="rec-state-text">{t('community.empty')}</p>
      )}

      {/* ── Feed ── */}
      <div className="feed">
        {displayed.map(post => (
          <article key={post.id} className="post-card">

            {editingId === post.id ? (
              <div className="post-edit-form">
                <textarea
                  className="composer-textarea post-edit-textarea"
                  value={editText}
                  onChange={e => setEditText(e.target.value.slice(0, MAX_CONTENT))}
                  rows={4}
                  maxLength={MAX_CONTENT}
                  autoFocus
                />
                <p className={`rec-char-count${editText.length >= MAX_CONTENT * 0.9 ? ' rec-char-count--warn' : ''}`}>
                  {editText.length}/{MAX_CONTENT}
                </p>
                <div className="composer-tags" style={{ marginTop: '0.75rem' }}>
                  {POST_TAG_KEYS.map(key => (
                    <button
                      key={key}
                      type="button"
                      className={`composer-tag-btn${editTags.includes(key) ? ' selected' : ''}`}
                      onClick={() => toggleEditTag(key)}
                    >
                      {t(`community.tags.${key}`)}
                    </button>
                  ))}
                </div>
                <div className="profile-form-actions" style={{ marginTop: '0.75rem' }}>
                  <button className="profile-cancel-btn" onClick={cancelEdit}>{t('profile.cancel')}</button>
                  <button
                    className="profile-save-btn"
                    onClick={() => handleUpdate(post.id)}
                    disabled={updating || !editText.trim()}
                  >
                    {updating ? t('profile.saving') : t('profile.save')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="post-header">
                  <div className="post-avatar">{initials(post.author?.name ?? '')}</div>
                  <div className="post-author-info">
                    <Link to={`/u/${post.author_id}`} className="post-author-name rec-author-link">
                      {post.author?.name ?? '—'}
                    </Link>
                    {post.author?.job_title && (
                      <span className="post-author-role">{post.author.job_title}</span>
                    )}
                  </div>
                  <span className="post-timestamp">{relativeTime(post.created_at, t)}</span>
                </div>

                <p className="post-content">{post.content}</p>

                {post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map(key => (
                      <span key={key} className="post-tag">{t(`community.tags.${key}`)}</span>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <button
                    className={`post-action-btn${post.liked ? ' liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <HeartIcon filled={post.liked} />
                    <span>{post.like_count}</span>
                  </button>
                  <button
                    className={`post-action-btn${openComments.has(post.id) ? ' active' : ''}`}
                    onClick={() => handleToggleComments(post.id)}
                  >
                    <CommentIcon />
                    <span>{post.comment_count}</span>
                  </button>
                </div>

                {user?.id === post.author_id && (
                  <div className="rec-author-actions">
                    <button className="rec-author-action-btn" onClick={() => startEdit(post)}>
                      {t('common.edit')}
                    </button>
                    <span className="rec-author-action-sep">·</span>
                    <button className="rec-author-action-btn rec-author-action-delete" onClick={() => handleDelete(post.id)}>
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </>
            )}

            {editingId !== post.id && openComments.has(post.id) && (
              <div className="comments-section">
                {commentsLoading.has(post.id) ? (
                  <p className="comments-empty">...</p>
                ) : (
                  <>
                    {(comments[post.id] ?? []).length === 0 && (
                      <p className="comments-empty">{t('community.noComments')}</p>
                    )}
                    {(comments[post.id] ?? []).map(comment => (
                      <div key={comment.id} className="comment">
                        <div className="comment-avatar">{initials(comment.author?.name ?? '?')}</div>
                        <div className="comment-body">
                          <div className="comment-meta">
                            <Link to={`/u/${comment.author_id}`} className="comment-author-name comment-author-link">
                              {comment.author?.name}
                            </Link>
                            {comment.author?.job_title && (
                              <span className="comment-author-role">{comment.author.job_title}</span>
                            )}
                          </div>
                          <p className="comment-content">{comment.content}</p>
                          <button
                            className={`comment-like-btn${comment.liked ? ' liked' : ''}`}
                            onClick={() => handleCommentLike(post.id, comment.id)}
                          >
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
                  <input
                    type="text"
                    className="comment-input"
                    placeholder={user ? t('community.addComment') : t('community.loginToComment')}
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id); }}
                    disabled={!user}
                    maxLength={500}
                  />
                  <button
                    className="btn-comment-send"
                    onClick={() => handleAddComment(post.id)}
                    disabled={!user || !(commentInputs[post.id] || '').trim()}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* ── Load more ── */}
      {hasMore && (
        <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? '...' : t('community.loadMore')}
        </button>
      )}
    </div>
  );
}
