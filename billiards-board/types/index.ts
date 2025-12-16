import { Article, Comment, User } from '@prisma/client';

// Three.js 공 위치 정보
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// 공 (Article 또는 Comment)
export interface Ball {
  id: string;
  type: 'article' | 'comment';
  content: string;
  position: Position3D;
  radius: number;
  userId: string;
  createdAt: Date;
  isDeleted: boolean;
  commentsCount?: number;

  // 댓글인 경우
  articleId?: string;
  path?: string;
  depth?: number;
}

// Article with relations
export interface ArticleWithComments extends Article {
  comments: Comment[];
  user: User;
}

// Comment with relations
export interface CommentWithUser extends Comment {
  user: User;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 글 생성 요청
export interface CreateArticleRequest {
  content: string;
  position?: Position3D;
}

// 댓글 생성 요청
export interface CreateCommentRequest {
  content: string;
  articleId: string;
  parentPath?: string; // 부모 댓글의 path (최상위 댓글이면 undefined)
  position?: Position3D;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// Path 유틸리티 타입
export interface PathNode {
  path: string;
  depth: number;
  children: PathNode[];
  comment: Comment;
}
