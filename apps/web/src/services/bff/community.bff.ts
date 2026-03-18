/**
 * Community BFF – Forum posts, replies, and interactions
 */

import { apiGet, apiPost } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface CommunityFeedItem {
  id: string;
  post_type: string;
  title: string;
  body_preview: string; // first 200 chars
  category: string | null;
  tags: string[] | null;
  upvotes: number;
  reply_count: number;
  is_pinned: boolean;
  author: { id: string; full_name: string; avatar_url: string | null };
  created_at: string;
}

export interface CommunityFeedView {
  posts: CommunityFeedItem[];
  total: number;
  page: number;
  total_pages: number;
  pinned: CommunityFeedItem[];
}

export interface PostDetailView {
  post: CommunityFeedItem & { body: string };
  replies: Array<{
    id: string;
    body: string;
    upvotes: number;
    author: { id: string; full_name: string; avatar_url: string | null };
    created_at: string;
  }>;
}

// ── BFF Service ───────────────────────────────────────────────────────────

export const communityBff = {
  /**
   * Community feed with pinned posts separated.
   */
  async getFeed(params?: {
    category?: string;
    page?: number;
    page_size?: number;
  }): Promise<CommunityFeedView> {
    const result = await apiGet<{
      items: CommunityFeedItem[];
      total: number;
      page: number;
      total_pages: number;
    }>("/community/posts", { params });

    // Separate pinned from regular
    const pinned = result.items.filter((p) => p.is_pinned);
    const posts = result.items.filter((p) => !p.is_pinned);

    return {
      posts,
      total: result.total,
      page: result.page,
      total_pages: result.total_pages,
      pinned,
    };
  },

  /**
   * Full post with all replies.
   */
  async getPostDetail(postId: string): Promise<PostDetailView> {
    const [post, replies] = await Promise.all([
      apiGet<PostDetailView["post"]>(`/community/posts/${postId}`),
      apiGet<PostDetailView["replies"]>(`/community/posts/${postId}/replies`),
    ]);

    return { post, replies };
  },

  /**
   * Create a new post.
   */
  async createPost(payload: {
    title: string;
    body: string;
    post_type?: string;
    category?: string;
    tags?: string[];
  }) {
    return apiPost<{ id: string }>("/community/posts", payload);
  },

  /**
   * Reply to a post.
   */
  async replyToPost(postId: string, body: string) {
    return apiPost<{ id: string }>(`/community/posts/${postId}/replies`, { body });
  },

  /**
   * Upvote a post.
   */
  async upvotePost(postId: string) {
    return apiPost<{ upvotes: number }>(`/community/posts/${postId}/upvote`);
  },
};
