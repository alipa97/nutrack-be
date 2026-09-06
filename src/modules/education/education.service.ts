import { prisma } from '../../config/prisma.js';

export const educationService = {
  async listArticles(userId?: string) {
    const articles = await prisma.educationArticle.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: userId
        ? {
            likes: { where: { userId } },
            bookmarks: { where: { userId } },
          }
        : undefined,
    });

    return articles.map((article) => {
      const isLiked = userId ? ((article as any).likes?.length ?? 0) > 0 : false;
      const isBookmarked = userId ? ((article as any).bookmarks?.length ?? 0) > 0 : false;
      const { likes: _likes, bookmarks: _bookmarks, ...rest } = article as any;
      return {
        ...rest,
        isLiked,
        isBookmarked,
      };
    });
  },

  async getArticle(id: string, userId?: string) {
    const article = await prisma.educationArticle.findUnique({
      where: { id },
      include: userId
        ? {
            likes: { where: { userId } },
            bookmarks: { where: { userId } },
          }
        : undefined,
    });

    if (!article) return null;

    const isLiked = userId ? ((article as any).likes?.length ?? 0) > 0 : false;
    const isBookmarked = userId ? ((article as any).bookmarks?.length ?? 0) > 0 : false;
    const { likes: _likes, bookmarks: _bookmarks, ...rest } = article as any;
    return {
      ...rest,
      isLiked,
      isBookmarked,
    };
  },

  async toggleLike(userId: string, articleId: string) {
    const article = await prisma.educationArticle.findUnique({
      where: { id: articleId },
      select: { id: true },
    });
    if (!article) {
      throw new Error('Artikel tidak ditemukan');
    }

    const existing = await prisma.articleLike.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    if (existing) {
      await prisma.articleLike.delete({
        where: { id: existing.id },
      });
      return { isLiked: false, articleId };
    } else {
      await prisma.articleLike.create({
        data: { userId, articleId },
      });
      return { isLiked: true, articleId };
    }
  },

  async toggleBookmark(userId: string, articleId: string) {
    const article = await prisma.educationArticle.findUnique({
      where: { id: articleId },
      select: { id: true },
    });
    if (!article) {
      throw new Error('Artikel tidak ditemukan');
    }

    const existing = await prisma.articleBookmark.findUnique({
      where: {
        userId_articleId: { userId, articleId },
      },
    });

    if (existing) {
      await prisma.articleBookmark.delete({
        where: { id: existing.id },
      });
      return { isBookmarked: false, articleId };
    } else {
      await prisma.articleBookmark.create({
        data: { userId, articleId },
      });
      return { isBookmarked: true, articleId };
    }
  },

  async listGlossary() {
    return prisma.nutritionGlossary.findMany({
      where: { isActive: true },
      orderBy: { term: 'asc' },
    });
  },
};
