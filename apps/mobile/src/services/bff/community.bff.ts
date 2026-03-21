/**
 * Mobile Community BFF – matches web's community.bff.ts patterns.
 */

import { apiGet, apiPost } from "../../lib/api";

export interface CommunityFeedItem {
  id: string;
  postType: string;
  title: string;
  bodyPreview: string;
  category: string | null;
  tags: string[] | null;
  upvotes: number;
  replyCount: number;
  isPinned: boolean;
  author: { id: string; fullName: string; avatarUrl: string | null };
  createdAt: string;
}

export interface CommunityFeedView {
  posts: CommunityFeedItem[];
  total: number;
  page: number;
  totalPages: number;
  pinned: CommunityFeedItem[];
}

export interface PostDetailView {
  post: CommunityFeedItem & { body: string };
  replies: Array<{
    id: string;
    body: string;
    upvotes: number;
    author: { id: string; fullName: string; avatarUrl: string | null };
    createdAt: string;
  }>;
}

export const mobileCommunityBff = {
  async getFeed(params?: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<CommunityFeedView> {
    const result = await apiGet<{
      items: CommunityFeedItem[];
      total: number;
      page: number;
      totalPages: number;
    }>("/community/posts", {
      params: {
        ...(params?.category && { category: params.category }),
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 15,
      },
    });

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

  async getPostDetail(postId: string): Promise<PostDetailView> {
    const [post, replies] = await Promise.all([
      apiGet<PostDetailView["post"]>(`/community/posts/${postId}`),
      apiGet<PostDetailView["replies"]>(`/community/posts/${postId}/replies`),
    ]);
    return { post, replies };
  },

  async createPost(payload: {
    title: string;
    body: string;
    postType?: string;
    category?: string;
    tags?: string[];
  }) {
    return apiPost<{ id: string }>("/community/posts", {
      title: payload.title,
      body: payload.body,
      post_type: payload.postType,
      category: payload.category,
      tags: payload.tags,
    });
  },

  async replyToPost(postId: string, body: string) {
    return apiPost<{ id: string }>(`/community/posts/${postId}/replies`, {
      body,
    });
  },

  async upvotePost(postId: string) {
    return apiPost<{ upvotes: number }>(`/community/posts/${postId}/upvote`);
  },
};
