import { prisma } from '@/lib/prisma';
import { findChildComments } from './path';

/**
 * Article Soft Delete
 * @param articleId 삭제할 Article ID
 */
export async function softDeleteArticle(articleId: string): Promise<void> {
  await prisma.article.update({
    where: { id: articleId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // 모든 댓글도 soft delete
  await prisma.comment.updateMany({
    where: { articleId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}

/**
 * Comment Soft Delete (재귀적으로 자식도 삭제)
 * @param commentId 삭제할 Comment ID
 */
export async function softDeleteComment(commentId: string): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) return;

  // 현재 댓글 soft delete
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // 같은 article의 모든 댓글 조회
  const allComments = await prisma.comment.findMany({
    where: { articleId: comment.articleId },
  });

  // 자식 댓글 찾기 및 재귀 삭제
  const children = findChildComments(comment.path, allComments);
  for (const child of children) {
    await prisma.comment.update({
      where: { id: child.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}

/**
 * Article Hard Delete (orphan check 후)
 * @param articleId 삭제할 Article ID
 */
export async function hardDeleteArticle(articleId: string): Promise<void> {
  // 모든 댓글이 soft deleted 상태인지 확인
  const activeComments = await prisma.comment.count({
    where: {
      articleId,
      isDeleted: false,
    },
  });

  if (activeComments === 0) {
    // 모든 댓글 hard delete
    await prisma.comment.deleteMany({
      where: { articleId },
    });

    // Article hard delete
    await prisma.article.delete({
      where: { id: articleId },
    });
  }
}

/**
 * Comment Hard Delete (orphan check 후 재귀 삭제)
 * @param commentId 삭제할 Comment ID
 */
export async function hardDeleteComment(commentId: string): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) return;

  const allComments = await prisma.comment.findMany({
    where: { articleId: comment.articleId },
  });

  // 자식이 있는지 확인
  const children = findChildComments(comment.path, allComments);
  const activeChildren = children.filter((c) => !c.isDeleted);

  if (activeChildren.length === 0) {
    // 자식 댓글들 hard delete
    for (const child of children) {
      await prisma.comment.delete({
        where: { id: child.id },
      });
    }

    // 현재 댓글 hard delete
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // 부모 댓글의 orphan check (재귀)
    const pathParts = comment.path.split('.');
    if (pathParts.length > 1) {
      const parentPath = pathParts.slice(0, -1).join('.');
      const parent = allComments.find((c) => c.path === parentPath);
      if (parent && parent.isDeleted) {
        await hardDeleteComment(parent.id);
      }
    }
  }
}

/**
 * 삭제 프로세스 전체 처리
 * @param id Article 또는 Comment ID
 * @param type 'article' | 'comment'
 */
export async function deleteEntity(
  id: string,
  type: 'article' | 'comment'
): Promise<void> {
  if (type === 'article') {
    await softDeleteArticle(id);
    await hardDeleteArticle(id);
  } else {
    await softDeleteComment(id);
    await hardDeleteComment(id);
  }
}
