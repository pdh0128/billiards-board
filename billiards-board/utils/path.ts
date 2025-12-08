import { Comment } from '@prisma/client';
import { PathNode } from '@/types';

/**
 * 새로운 path 생성
 * @param parentPath 부모 댓글의 path (최상위면 undefined)
 * @param siblingCount 같은 레벨의 형제 댓글 수
 * @returns 새로운 path (예: "001", "001.002", "001.002.003")
 */
export function generatePath(parentPath: string | undefined, siblingCount: number): string {
  const newNumber = String(siblingCount + 1).padStart(3, '0');

  if (!parentPath) {
    return newNumber; // 최상위 댓글
  }

  return `${parentPath}.${newNumber}`;
}

/**
 * path에서 depth 계산
 * @param path 댓글의 path
 * @returns depth (0부터 시작)
 */
export function getDepthFromPath(path: string): number {
  return path.split('.').length - 1;
}

/**
 * 댓글 배열을 트리 구조로 변환
 * @param comments 댓글 배열
 * @returns 트리 구조의 PathNode 배열
 */
export function buildCommentTree(comments: Comment[]): PathNode[] {
  const sorted = [...comments].sort((a, b) => a.path.localeCompare(b.path));
  const tree: PathNode[] = [];
  const map = new Map<string, PathNode>();

  for (const comment of sorted) {
    const node: PathNode = {
      path: comment.path,
      depth: comment.depth,
      children: [],
      comment,
    };

    map.set(comment.path, node);

    // 부모 찾기
    const pathParts = comment.path.split('.');
    if (pathParts.length === 1) {
      // 최상위 댓글
      tree.push(node);
    } else {
      // 자식 댓글
      const parentPath = pathParts.slice(0, -1).join('.');
      const parent = map.get(parentPath);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return tree;
}

/**
 * 특정 path의 모든 자식 path 찾기
 * @param path 부모 path
 * @param comments 전체 댓글 배열
 * @returns 자식 댓글 배열
 */
export function findChildComments(path: string, comments: Comment[]): Comment[] {
  return comments.filter((c) => c.path.startsWith(path + '.'));
}

/**
 * 다음 형제 번호 계산
 * @param parentPath 부모 path (최상위면 undefined)
 * @param comments 현재 댓글 배열
 * @returns 다음 형제 번호
 */
export function getNextSiblingNumber(
  parentPath: string | undefined,
  comments: Comment[]
): number {
  if (!parentPath) {
    // 최상위 댓글의 경우
    const topLevelComments = comments.filter((c) => c.depth === 0);
    return topLevelComments.length;
  }

  // 자식 댓글의 경우
  const siblings = comments.filter((c) => {
    const parts = c.path.split('.');
    const parentParts = parentPath.split('.');
    return (
      parts.length === parentParts.length + 1 &&
      c.path.startsWith(parentPath + '.')
    );
  });

  return siblings.length;
}
