import { useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import {
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  HelpCircle,
  Lightbulb,
  Search,
  Plus,
  Clock,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: MessageSquare },
  { id: 'discussion', label: 'Discussions', icon: TrendingUp },
  { id: 'question', label: 'Questions', icon: HelpCircle },
  { id: 'insight', label: 'Insights', icon: Lightbulb },
]

const MOCK_POSTS = [
  {
    id: '1',
    title: 'Bengaluru East residential market — is it the right time?',
    body: 'With the metro expansion reaching Whitefield, property values in East Bengaluru have been on an upward trajectory. Rental yields are improving too...',
    category: 'discussion',
    author: { name: 'Rajesh Kumar', avatar: null },
    createdAt: '2 hours ago',
    upvotes: 34,
    replies: 12,
    isPinned: true,
    tags: ['bangalore', 'residential', 'metro'],
  },
  {
    id: '2',
    title: 'How does the rental income distribution work exactly?',
    body: 'I recently invested in The Pinnacle. Could someone explain how and when the rental income gets credited to investors? Is it proportional to units held?',
    category: 'question',
    author: { name: 'Priya Sharma', avatar: null },
    createdAt: '5 hours ago',
    upvotes: 21,
    replies: 8,
    isPinned: false,
    tags: ['rental-income', 'how-it-works'],
  },
  {
    id: '3',
    title: 'Commercial vs Residential — My experience over 2 years',
    body: 'I\'ve invested in both asset types on WealthSpot. Here\'s my honest comparison of returns, stability, and exit ease after holding for 24 months...',
    category: 'insight',
    author: { name: 'Amit Patel', avatar: null },
    createdAt: '1 day ago',
    upvotes: 67,
    replies: 23,
    isPinned: false,
    tags: ['commercial', 'returns', 'comparison'],
  },
  {
    id: '4',
    title: 'Tax implications of fractional real estate in India',
    body: 'After consulting my CA, here\'s a summary of how rental income and capital gains from fractional ownership are taxed under current Indian tax laws...',
    category: 'insight',
    author: { name: 'Sneha Reddy', avatar: null },
    createdAt: '2 days ago',
    upvotes: 89,
    replies: 31,
    isPinned: false,
    tags: ['tax', 'india', 'capital-gains'],
  },
  {
    id: '5',
    title: 'Should I invest ₹2L in one property or split across two?',
    body: 'I have ₹2 lakhs ready to invest. Is diversification better even at this amount, or should I concentrate on the best deal available right now?',
    category: 'question',
    author: { name: 'Vikram Singh', avatar: null },
    createdAt: '3 days ago',
    upvotes: 15,
    replies: 9,
    isPinned: false,
    tags: ['diversification', 'strategy'],
  },
]

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = MOCK_POSTS.filter((post) => {
    const catMatch = activeCategory === 'all' || post.category === activeCategory
    const searchMatch =
      !search ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.tags.some((t) => t.includes(search.toLowerCase()))
    return catMatch && searchMatch
  })

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Community</h1>
            <p className="text-gray-500 text-sm mt-1">
              Connect with fellow investors, share insights, and ask questions.
            </p>
          </div>
          <button className="btn-primary text-sm flex items-center gap-2 self-start">
            <Plus className="h-4 w-4" />
            New Post
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search posts, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition',
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {filtered.map((post) => (
            <article
              key={post.id}
              className={cn(
                'bg-white border rounded-xl p-5 hover:shadow-md transition-shadow',
                post.isPinned ? 'border-primary/30 bg-primary/[0.02]' : 'border-gray-200'
              )}
            >
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                  📌 Pinned
                </span>
              )}
              <div className="flex items-start gap-4">
                {/* Upvote column */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <button className="p-1 rounded hover:bg-primary/5 transition">
                    <ThumbsUp className="h-4 w-4 text-gray-400 hover:text-primary" />
                  </button>
                  <span className="text-sm font-bold text-gray-700">{post.upvotes}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <Link to={`/community/${post.id}`} className="block group">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.body}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {post.author.name.charAt(0)}
                      </div>
                      {post.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.createdAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.replies} replies
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-500">No posts found</p>
              <p className="text-sm mt-1">Try adjusting your filters or start a new discussion.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
