import { Comment, Post, User } from '@prisma/client';

export interface VoteSummary {
  up: number;
  down: number;
}

export interface PostWithMeta extends Post {
  user: Pick<User, 'id' | 'username' | 'uuid'>;
  _count?: { comments?: number };
  votes?: VoteSummary;
}

export interface CommentWithUser extends Comment {
  user?: Pick<User, 'id' | 'username' | 'uuid'>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentPath?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}

export interface PathNode {
  path: string;
  depth: number;
  children: PathNode[];
  comment: Comment;
}

export type VoteValueString = 'UP' | 'DOWN';
