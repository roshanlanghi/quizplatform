const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/analytics/detailed — In-depth Performance & Accuracy Analytics ─
router.get('/detailed', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all completed attempts and user answers with question details
    const userAnswers = await prisma.quizAnswer.findMany({
      where: {
        attempt: {
          userId,
          status: 'COMPLETED',
        },
      },
      include: {
        question: {
          include: {
            subject: { select: { id: true, name: true } },
            topic: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 1. Difficulty Breakdown (EASY, MEDIUM, HARD)
    const difficultyMap = {
      EASY: { total: 0, correct: 0, accuracy: 0 },
      MEDIUM: { total: 0, correct: 0, accuracy: 0 },
      HARD: { total: 0, correct: 0, accuracy: 0 },
    };

    // 2. Topic-Level Performance Matrix
    const topicMap = {};

    let totalTimeSpent = 0;
    let answeredCountWithTime = 0;

    userAnswers.forEach((ans) => {
      const q = ans.question;
      if (!q) return;

      // Difficulty Stats
      const diff = q.difficulty || 'MEDIUM';
      if (difficultyMap[diff]) {
        difficultyMap[diff].total += 1;
        if (ans.isCorrect) difficultyMap[diff].correct += 1;
      }

      // Time Stats
      if (ans.timeSpentSeconds > 0) {
        totalTimeSpent += ans.timeSpentSeconds;
        answeredCountWithTime += 1;
      }

      // Topic Stats
      const topicKey = q.topicId || q.subjectId;
      const topicName = q.topic?.name || q.subject?.name || 'General';
      const subjectName = q.subject?.name || 'General';

      if (!topicMap[topicKey]) {
        topicMap[topicKey] = {
          topicId: topicKey,
          topicName,
          subjectName,
          totalAttempted: 0,
          correctCount: 0,
          accuracy: 0,
          statusTag: 'NORMAL',
        };
      }

      topicMap[topicKey].totalAttempted += 1;
      if (ans.isCorrect) {
        topicMap[topicKey].correctCount += 1;
      }
    });

    // Compute Difficulty Accuracies
    Object.keys(difficultyMap).forEach((d) => {
      const item = difficultyMap[d];
      item.accuracy =
        item.total > 0 ? parseFloat(((item.correct / item.total) * 100).toFixed(1)) : 0;
    });

    // Compute Topic Accuracies and Classify
    const topicPerformance = Object.values(topicMap).map((t) => {
      if (t.totalAttempted > 0) {
        t.accuracy = parseFloat(
          ((t.correctCount / t.totalAttempted) * 100).toFixed(1)
        );
        if (t.totalAttempted >= 5 && t.accuracy >= 80) {
          t.statusTag = 'STRONG';
        } else if (t.totalAttempted >= 3 && t.accuracy < 60) {
          t.statusTag = 'WEAK';
        } else {
          t.statusTag = 'NORMAL';
        }
      }
      return t;
    });

    const strongTopics = topicPerformance.filter((t) => t.statusTag === 'STRONG');
    const weakTopics = topicPerformance.filter((t) => t.statusTag === 'WEAK');

    const avgTimePerQuestion =
      answeredCountWithTime > 0
        ? parseFloat((totalTimeSpent / answeredCountWithTime).toFixed(1))
        : 0;

    res.json({
      status: 'success',
      data: {
        totalAnswersAnalyzed: userAnswers.length,
        difficultyBreakdown: difficultyMap,
        topicPerformance,
        summary: {
          strongTopicsCount: strongTopics.length,
          weakTopicsCount: weakTopics.length,
          strongTopics,
          weakTopics,
          avgTimePerQuestionSeconds: avgTimePerQuestion,
          totalPracticeTimeSeconds: totalTimeSpent,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
