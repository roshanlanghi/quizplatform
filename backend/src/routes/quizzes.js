const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { AppError } = require('../utils/errors');

const router = express.Router();

// Enforce authentication on all quiz routes
router.use(authenticate);

// ─── GET /api/quizzes — List available quizzes ──────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(type && { quizType: type }),
    };

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          _count: { select: { quizQuestions: true, quizAttempts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.quiz.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        quizzes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/quizzes/generate — Generate a quiz from Question Bank ──────
router.post(
  '/generate',
  [
    body('quizType')
      .isIn(['DAILY', 'SUBJECT', 'TOPIC', 'PYQ', 'MOCK', 'REVISION', 'WEAK_TOPIC'])
      .withMessage('Valid quiz type is required'),
    body('questionCount')
      .optional()
      .isInt({ min: 5, max: 100 })
      .withMessage('Question count must be between 5 and 100'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        quizType,
        subjectId,
        topicId,
        year,
        questionCount = 10,
        title,
        duration = 15,
      } = req.body;

      // Filter APPROVED questions matching requirements
      const where = {
        status: 'APPROVED',
        ...(subjectId && { subjectId }),
        ...(topicId && { topicId }),
        ...(year && { year: parseInt(year) }),
        ...(quizType === 'PYQ' && { sourceType: 'PYQ' }),
      };

      const candidateQuestions = await prisma.question.findMany({
        where,
        select: { id: true },
      });

      if (candidateQuestions.length === 0) {
        return next(
          new AppError(
            'No approved questions available matching the selected criteria.',
            404
          )
        );
      }

      // Shuffle candidates and pick `questionCount`
      const shuffled = candidateQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, parseInt(questionCount));

      // Subject / Topic name for title fallback
      let defaultTitle = `${quizType} Quiz`;
      if (subjectId) {
        const sub = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (sub) defaultTitle = `${sub.name} Practice Quiz`;
      }

      // Create Quiz record
      const quiz = await prisma.quiz.create({
        data: {
          title: title ? title.trim() : defaultTitle,
          description: `Generated ${quizType} quiz with ${selectedQuestions.length} questions.`,
          quizType,
          duration: parseInt(duration),
          totalQuestions: selectedQuestions.length,
          totalMarks: selectedQuestions.length,
          quizQuestions: {
            create: selectedQuestions.map((q, index) => ({
              questionId: q.id,
              orderIndex: index + 1,
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
        message: 'Quiz generated successfully',
        data: { quiz },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/quizzes/:id — Fetch quiz details & questions (answers hidden) ─
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        quizQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                difficulty: true,
                language: true,
                subjectId: true,
                topicId: true,
                subject: { select: { name: true } },
                topic: { select: { name: true } },
                options: {
                  select: {
                    id: true,
                    optionKey: true,
                    optionText: true,
                  },
                  orderBy: { optionKey: 'asc' },
                },
                // Intentionally omit correctOption & explanation to prevent devtools cheating
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return next(new AppError('Quiz not found.', 404));
    }

    res.json({
      status: 'success',
      data: { quiz },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/quizzes/:id/start — Start a quiz attempt ────────────────────
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return next(new AppError('Quiz not found.', 404));

    // Check for any ongoing in-progress attempt for this quiz by this user
    let attempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: id,
        status: 'IN_PROGRESS',
      },
    });

    if (!attempt) {
      attempt = await prisma.quizAttempt.create({
        data: {
          userId,
          quizId: id,
          totalQuestions: quiz.totalQuestions,
          maxScore: quiz.totalMarks,
          status: 'IN_PROGRESS',
        },
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Quiz attempt started',
      data: {
        attemptId: attempt.id,
        quizId: quiz.id,
        duration: quiz.duration,
        startedAt: attempt.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/quizzes/:id/submit — Submit quiz answers & evaluate ─────────
router.post('/:id/submit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { attemptId, answers = [], timeSpentSeconds = 0 } = req.body;

    if (!attemptId) {
      return next(new AppError('attemptId is required to submit a quiz.', 422));
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId, quizId: id },
    });

    if (!attempt) {
      return next(new AppError('Quiz attempt not found.', 404));
    }

    if (attempt.status === 'COMPLETED') {
      return res.json({
        status: 'success',
        message: 'Quiz attempt was already submitted.',
        data: { attemptId: attempt.id },
      });
    }

    // Fetch quiz questions with correctOption to evaluate
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        quizQuestions: {
          include: {
            question: {
              select: {
                id: true,
                correctOption: true,
              },
            },
          },
        },
      },
    });

    const questionMap = {};
    quiz.quizQuestions.forEach((qq) => {
      questionMap[qq.question.id] = qq.question;
    });

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let score = 0;

    const answerRecords = [];

    // Map user answers
    const userAnswersMap = {};
    answers.forEach((ans) => {
      if (ans.questionId) {
        userAnswersMap[ans.questionId] = ans;
      }
    });

    // Evaluate each question in the quiz
    for (const qq of quiz.quizQuestions) {
      const q = qq.question;
      const userAns = userAnswersMap[q.id] || {};
      const selected = userAns.selectedOption ? String(userAns.selectedOption).toUpperCase() : null;
      const isMarked = !!userAns.isMarkedForReview;
      const qTimeSpent = userAns.timeSpentSeconds || 0;

      let isCorrect = false;
      if (!selected) {
        unattemptedCount++;
      } else if (selected === q.correctOption) {
        isCorrect = true;
        correctCount++;
        score += qq.marks;
      } else {
        incorrectCount++;
      }

      answerRecords.push({
        attemptId: attempt.id,
        questionId: q.id,
        selectedOption: selected,
        correctOption: q.correctOption,
        isCorrect,
        isMarkedForReview: isMarked,
        timeSpentSeconds: qTimeSpent,
      });
    }

    const totalQ = quiz.quizQuestions.length;
    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // Transaction to update attempt and insert answer records
    const updatedAttempt = await prisma.$transaction(async (tx) => {
      // Save answer records
      for (const record of answerRecords) {
        await tx.quizAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId: record.attemptId,
              questionId: record.questionId,
            },
          },
          update: record,
          create: record,
        });
      }

      // Update attempt status
      return tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          maxScore: quiz.totalMarks,
          accuracy: parseFloat(accuracy.toFixed(2)),
          totalQuestions: totalQ,
          correctCount,
          incorrectCount,
          unattemptedCount,
          timeSpentSeconds: parseInt(timeSpentSeconds),
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });

    res.json({
      status: 'success',
      message: 'Quiz submitted successfully',
      data: {
        attempt: updatedAttempt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/quizzes/attempts/:attemptId — Get attempt results & analysis ──
router.get('/attempts/:attemptId', async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: { id: true, title: true, quizType: true, duration: true, totalMarks: true },
        },
        answers: {
          include: {
            question: {
              include: {
                subject: { select: { name: true } },
                topic: { select: { name: true } },
                options: { orderBy: { optionKey: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return next(new AppError('Quiz attempt record not found.', 404));
    }

    // Ensure user is authorized to view this attempt
    if (req.user.role !== 'ADMIN' && attempt.userId !== req.user.id) {
      return next(new AppError('Unauthorized access to quiz attempt.', 403));
    }

    res.json({
      status: 'success',
      data: { attempt },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
