/**
 * Community BFF – Forum posts, replies, and interactions
 */

import type {
  CommunityFeedItem,
  CommunityFeedView,
  PostDetailView,
} from "@wealthspot/types";
import { apiGet, apiPost } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { CommunityFeedItem, CommunityFeedView, PostDetailView };

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
      totalPages: number;
    }>("/community/posts", { params });

    // Separate pinned from regular
    const pinned = result.items.filter((p) => p.isPinned);
    const posts = result.items.filter((p) => !p.isPinned);

    return {
      posts,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
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
