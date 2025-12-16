(async () => {
  const { prisma } = await import('../lib/prisma');

  // 초기화: 모든 데이터 제거 후 새 시드
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  const user = await prisma.user.create({
    data: { username: 'seed', passwordHash: 'seed' },
  });

  const posts = Array.from({ length: 100 }, (_, i) => ({
    title: `테스트 게시글 ${i + 1}`,
    content: `이것은 테스트 게시글 ${i + 1} 의 내용입니다.`,
    userId: user.id,
  }));

  await prisma.post.createMany({ data: posts });

  console.log('Seeded 100 posts for user', user.id);
  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
