/**
 * Mobile Community BFF
 */

import { apiGet, apiPost } from "../../lib/api";

export interface MobilePostItem {
  id: string;
  title: string;
  body_preview: string;
  post_type: string;
  upvotes: number;
  reply_count: number;
  author_name: string;
  created_at: string;
}

export const mobileCommunityBff = {
  async getFeed(page = 1): Promise<{ items: MobilePostItem[]; total: number }> {
    return apiGet("/community/posts", { page, page_size: 15 });
  },

  async getPostDetail(postId: string) {
    const [post, replies] = await Promise.all([
      apiGet<{
        id: string;
        title: string;
        body: string;
        post_type: string;
        upvotes: number;
        author: { full_name: string; avatar_url: string | null };
        created_at: string;
      }>(`/community/posts/${postId}`),
      apiGet<
        Array<{
          id: string;
          body: string;
          upvotes: number;
          author: { full_name: string; avatar_url: string | null };
          created_at: string;
        }>
      >(`/community/posts/${postId}/replies`),
    ]);

    return { post, replies };
  },

  async createPost(title: string, body: string, category?: string) {
    return apiPost<{ id: string }>("/community/posts", { title, body, category });
  },
};
