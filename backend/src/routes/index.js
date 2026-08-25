const { Router } = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const examsRouter = require('./exams');
const subjectsRouter = require('./subjects');
const adminRouter = require('./admin');

const quizzesRouter = require('./quizzes');
const usersRouter = require('./users');
const subscriptionsRouter = require('./subscriptions');
const revisionRouter = require('./revision');
const analyticsRouter = require('./analytics');

const router = Router();

// ─── Mount sub-routers ────────────────────────────────────────────────────────
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/exams', examsRouter);
router.use('/subjects', subjectsRouter);
router.use('/admin', adminRouter);
router.use('/quizzes', quizzesRouter);
router.use('/users', usersRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/revision', revisionRouter);
router.use('/analytics', analyticsRouter);

// More routes will be mounted here in later phases:
// router.use('/users', usersRouter);
// router.use('/questions', questionsRouter);

module.exports = router;
