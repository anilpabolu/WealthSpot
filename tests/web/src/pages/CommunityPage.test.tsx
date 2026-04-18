import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/components/layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/ui', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <select>{children}</select>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}))
vi.mock('@/stores/user.store', () => ({
  useUserStore: vi.fn((selector?: (s: unknown) => unknown) =>
    selector
      ? selector({ user: { id: '1', role: 'investor', fullName: 'Test User' } })
      : { user: { id: '1', role: 'investor', fullName: 'Test User' } }
  ),
}))
vi.mock('@/hooks/useSiteContent', () => ({
  useContent: vi.fn((_page: string, _tag: string, fallback: string) => fallback),
}))
vi.mock('@/hooks/useCommunity', () => ({
  useCommunityPosts: vi.fn(() => ({
    data: { items: [
      { id: '1', title: 'Hello community!', bodyPreview: 'This is a test post', postType: 'discussion', author: { id: '1', fullName: 'John', avatar: null }, upvotes: 3, replyCount: 1, createdAt: '2024-01-01', userHasLiked: false, tags: ['general'], isPinned: false },
    ], total: 1, page: 1, totalPages: 1 },
    isLoading: false,
  })),
  useCommunityReplies: vi.fn(() => ({ data: [], isLoading: false })),
  useCommunityConfig: vi.fn(() => ({
    data: { postTypes: ['discussion', 'question', 'idea'], tags: ['general', 'investing'] },
    isLoading: false,
  })),
  useCreatePost: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useCreateReply: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useLikePost: vi.fn(() => ({ mutate: vi.fn() })),
  useLikeReply: vi.fn(() => ({ mutate: vi.fn() })),
  type: {} as never,
}))

import CommunityPage from '@/pages/CommunityPage'

describe('CommunityPage', () => {
  let qc: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const renderPage = () =>
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <CommunityPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

  it('renders the community page', () => {
    renderPage()
    expect(screen.getAllByText(/community/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows community posts', () => {
    renderPage()
    expect(screen.getByText('Hello community!')).toBeInTheDocument()
  })

  it('shows post author name', () => {
    renderPage()
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('shows like count', () => {
    renderPage()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders post type filters', () => {
    renderPage()
    // Should have filter options
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })
})
