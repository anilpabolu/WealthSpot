import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export interface KnowledgeArticleSummary {
  id: string
  slug: string
  title: string
  synopsis: string
  coverImageUrl: string | null
  isPublished: boolean
  sortOrder: number
  imageCount: number
  pdfCount: number
  videoCount: number
}

export interface KnowledgeArticleDetail extends KnowledgeArticleSummary {
  body: string | null
  assets: {
    id: string
    assetType: 'image' | 'pdf' | 'video'
    url: string
    filename: string | null
    contentType: string | null
    sortOrder: number
  }[]
}

export function useKnowledgeArticles() {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: () => apiGet<KnowledgeArticleSummary[]>('/knowledge'),
    staleTime: 30_000,
  })
}

export function useKnowledgeArticle(slug: string) {
  return useQuery({
    queryKey: ['knowledge', slug],
    queryFn: () => apiGet<KnowledgeArticleDetail>(`/knowledge/${slug}`),
    enabled: !!slug,
  })
}
