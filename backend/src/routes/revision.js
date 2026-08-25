const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/revision/bookmarks — Fetch user's bookmarked questions ─────────
router.get('/bookmarks', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            subject: { select: { id: true, name: true } },
            topic: { select: { id: true, name: true } },
            options: { orderBy: { optionKey: 'asc' } },
            source: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'success',
      data: {
        bookmarks: bookmarks.map((b) => ({
          bookmarkId: b.id,
          createdAt: b.createdAt,
          question: b.question,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/revision/bookmarks/:questionId — Toggle question bookmark ────
router.post('/bookmarks/:questionId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.params;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return next(new AppError('Question not found.', 404));
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    let isBookmarked = false;

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id },
      });
      isBookmarked = false;
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          questionId,
        },
      });
      isBookmarked = true;
    }

    res.json({
      status: 'success',
      message: isBookmarked ? 'Question bookmarked' : 'Bookmark removed',
      data: {
        bookmarked: isBookmarked,
        questionId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/revision/wrong-questions — Fetch incorrectly answered questions ─
router.get('/wrong-questions', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch incorrect quiz answers for completed attempts
    const wrongAnswers = await prisma.quizAnswer.findMany({
      where: {
        attempt: {
          userId,
          status: 'COMPLETED',
        },
        isCorrect: false,
        selectedOption: { not: null },
      },
      include: {
        question: {
          include: {
            subject: { select: { id: true, name: true } },
            topic: { select: { id: true, name: true } },
            options: { orderBy: { optionKey: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate by questionId
    const uniqueWrongMap = {};
    wrongAnswers.forEach((ans) => {
      if (!uniqueWrongMap[ans.questionId]) {
        uniqueWrongMap[ans.questionId] = {
          answerId: ans.id,
          lastAttempted: ans.createdAt,
          userSelectedOption: ans.selectedOption,
          correctOption: ans.correctOption,
          question: ans.question,
        };
      }
    });

    const wrongQuestions = Object.values(uniqueWrongMap);

    res.json({
      status: 'success',
      data: {
        totalWrong: wrongQuestions.length,
        wrongQuestions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/revision/generate-quiz — Create a custom Revision Quiz ────────
router.post('/generate-quiz', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      source = 'ALL', // 'WRONG', 'BOOKMARKS', 'ALL'
      questionCount = 10,
      duration = 15,
      title,
    } = req.body;

    let candidateQuestionIds = [];

    if (source === 'WRONG' || source === 'ALL') {
      const wrongAns = await prisma.quizAnswer.findMany({
        where: {
          attempt: { userId, status: 'COMPLETED' },
          isCorrect: false,
          selectedOption: { not: null },
        },
        select: { questionId: true },
      });
      candidateQuestionIds.push(...wrongAns.map((w) => w.questionId));
    }

    if (source === 'BOOKMARKS' || source === 'ALL') {
      const bmarks = await prisma.bookmark.findMany({
        where: { userId },
        select: { questionId: true },
      });
      candidateQuestionIds.push(...bmarks.map((b) => b.questionId));
    }

    // Unique IDs
    let uniqueIds = [...new Set(candidateQuestionIds)];

    // If candidate set is smaller than target count, fill with approved PYQs
    if (uniqueIds.length < parseInt(questionCount)) {
      const fallbackQuestions = await prisma.question.findMany({
        where: { status: 'APPROVED' },
        select: { id: true },
        take: parseInt(questionCount) * 2,
      });
      const extraIds = fallbackQuestions.map((q) => q.id);
      uniqueIds = [...new Set([...uniqueIds, ...extraIds])];
    }

    if (uniqueIds.length === 0) {
      return next(
        new AppError(
          'No questions available for revision quiz. Practice some quizzes or bookmark questions first!',
          400
        )
      );
    }

    const shuffled = uniqueIds.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, parseInt(questionCount));

    const quizTitle = title || `Revision Quiz — (${source} Mode)`;

    const quiz = await prisma.quiz.create({
      data: {
        title: quizTitle,
        description: `Targeted revision quiz generated from ${source} question bank.`,
        quizType: 'REVISION',
        duration: parseInt(duration),
        totalQuestions: selectedIds.length,
        totalMarks: selectedIds.length,
        quizQuestions: {
          create: selectedIds.map((qId, idx) => ({
            questionId: qId,
            orderIndex: idx + 1,
            marks: 1.0,
          })),
        },
      },
      include: {
        _count: { select: { quizQuestions: true } },
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'Revision Quiz generated successfully',
      data: { quiz },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
