import { useRef, useState, useCallback } from 'react'
import { Select, EmptyState } from '@/components/ui'
import MainLayout from '@/components/layout/MainLayout'
import { useUserStore } from '@/stores/user.store'
import { useContent } from '@/hooks/useSiteContent'
import {
  useCommunityPosts,
  useCommunityReplies,
  useCommunityConfig,
  useCreatePost,
  useCreateReply,
  useLikePost,
  useLikeReply,
  type CommunityPostSummary,
  type CommunityReply,
  type PostType,
  type PostFilters,
} from '@/hooks/useCommunity'
import {
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Hash,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIVILEGED_ROLES = new Set(['admin', 'super_admin', 'community_lead', 'knowledge_contributor'])

const TYPE_FILTERS = [
  { id: 'all', label: 'All Posts', icon: MessageSquare },
  { id: 'discussion', label: 'Discussions', icon: TrendingUp },
  { id: 'question', label: 'Questions', icon: HelpCircle },
  { id: 'insight', label: 'Insights', icon: Lightbulb },
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return iso
  }
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// ─── ReplySection ─────────────────────────────────────────────────────────────

interface ReplySectionProps {
  post: CommunityPostSummary
  onClose: () => void
}

function ReplySection({ post, onClose }: ReplySectionProps) {
  const { isAuthenticated } = useUserStore()
  const [draft, setDraft] = useState('')
  const { data: replies, isLoading } = useCommunityReplies(post.id, true)
  const createReply = useCreateReply(post.id)
  const likeReply = useLikeReply(post.id)

  const isQuestion = post.postType === 'question'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    createReply.mutate({ body: draft.trim() }, { onSuccess: () => setDraft('') })
  }

  return (
    <div className="mt-4 border-t border-theme pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-theme-secondary uppercase tracking-wider">
          {isQuestion ? 'Answers' : 'Replies'} ({post.replyCount})
        </h4>
        <button onClick={onClose} className="text-theme-tertiary hover:text-theme-secondary">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-theme-tertiary" />
        </div>
      )}

      {replies && replies.length === 0 && (
        <p className="text-sm text-theme-tertiary italic py-2">
          {isQuestion ? 'No approved answers yet.' : 'No replies yet. Be the first!'}
        </p>
      )}

      {replies && replies.length > 0 && (
        <div className="space-y-3 mb-4">
          {replies.map((r: CommunityReply) => (
            <div
              key={r.id}
              className={cn(
                'flex gap-3 text-sm p-3 rounded-lg',
                isQuestion ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100' : 'bg-theme-surface'
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                {r.author?.fullName?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-theme-primary text-xs">{r.author?.fullName ?? 'Anonymous'}</span>
                  <span className="text-[10px] text-theme-tertiary">{relativeTime(r.createdAt)}</span>
                  {isQuestion && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      ✓ Answer
                    </span>
                  )}
                </div>
                <p className="mt-1 text-theme-secondary leading-relaxed">{r.body}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isAuthenticated) return
                    likeReply.mutate({ replyId: r.id, currentlyLiked: r.userHasLiked })
                  }}
                  disabled={!isAuthenticated}
                  className={cn(
                    'flex items-center gap-1 mt-1.5 text-[11px] transition',
                    !isAuthenticated
                      ? 'text-theme-tertiary cursor-not-allowed'
                      : r.userHasLiked ? 'text-primary font-semibold' : 'text-theme-tertiary hover:text-primary'
                  )}
                >
                  <ThumbsUp className="h-3 w-3" />
                  {r.upvotes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={isQuestion ? 'Write your answer...' : 'Write a reply...'}
            className="flex-1 text-sm border border-theme rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || createReply.isPending}
            className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1 disabled:opacity-50"
          >
            {createReply.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {isQuestion ? 'Submit Answer' : 'Reply'}
          </button>
        </form>
      )}

      {isQuestion && isAuthenticated && (
        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
          ⚠ Answers to questions go through a review process before being published.
        </p>
      )}
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: CommunityPostSummary
  filters: PostFilters
  isAuthenticated: boolean
}

function PostCard({ post, filters, isAuthenticated }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const likePost = useLikePost(filters)

  const typeIcon = {
    discussion: <TrendingUp className="h-3 w-3" />,
    question: <HelpCircle className="h-3 w-3" />,
    insight: <Lightbulb className="h-3 w-3" />,
    poll: <MessageSquare className="h-3 w-3" />,
    announcement: <MessageSquare className="h-3 w-3" />,
  }[post.postType]

  const typeBadgeClass = {
    discussion: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    question: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    insight: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    poll: 'bg-theme-surface-hover text-theme-secondary',
    announcement: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }[post.postType]

  return (
    <article
      className={cn(
        'bg-[var(--bg-card)] backdrop-blur-sm border rounded-xl p-5 transition-all duration-300',
        post.isPinned ? 'border-primary/30 bg-primary/[0.02] shadow-sm' : 'border-theme/60 hover:shadow-md'
      )}
    >
      {post.isPinned && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
          📌 Pinned
        </span>
      )}

      <div className="flex items-start gap-4">
        {/* Like column */}
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!isAuthenticated) return
              likePost.mutate({ postId: post.id, currentlyLiked: post.userHasLiked })
            }}
            disabled={likePost.isPending || !isAuthenticated}
            title={isAuthenticated ? (post.userHasLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
            className={cn(
              'p-1 rounded transition',
              !isAuthenticated
                ? 'text-theme-tertiary cursor-not-allowed'
                : post.userHasLiked ? 'text-primary' : 'text-theme-tertiary hover:text-primary hover:bg-primary/5'
            )}
          >
            <ThumbsUp className={cn('h-4 w-4', post.userHasLiked && 'fill-current')} />
          </button>
          <span className="text-sm font-bold text-theme-primary">{post.upvotes}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type badge + title */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                typeBadgeClass
              )}
            >
              {typeIcon}
              {post.postType}
            </span>
          </div>

          <h3 className="font-semibold text-theme-primary leading-snug line-clamp-2">{post.title}</h3>
          <p className="text-sm text-theme-secondary mt-1 line-clamp-2">{post.bodyPreview}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium bg-theme-surface-hover text-theme-secondary px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-theme-tertiary flex-wrap">
            <span className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {post.author?.fullName?.charAt(0) ?? '?'}
              </div>
              {post.author?.fullName ?? 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(post.createdAt)}
            </span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 hover:text-primary transition ml-auto"
            >
              <MessageSquare className="h-3 w-3" />
              {post.replyCount} {post.postType === 'question' ? 'answers' : 'replies'}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable replies */}
      {expanded && <ReplySection post={post} onClose={() => setExpanded(false)} />}
    </article>
  )
}

// ─── NewPostModal ──────────────────────────────────────────────────────────────

interface NewPostModalProps {
  onClose: () => void
  userRole: string
  initialType?: PostType
  onQuestionPosted?: () => void
}

function NewPostModal({ onClose, userRole, initialType, onQuestionPosted }: NewPostModalProps) {
  const isPrivileged = PRIVILEGED_ROLES.has(userRole)
  const { data: config } = useCommunityConfig()
  const maxWords = config?.postMaxWords ?? 300
  const minWords = config?.postMinWords ?? 10

  const [postType, setPostType] = useState<PostType>(initialType ?? 'discussion')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const tagRef = useRef<HTMLInputElement>(null)
  const createPost = useCreatePost()

  const words = wordCount(body)
  const overLimit = words > maxWords
  const underLimit = words < minWords && body.length > 0

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((t) => t.slice(0, -1))
    }
  }

  const addTag = (value: string) => {
    const cleaned = value.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-')
    if (cleaned && !tags.includes(cleaned) && tags.length < 5) {
      setTags((t) => [...t, cleaned])
    }
    setTagInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim() || overLimit || words < minWords) return

    createPost.mutate(
      {
        title: title.trim(),
        body: body.trim(),
        postType,
        category: postType,
        tags: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: () => {
          if (postType === 'question' && onQuestionPosted) onQuestionPosted()
          onClose()
        },
      }
    )
  }

  const typeOptions = [
    { value: 'discussion' as PostType, label: 'Discussion', desc: 'Start an open conversation — everyone can reply', icon: TrendingUp },
    { value: 'question' as PostType, label: 'Question', desc: 'Ask a question — answers go through review before publishing', icon: HelpCircle },
    ...(isPrivileged
      ? [{ value: 'insight' as PostType, label: 'Insight', desc: 'Share expert knowledge (restricted to platform contributors)', icon: Lightbulb }]
      : []),
  ]

  return (
    <div className="modal-overlay p-4">
      <div className="modal-panel max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-theme">
          <h2 className="font-display text-lg font-bold text-theme-primary">New Post</h2>
          <button onClick={onClose} className="text-theme-tertiary hover:text-theme-primary transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Post type selector */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-2">Post type</label>
            <div className="space-y-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition',
                      postType === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-theme hover:border-theme'
                    )}
                  >
                    <input
                      type="radio"
                      name="postType"
                      value={opt.value}
                      checked={postType === opt.value}
                      onChange={() => setPostType(opt.value)}
                      className="mt-0.5 accent-primary"
                    />
                    <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', postType === opt.value ? 'text-primary' : 'text-theme-tertiary')} />
                    <div>
                      <p className="text-sm font-medium text-theme-primary">{opt.label}</p>
                      <p className="text-xs text-theme-secondary">{opt.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a clear, descriptive title..."
              maxLength={500}
              required
              className="w-full border border-theme rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-sm font-medium text-theme-primary">Body</label>
              <span
                className={cn(
                  'text-xs',
                  overLimit ? 'text-red-500 font-semibold' : underLimit ? 'text-amber-500' : 'text-theme-tertiary'
                )}
              >
                {words} / {maxWords} words
              </span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Share your thoughts... (${minWords}–${maxWords} words)`}
              rows={6}
              required
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none',
                overLimit ? 'border-red-400 focus:border-red-400' : 'border-theme focus:border-primary'
              )}
            />
            {overLimit && (
              <p className="text-xs text-red-500 mt-1">Please keep your post under {maxWords} words.</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-theme-primary mb-1">Tags (up to 5)</label>
            <div
              className="flex flex-wrap gap-1.5 items-center border border-theme rounded-lg px-3 py-2 min-h-[40px] cursor-text"
              onClick={() => tagRef.current?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  <Hash className="h-2.5 w-2.5" />
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTags((t) => t.filter((x) => x !== tag)) }}
                    className="ml-0.5 hover:text-red-500"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  ref={tagRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.replace(/^#/, ''))}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  placeholder={tags.length === 0 ? '#add-tags (press space)' : ''}
                  className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || overLimit || words < minWords || createPost.isPending}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {createPost.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CommunityPage ────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { isAuthenticated, user } = useUserStore()
  const userRole = user?.role ?? 'investor'
  const isPrivileged = PRIVILEGED_ROLES.has(userRole)

  const [activeType, setActiveType] = useState<PostType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [showModal, setShowModal] = useState(false)
  const [modalInitialType, setModalInitialType] = useState<PostType | undefined>(undefined)
  const [questionToast, setQuestionToast] = useState(false)

  const handleQuestionPosted = useCallback(() => {
    setQuestionToast(true)
    setTimeout(() => setQuestionToast(false), 8000)
  }, [])

  const openModalWith = (type: PostType) => {
    setModalInitialType(type)
    setShowModal(true)
  }

  const filters: PostFilters = {
    type: activeType !== 'all' ? activeType : undefined,
    search: search || undefined,
    sort,
    page: 1,
    pageSize: 20,
  }

  const { data, isLoading, isError } = useCommunityPosts(filters)

  // CMS content
  const heroBadge = useContent('community', 'hero_badge', 'Community')
  const heroTitle = useContent('community', 'hero_title', 'The Water Cooler')
  const heroSubtitle = useContent('community', 'hero_subtitle', "Where investors swap alpha, share war stories, and ask the questions Google can't answer.")
  const ctaDiscussion = useContent('community', 'cta_discussion', 'New Discussion')
  const ctaQuestion = useContent('community', 'cta_question', 'Ask Question')
  const ctaInsight = useContent('community', 'cta_insight', 'Share Insight')
  const emptySearchTitle = useContent('community', 'empty_search_title', 'No Posts Found')
  const emptySearchMsg = useContent('community', 'empty_search_msg', 'Try a different search term.')
  const emptyTitle = useContent('community', 'empty_title', 'No Posts Found')
  const emptyMessage = useContent('community', 'empty_message', 'Be the first to start a discussion!')

  return (
    <MainLayout>
      {/* Hero */}
      <div className="page-hero bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#B45309]">
        <div className="page-hero-content flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="page-hero-badge">{heroBadge}</span>
            <h1 className="page-hero-title">{heroTitle}</h1>
            <p className="page-hero-subtitle">
              {heroSubtitle}
            </p>
          </div>
          {isAuthenticated && (
            <div className="flex flex-wrap gap-2 self-start">
              <button
                onClick={() => openModalWith('discussion')}
                className="btn-gradient bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-sm flex items-center gap-1.5 px-4 py-2.5"
              >
                <TrendingUp className="h-4 w-4" />
                {ctaDiscussion}
              </button>
              <button
                onClick={() => openModalWith('question')}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition"
              >
                <HelpCircle className="h-4 w-4" />
                {ctaQuestion}
              </button>
              {isPrivileged && (
                <button
                  onClick={() => openModalWith('insight')}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition"
                >
                  <Lightbulb className="h-4 w-4" />
                  {ctaInsight}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="page-section">
        <div className="page-section-container">

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input
              type="search"
              placeholder="Search posts and tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-theme rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
          <Select
            value={sort}
            onChange={(v) => setSort(v as 'latest' | 'popular')}
            options={[
              { value: 'latest', label: 'Latest' },
              { value: 'popular', label: 'Most Liked' },
            ]}
            size="sm"
          />
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveType(cat.id as PostType | 'all')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition',
                  activeType === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-theme-surface-hover text-theme-secondary hover:bg-[var(--bg-surface-hover)]'
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Post list */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-red-500">
            <p className="font-medium">Failed to load posts. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="space-y-3">
              {(data?.items ?? []).map((post) => (
                <PostCard key={post.id} post={post} filters={filters} isAuthenticated={isAuthenticated} />
              ))}
            </div>

            {data && data.items.length === 0 && (
              <EmptyState
                icon={MessageSquare}
                title={search ? emptySearchTitle : emptyTitle}
                message={search ? emptySearchMsg : emptyMessage}
              />
            )}

            {data && data.totalPages > 1 && (
              <p className="text-center text-xs text-theme-tertiary mt-6">
                Showing page 1 of {data.totalPages} &nbsp;·&nbsp; {data.total} total posts
              </p>
            )}
          </>
        )}
        </div>
      </div>

      {/* New post modal */}
      {showModal && (
        <NewPostModal
          onClose={() => { setShowModal(false); setModalInitialType(undefined) }}
          userRole={userRole}
          initialType={modalInitialType}
          onQuestionPosted={handleQuestionPosted}
        />
      )}

      {/* Question posted toast */}
      {questionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/40 rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Question Submitted!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                Your question will be answered shortly by our knowledge contributors.
                You'll be notified when an approved answer is posted.
              </p>
            </div>
            <button onClick={() => setQuestionToast(false)} className="text-emerald-400 hover:text-emerald-600 dark:text-emerald-400 ml-1 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

