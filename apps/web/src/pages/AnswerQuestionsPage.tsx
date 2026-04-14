import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { useUserStore } from '@/stores/user.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import type { PaginatedPosts, CommunityPostSummary, CommunityReply } from '@/hooks/useCommunity'
import {
  HelpCircle,
  Send,
  Clock,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react'
import { EmptyState } from '@/components/ui'

const ALLOWED_ROLES = new Set(['admin', 'super_admin', 'community_lead', 'knowledge_contributor', 'approver'])

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

function QuestionCard({ question }: { question: CommunityPostSummary }) {
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const qc = useQueryClient()

  const submitAnswer = useMutation({
    mutationFn: (body: string) =>
      apiPost<CommunityReply>(`/community/posts/${question.id}/replies`, { body }),
    onSuccess: () => {
      setDraft('')
      setSubmitted(true)
      qc.invalidateQueries({ queryKey: ['unanswered-questions'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    submitAnswer.mutate(draft.trim())
  }

  return (
    <article className="bg-[var(--bg-surface)] border border-theme rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Upvote column */}
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
          <ThumbsUp className="h-4 w-4 text-theme-tertiary" />
          <span className="text-sm font-bold text-theme-secondary">{question.upvotes}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <HelpCircle className="h-3 w-3" />
              Question
            </span>
            <span className="text-[10px] text-theme-tertiary flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {question.replyCount} answers
            </span>
          </div>

          <h3 className="font-semibold text-theme-primary leading-snug">{question.title}</h3>
          <p className="text-sm text-theme-secondary mt-1 line-clamp-2">{question.bodyPreview}</p>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {question.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium bg-theme-surface-hover text-theme-secondary px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author & time */}
          <div className="flex items-center gap-4 mt-3 text-xs text-theme-tertiary">
            <span className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {question.author?.fullName?.charAt(0) ?? '?'}
              </div>
              {question.author?.fullName ?? 'Anonymous'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {relativeTime(question.createdAt)}
            </span>
          </div>

          {/* Answer form */}
          {submitted ? (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100">
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Answer submitted for review!</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Your answer will be visible once approved by an admin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write your answer to this question..."
                rows={3}
                className="w-full border border-theme rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!draft.trim() || submitAnswer.isPending}
                  className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitAnswer.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Submit Answer
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  )
}

export default function AnswerQuestionsPage() {
  const { user, isAuthenticated } = useUserStore()
  const role = user?.role ?? 'investor'
  const authorized = isAuthenticated && ALLOWED_ROLES.has(role)

  const { data, isLoading, isError } = useQuery<PaginatedPosts>({
    queryKey: ['unanswered-questions'],
    queryFn: () => apiGet<PaginatedPosts>('/community/questions/unanswered'),
    enabled: authorized,
  })

  return (
    <MainLayout>
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#B45309]">
        <div className="page-hero-content">
          <span className="page-hero-badge">Community</span>
          <h1 className="page-hero-title">Answer Questions</h1>
          <p className="page-hero-subtitle">Help the community by answering unanswered questions. Approved answers earn you contributor points.</p>
        </div>
      </section>

      <div className="page-section">
        <div className="page-section-container max-w-4xl mx-auto">

        {!authorized && (
          <EmptyState icon={HelpCircle} title="Access Restricted" message="Only knowledge contributors and admins can answer questions." />
        )}

        {authorized && isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
          </div>
        )}

        {authorized && isError && (
          <div className="text-center py-16 text-red-500">
            <p className="font-medium">Failed to load questions. Try again.</p>
          </div>
        )}

        {authorized && !isLoading && !isError && (
          <>
            {data && data.items.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All caught up!" message="No unanswered questions right now. Check back later." />
            ) : (
              <div className="space-y-4">
                {(data?.items ?? []).map((q) => (
                  <QuestionCard key={q.id} question={q} />
                ))}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <p className="text-center text-xs text-theme-tertiary mt-6">
                Showing page 1 of {data.totalPages} &middot; {data.total} questions
              </p>
            )}
          </>
        )}
        </div>
      </div>
    </MainLayout>
  )
}
