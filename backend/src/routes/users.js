const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/users/dashboard — Student Dashboard & Analytics ───────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Time boundaries for Today
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Fetch Today's Completed Attempts
    const todayAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    let todayQuestions = 0;
    let todayCorrect = 0;
    let todayTimeSpentSeconds = 0;

    todayAttempts.forEach((att) => {
      todayQuestions += att.totalQuestions;
      todayCorrect += att.correctCount;
      todayTimeSpentSeconds += att.timeSpentSeconds;
    });

    const todayAccuracy =
      todayQuestions > 0 ? parseFloat(((todayCorrect / todayQuestions) * 100).toFixed(1)) : 0;

    // 2. Compute Daily Streak (consecutive days with completed attempt)
    const allAttempts = await prisma.quizAttempt.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    let streak = 0;
    if (allAttempts.length > 0) {
      const dates = [
        ...new Set(
          allAttempts.map((a) =>
            new Date(a.completedAt).toISOString().split('T')[0]
          )
        ),
      ];

      const todayStr = startOfToday.toISOString().split('T')[0];
      const yesterdayStr = new Date(now.valueOf() - 86400000)
        .toISOString()
        .split('T')[0];

      let checkDate = dates.includes(todayStr)
        ? new Date(startOfToday)
        : dates.includes(yesterdayStr)
        ? new Date(now.valueOf() - 86400000)
        : null;

      if (checkDate) {
        while (true) {
          const dStr = checkDate.toISOString().split('T')[0];
          if (dates.includes(dStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // 3. Fetch All Subjects & User's Question Performance
    const subjects = await prisma.subject.findMany({
      select: { id: true, name: true, code: true, icon: true },
      orderBy: { name: 'asc' },
    });

    // Fetch user answers with question details
    const userAnswers = await prisma.quizAnswer.findMany({
      where: {
        attempt: {
          userId,
          status: 'COMPLETED',
        },
      },
      select: {
        isCorrect: true,
        question: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    // Aggregate stats per subject
    const subjectStatsMap = {};
    subjects.forEach((s) => {
      subjectStatsMap[s.id] = {
        subjectId: s.id,
        name: s.name,
        code: s.code,
        icon: s.icon || '📚',
        totalAttempted: 0,
        correctCount: 0,
        accuracy: 0,
        statusTag: 'UNTESTED', // 'STRONG', 'NORMAL', 'NEEDS_FOCUS', 'UNTESTED'
      };
    });

    userAnswers.forEach((ans) => {
      const subId = ans.question?.subjectId;
      if (subId && subjectStatsMap[subId]) {
        subjectStatsMap[subId].totalAttempted += 1;
        if (ans.isCorrect) {
          subjectStatsMap[subId].correctCount += 1;
        }
      }
    });

    const subjectPerformance = Object.values(subjectStatsMap).map((sub) => {
      if (sub.totalAttempted > 0) {
        sub.accuracy = parseFloat(
          ((sub.correctCount / sub.totalAttempted) * 100).toFixed(1)
        );
        if (sub.totalAttempted >= 5 && sub.accuracy >= 80) {
          sub.statusTag = 'STRONG';
        } else if (sub.totalAttempted >= 3 && sub.accuracy < 60) {
          sub.statusTag = 'NEEDS_FOCUS';
        } else {
          sub.statusTag = 'NORMAL';
        }
      }
      return sub;
    });

    // Filter Weak Areas
    const weakAreas = subjectPerformance.filter(
      (s) => s.statusTag === 'NEEDS_FOCUS'
    );

    // 4. Featured Today's Quiz
    const featuredQuiz = await prisma.quiz.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        quizType: true,
        duration: true,
        totalQuestions: true,
        totalMarks: true,
      },
    });

    // 5. Recent Activity (last 5 completed attempts)
    const recentActivity = await prisma.quizAttempt.findMany({
      where: { userId, status: 'COMPLETED' },
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: {
          select: {
            title: true,
            quizType: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: {
        todayProgress: {
          questionsAttempted: todayQuestions,
          correctAnswers: todayCorrect,
          accuracy: todayAccuracy,
          timeSpentSeconds: todayTimeSpentSeconds,
        },
        streak,
        subjectPerformance,
        weakAreas,
        featuredQuiz,
        recentActivity: recentActivity.map((a) => ({
          attemptId: a.id,
          quizTitle: a.quiz?.title || 'Practice Quiz',
          quizType: a.quiz?.quizType || 'DAILY',
          score: a.score,
          maxScore: a.maxScore,
          accuracy: a.accuracy,
          timeSpentSeconds: a.timeSpentSeconds,
          completedAt: a.completedAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
