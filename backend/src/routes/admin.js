const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { AppError } = require('../utils/errors');
const { extractText } = require('../services/pdfExtract');
const { extractQuestionsFromText } = require('../services/aiExtract');
const { validateBatch } = require('../services/questionValidator');
const { filterDuplicates } = require('../services/duplicateDetect');
const { generateAiQuestions } = require('../services/aiQuestionGenerator');

const router = express.Router();

// ─── Multer configuration for secure PDF / image upload ─────────────────────

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'papers');

// Ensure upload directory exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Server-generated filename — never trust original name
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `paper_${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_MIME_TYPES.includes(file.mimetype) ||
    ALLOWED_EXTENSIONS.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOCX, DOC, TXT, JPG, and PNG files are allowed.',
        422
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
});

// ─── Enforce Admin Authorization on all routes ──────────────────────────────
router.use(authenticate, authorize('ADMIN'));

// ─── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeStudents,
      totalQuestions,
      approvedQuestions,
      pendingQuestions,
      aiQuestions,
      totalSubjects,
      totalPapers,
      totalQuizzes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.question.count(),
      prisma.question.count({ where: { status: 'APPROVED' } }),
      prisma.question.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.question.count({ where: { aiGenerated: true } }),
      prisma.subject.count(),
      prisma.paper.count(),
      prisma.quiz.count(),
    ]);

    res.json({
      status: 'success',
      data: {
        totalUsers,
        activeStudents,
        totalQuestions,
        approvedQuestions,
        pendingQuestions,
        aiQuestions,
        totalSubjects,
        totalPapers,
        totalQuizzes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── SUBJECTS API ─────────────────────────────────────────────────────────────

// CREATE Subject
router.post(
  '/subjects',
  [
    body('name').trim().notEmpty().withMessage('Subject name is required'),
    body('code').trim().notEmpty().withMessage('Subject code is required').toUpperCase(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, code, description, icon } = req.body;

      const existing = await prisma.subject.findFirst({
        where: { OR: [{ name }, { code }] },
      });

      if (existing) {
        return next(new AppError('A subject with this name or code already exists.', 409));
      }

      const subject = await prisma.subject.create({
        data: { name, code, description, icon },
      });

      res.status(201).json({
        status: 'success',
        message: 'Subject created successfully',
        data: { subject },
      });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE Subject
router.patch(
  '/subjects/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Subject name cannot be empty'),
    body('code').optional().trim().notEmpty().toUpperCase(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, code, description, icon } = req.body;

      const subject = await prisma.subject.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          ...(description !== undefined && { description }),
          ...(icon !== undefined && { icon }),
        },
      });

      res.json({
        status: 'success',
        message: 'Subject updated successfully',
        data: { subject },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE Subject
router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });

    res.json({
      status: 'success',
      message: 'Subject deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// ─── TOPICS API ───────────────────────────────────────────────────────────────

// CREATE Topic
router.post(
  '/topics',
  [
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('name').trim().notEmpty().withMessage('Topic name is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { subjectId, name, description } = req.body;

      const topic = await prisma.topic.create({
        data: { subjectId, name, description },
      });

      res.status(201).json({
        status: 'success',
        message: 'Topic created successfully',
        data: { topic },
      });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE Topic
router.patch(
  '/topics/:id',
  [body('name').optional().trim().notEmpty().withMessage('Topic name cannot be empty')],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const topic = await prisma.topic.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      res.json({
        status: 'success',
        message: 'Topic updated successfully',
        data: { topic },
      });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE Topic
router.delete('/topics/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id } });

    res.json({
      status: 'success',
      message: 'Topic deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// ─── QUESTIONS MANAGEMENT API ──────────────────────────────────────────────────

// GET Questions Listing
router.get('/questions', async (req, res, next) => {
  try {
    const { status, subjectId, aiGenerated, page = 1, limit = 20 } = req.query;

    const where = {
      ...(status && { status }),
      ...(subjectId && { subjectId }),
      ...(aiGenerated !== undefined && { aiGenerated: aiGenerated === 'true' }),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true } },
          options: true,
          source: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        questions,
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

// GET Single Question by ID
router.get('/questions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        subject: true,
        topic: true,
        exam: true,
        stage: true,
        paper: true,
        options: true,
        source: true,
      },
    });

    if (!question) {
      return next(new AppError('Question not found.', 404));
    }

    res.json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    next(err);
  }
});

// CREATE Question
router.post(
  '/questions',
  [
    body('questionText').trim().notEmpty().withMessage('Question text is required'),
    body('correctOption').isIn(['A', 'B', 'C', 'D']).withMessage('Correct option must be A, B, C, or D'),
    body('subjectId').notEmpty().withMessage('Subject is required'),
    body('examId').notEmpty().withMessage('Exam is required'),
    body('stageId').notEmpty().withMessage('Exam Stage is required'),
    body('options').isObject().withMessage('Options object (A, B, C, D) is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        questionText,
        options, // { A: "...", B: "...", C: "...", D: "..." }
        correctOption,
        explanation,
        examId,
        stageId,
        paperId,
        subjectId,
        topicId,
        year,
        difficulty = 'MEDIUM',
        language = 'MARATHI',
        status = 'APPROVED', // Default to APPROVED for manual admin entry
        sourceType = 'PYQ',
        aiGenerated = false,
        allowDuplicate = false,
      } = req.body;

      // Validate 4 options present
      if (!options.A || !options.B || !options.C || !options.D) {
        return next(new AppError('All four options (A, B, C, D) must be provided.', 422));
      }

      // Duplicate Check
      const normalizedText = questionText.trim().toLowerCase();
      const existing = await prisma.question.findFirst({
        where: {
          questionText: {
            equals: questionText.trim(),
            mode: 'insensitive',
          },
        },
      });

      if (existing && !allowDuplicate) {
        return res.status(409).json({
          status: 'fail',
          message: 'A duplicate question with identical text already exists in the question bank.',
          duplicate: true,
          existingQuestionId: existing.id,
        });
      }

      // Create Question & Options transaction
      const question = await prisma.question.create({
        data: {
          questionText: questionText.trim(),
          explanation: explanation ? explanation.trim() : null,
          correctOption,
          difficulty,
          language,
          status,
          aiGenerated,
          year: year ? parseInt(year) : null,
          examId,
          stageId,
          paperId: paperId || null,
          subjectId,
          topicId: topicId || null,
          options: {
            create: [
              { optionKey: 'A', optionText: options.A.trim() },
              { optionKey: 'B', optionText: options.B.trim() },
              { optionKey: 'C', optionText: options.C.trim() },
              { optionKey: 'D', optionText: options.D.trim() },
            ],
          },
          source: {
            create: {
              sourceType,
              examName: 'MPSC Group C',
              year: year ? parseInt(year) : null,
            },
          },
        },
        include: {
          options: true,
          subject: true,
          topic: true,
          source: true,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Question added to question bank successfully',
        data: { question },
      });
    } catch (err) {
      next(err);
    }
  }
);

// UPDATE Question
router.patch('/questions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      questionText,
      options,
      correctOption,
      explanation,
      subjectId,
      topicId,
      difficulty,
      language,
      status,
      year,
    } = req.body;

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Question not found.', 404));
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(questionText && { questionText: questionText.trim() }),
        ...(explanation !== undefined && { explanation: explanation ? explanation.trim() : null }),
        ...(correctOption && { correctOption }),
        ...(subjectId && { subjectId }),
        ...(topicId !== undefined && { topicId: topicId || null }),
        ...(difficulty && { difficulty }),
        ...(language && { language }),
        ...(status && { status }),
        ...(year !== undefined && { year: year ? parseInt(year) : null }),
      },
      include: {
        options: true,
        subject: true,
        topic: true,
        source: true,
      },
    });

    // Update options if provided
    if (options && typeof options === 'object') {
      const optionKeys = ['A', 'B', 'C', 'D'];
      for (const key of optionKeys) {
        if (options[key]) {
          await prisma.questionOption.upsert({
            where: {
              questionId_optionKey: {
                questionId: id,
                optionKey: key,
              },
            },
            update: { optionText: options[key].trim() },
            create: {
              questionId: id,
              optionKey: key,
              optionText: options[key].trim(),
            },
          });
        }
      }
    }

    res.json({
      status: 'success',
      message: 'Question updated successfully',
      data: { question: updated },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE Question
router.delete('/questions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });

    res.json({
      status: 'success',
      message: 'Question deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// APPROVE Question Workflow
router.post('/questions/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    res.json({
      status: 'success',
      message: 'Question approved successfully',
      data: { question },
    });
  } catch (err) {
    next(err);
  }
});

// REJECT Question Workflow
router.post('/questions/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    res.json({
      status: 'success',
      message: 'Question rejected',
      data: { question },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PAPERS API ───────────────────────────────────────────────────────────────

// GET /api/admin/papers — list all papers
router.get('/papers', async (req, res, next) => {
  try {
    const papers = await prisma.paper.findMany({
      include: {
        exam: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { year: 'desc' },
    });

    res.json({
      status: 'success',
      data: { papers },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/papers/:id — fetch single paper
router.get('/papers/:id', async (req, res, next) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: req.params.id },
      include: {
        exam: true,
        stage: true,
        _count: { select: { questions: true } },
      },
    });

    if (!paper) return next(new AppError('Paper not found.', 404));

    res.json({ status: 'success', data: { paper } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/papers/:id/file — stream the stored paper file securely
router.get('/papers/:id/file', async (req, res, next) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: req.params.id },
      select: { fileUrl: true, mimeType: true, title: true },
    });

    if (!paper) return next(new AppError('Paper not found.', 404));
    if (!paper.fileUrl) return next(new AppError('No file attached to this paper.', 404));

    const filePath = path.join(__dirname, '..', '..', paper.fileUrl);

    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found on server. It may have been deleted.', 404));
    }

    const mimeType = paper.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(paper.title || 'paper')}"`);
    // Stream file — do NOT use res.sendFile with absolute path; use pipe for security
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => next(new AppError('Failed to read file.', 500)));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/papers/upload — upload question paper PDF/image
router.post(
  '/papers/upload',
  upload.fields([
    { name: 'paperFile', maxCount: 1 },
    { name: 'answerKeyFile', maxCount: 1 },
  ]),
  [
    body('examId').notEmpty().withMessage('Exam is required'),
    body('stageId').notEmpty().withMessage('Exam stage is required'),
    body('year')
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage('Valid year is required'),
    body('title').trim().notEmpty().withMessage('Paper title is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { examId, stageId, year, title, language, totalMarks, duration } = req.body;

      const paperFile = req.files?.paperFile?.[0];
      const answerKeyFile = req.files?.answerKeyFile?.[0];

      if (!paperFile) {
        return next(new AppError('A question paper file (PDF, DOCX, DOC, TXT, or image) is required.', 422));
      }

      // Verify exam and stage exist
      const [exam, stage] = await Promise.all([
        prisma.exam.findUnique({ where: { id: examId } }),
        prisma.examStage.findUnique({ where: { id: stageId } }),
      ]);

      if (!exam) return next(new AppError('Selected exam does not exist.', 404));
      if (!stage) return next(new AppError('Selected exam stage does not exist.', 404));

      // Relative paths stored in DB (not absolute, not public URL for now)
      const fileUrl = path.relative(
        path.join(__dirname, '..', '..'),
        paperFile.path
      ).replace(/\\/g, '/');

      const answerKeyUrl = answerKeyFile
        ? path.relative(
            path.join(__dirname, '..', '..'),
            answerKeyFile.path
          ).replace(/\\/g, '/')
        : null;

      const paper = await prisma.paper.create({
        data: {
          examId,
          stageId,
          year: parseInt(year),
          title: title.trim(),
          language: language || 'MARATHI',
          fileUrl,
          answerKeyUrl,
          fileSize: paperFile.size,
          mimeType: paperFile.mimetype,
          processingStatus: 'PENDING',
          totalMarks: totalMarks ? parseInt(totalMarks) : 100,
          duration: duration ? parseInt(duration) : 60,
        },
        include: {
          exam: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true } },
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Question paper uploaded successfully. Status: PENDING review.',
        data: { paper },
      });
    } catch (err) {
      // Clean up uploaded files if DB creation fails
      if (req.files?.paperFile?.[0]?.path) {
        fs.unlink(req.files.paperFile[0].path, () => {});
      }
      if (req.files?.answerKeyFile?.[0]?.path) {
        fs.unlink(req.files.answerKeyFile[0].path, () => {});
      }
      next(err);
    }
  }
);

// DELETE /api/admin/papers/:id — delete paper and its stored file
router.delete('/papers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const paper = await prisma.paper.findUnique({ where: { id } });
    if (!paper) return next(new AppError('Paper not found.', 404));

    // Delete stored file(s) from disk
    if (paper.fileUrl) {
      const filePath = path.join(__dirname, '..', '..', paper.fileUrl);
      fs.unlink(filePath, () => {}); // Non-blocking; ignore error if already gone
    }
    if (paper.answerKeyUrl) {
      const keyPath = path.join(__dirname, '..', '..', paper.answerKeyUrl);
      fs.unlink(keyPath, () => {});
    }

    await prisma.paper.delete({ where: { id } });

    res.json({
      status: 'success',
      message: 'Paper deleted successfully',
    });
  } catch (err) {
    next(err);
  }
});

// ─── PAPER PROCESSING ───────────────────────────────────────────────────────────────

// POST /api/admin/papers/:id/process
// Triggers background AI extraction pipeline. Returns 202 immediately.
router.post('/papers/:id/process', async (req, res, next) => {
  try {
    const { id } = req.params;

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        exam: { select: { name: true } },
        stage: { select: { name: true } },
      },
    });

    if (!paper) return next(new AppError('Paper not found.', 404));

    if (paper.processingStatus === 'PROCESSING') {
      return res.status(409).json({
        status: 'fail',
        message: 'This paper is already being processed.',
      });
    }

    if (!paper.fileUrl) {
      return next(new AppError('No file is attached to this paper.', 422));
    }

    // Immediately update status to PROCESSING and respond 202
    await prisma.paper.update({
      where: { id },
      data: { processingStatus: 'PROCESSING' },
    });

    res.status(202).json({
      status: 'success',
      message: 'Processing started. Check paper status for updates.',
    });

    // ── Background pipeline (detached async) ─────────────────────────────────
    // NOTE: In a real production system this would use a job queue (BullMQ/Redis).
    // For MVP this detached async call is acceptable per the master plan.
    setImmediate(async () => {
      const filePath = path.join(__dirname, '..', '..', paper.fileUrl);
      const processingLog = [];
      let extractedCount = 0;
      let skippedCount = 0;
      let duplicateCount = 0;

      try {
        // Step 1: Extract text
        processingLog.push('Extracting text from file...');
        const extracted = await extractText(filePath, paper.mimeType || 'application/pdf');

        // Step 2: AI extraction
        processingLog.push('Sending to AI for question extraction...');
        const rawQuestions = await extractQuestionsFromText({
          ...extracted,
          metadata: {
            examName: paper.exam?.name || 'MPSC Group C',
            stageName: paper.stage?.name || 'Prelims',
            year: paper.year,
            language: paper.language,
          },
        });
        processingLog.push(`AI returned ${rawQuestions.length} raw question(s).`);

        // Step 3: Validate
        const { valid, invalid } = validateBatch(rawQuestions);
        processingLog.push(`Validation: ${valid.length} valid, ${invalid.length} invalid.`);
        skippedCount = invalid.length;

        // Step 4: Deduplicate
        const { unique, duplicates } = await filterDuplicates(valid);
        processingLog.push(`Deduplication: ${unique.length} unique, ${duplicates.length} duplicate(s) skipped.`);
        duplicateCount = duplicates.length;

        // Step 5: Resolve subject and topic IDs from names
        const subjects = await prisma.subject.findMany({ include: { topics: true } });
        const defaultSubjectId = subjects[0]?.id || null;

        const findSubjectId = (name) => {
          if (!name) return defaultSubjectId;
          const lower = name.toLowerCase();
          for (const s of subjects) {
            const sName = s.name.toLowerCase();
            if (sName === lower || lower.includes(sName) || sName.includes(lower)) {
              return s.id;
            }
          }
          if (/polity|constitution|राजशास्त्र|राज्यशास्त्र|संविधान/i.test(lower)) {
            const match = subjects.find((s) => /polity/i.test(s.name));
            if (match) return match.id;
          }
          if (/history|इतिहास/i.test(lower)) {
            const match = subjects.find((s) => /history/i.test(s.name));
            if (match) return match.id;
          }
          if (/geography|भूगोल/i.test(lower)) {
            const match = subjects.find((s) => /geography/i.test(s.name));
            if (match) return match.id;
          }
          if (/economy|economic|अर्थशास्त्र/i.test(lower)) {
            const match = subjects.find((s) => /economy/i.test(s.name));
            if (match) return match.id;
          }
          if (/science|विज्ञान/i.test(lower)) {
            const match = subjects.find((s) => /science/i.test(s.name));
            if (match) return match.id;
          }
          if (/math|arithmetic|गणित|अंकगणित/i.test(lower)) {
            const match = subjects.find((s) => /math/i.test(s.name));
            if (match) return match.id;
          }
          if (/reasoning|aptitude|बुद्धिमत्ता/i.test(lower)) {
            const match = subjects.find((s) => /reasoning/i.test(s.name));
            if (match) return match.id;
          }
          return defaultSubjectId;
        };

        // Step 6: Save to DB as PENDING_REVIEW
        processingLog.push(`Saving ${unique.length} question(s) as PENDING_REVIEW...`);
        for (const q of unique) {
          try {
            const subjectId = findSubjectId(q.subject);

            if (!subjectId) {
              skippedCount++;
              continue;
            }

            // Find topicId if available
            let topicId = null;
            if (q.topic) {
              const matchedSub = subjects.find((s) => s.id === subjectId);
              const matchedTopic = matchedSub?.topics.find(
                (t) => t.name.toLowerCase().includes(q.topic.toLowerCase()) || q.topic.toLowerCase().includes(t.name.toLowerCase())
              );
              if (matchedTopic) topicId = matchedTopic.id;
            }

            await prisma.question.create({
              data: {
                questionText: q.questionText,
                explanation: q.explanation || null,
                correctOption: q.correctAnswer || 'A',
                difficulty: q.difficulty,
                language: q.language,
                status: 'PENDING_REVIEW',
                aiGenerated: false, // extracted from real PYQ
                aiConfidence: null,
                year: paper.year,
                examId: paper.examId,
                stageId: paper.stageId,
                paperId: paper.id,
                subjectId,
                topicId,
                options: {
                  create: [
                    { optionKey: 'A', optionText: q.options.A },
                    { optionKey: 'B', optionText: q.options.B },
                    { optionKey: 'C', optionText: q.options.C },
                    { optionKey: 'D', optionText: q.options.D },
                  ],
                },
                source: {
                  create: {
                    sourceType: 'PYQ',
                    examName: paper.exam?.name || 'MPSC Group C',
                    year: paper.year,
                    questionNumber: q.questionNumber || null,
                  },
                },
              },
            });
            extractedCount++;
          } catch (qErr) {
            console.error(`[AI Extract] Failed to save question:`, qErr.message);
            skippedCount++;
          }
        }

        // Step 7: Update paper status
        const finalStatus = extractedCount > 0 ? 'EXTRACTED' : 'FAILED';
        await prisma.paper.update({
          where: { id },
          data: { processingStatus: finalStatus },
        });

        console.log(
          `[AI Extract] Paper ${id} finished. Status: ${finalStatus}. ` +
          `Extracted: ${extractedCount}, Skipped: ${skippedCount}, Duplicates: ${duplicateCount}`
        );
      } catch (pipelineErr) {
        console.error(`[AI Extract] Pipeline failed for paper ${id}:`, pipelineErr.message);
        await prisma.paper.update({
          where: { id },
          data: { processingStatus: 'FAILED' },
        }).catch(() => {}); // best-effort
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/papers/:id/questions
// Returns all questions extracted from this paper.
router.get('/papers/:id/questions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    const paper = await prisma.paper.findUnique({ where: { id } });
    if (!paper) return next(new AppError('Paper not found.', 404));

    const where = {
      paperId: id,
      ...(status && { status }),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true } },
          topic: { select: { id: true, name: true } },
          options: true,
          source: true,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      status: 'success',
      data: {
        paper,
        questions,
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

// ─── AI QUIZ GENERATION API ──────────────────────────────────────────────────

// POST /api/admin/ai/generate-quiz
// Generates a quiz mixing authentic PYQs and AI-generated practice questions.
router.post(
  '/ai/generate-quiz',
  [
    body('subjectId').notEmpty().withMessage('Subject ID is required'),
    body('questionCount')
      .isInt({ min: 5, max: 50 })
      .withMessage('Question count must be between 5 and 50'),
    body('pyqRatio')
      .isInt({ min: 0, max: 100 })
      .withMessage('PYQ ratio must be a percentage between 0 and 100'),
    body('difficulty')
      .isIn(['EASY', 'MEDIUM', 'HARD'])
      .withMessage('Difficulty must be EASY, MEDIUM, or HARD'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        subjectId,
        topicId,
        questionCount = 10,
        pyqRatio = 70,
        difficulty = 'MEDIUM',
        language = 'MARATHI',
        title,
        duration = 15,
      } = req.body;

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: { topics: true },
      });

      if (!subject) {
        return next(new AppError('Selected subject does not exist.', 404));
      }

      let topicName = null;
      if (topicId) {
        const topic = subject.topics.find((t) => t.id === topicId);
        if (topic) topicName = topic.name;
      }

      // Calculate target split
      const totalCount = parseInt(questionCount);
      const targetPyqCount = Math.round(totalCount * (parseInt(pyqRatio) / 100));
      const targetAiCount = totalCount - targetPyqCount;

      // 1. Fetch available approved PYQs
      const pyqWhere = {
        subjectId,
        status: 'APPROVED',
        ...(topicId && { topicId }),
      };

      const candidatePyqs = await prisma.question.findMany({
        where: pyqWhere,
        select: { id: true },
      });

      // Pick up to targetPyqCount
      const shuffledPyqs = candidatePyqs.sort(() => 0.5 - Math.random());
      const selectedPyqIds = shuffledPyqs.slice(0, targetPyqCount).map((q) => q.id);

      // Adjust AI count if PYQs fell short
      const actualPyqCount = selectedPyqIds.length;
      const actualAiCount = totalCount - actualPyqCount;

      // 2. Generate AI Questions for the remaining portion
      const createdAiQuestionIds = [];

      if (actualAiCount > 0) {
        // Fetch Exam & Stage for DB relation
        const exam = await prisma.exam.findFirst();
        const stage = await prisma.examStage.findFirst();

        if (!exam || !stage) {
          return next(new AppError('No exam or stage found in system.', 400));
        }

        const rawAiQuestions = await generateAiQuestions({
          subjectName: subject.name,
          topicName,
          difficulty,
          language,
          count: actualAiCount,
        });

        // Insert AI questions into DB explicitly labeled as aiGenerated: true & sourceType: 'AI_GENERATED'
        for (const q of rawAiQuestions) {
          try {
            const created = await prisma.question.create({
              data: {
                questionText: q.questionText,
                explanation: q.explanation || null,
                correctOption: q.correctAnswer || 'A',
                difficulty: q.difficulty || difficulty,
                language: q.language || language,
                status: 'APPROVED', // Auto-approved for practice quiz engine
                aiGenerated: true, // EXPLICIT AI LABELING
                aiConfidence: 0.95,
                examId: exam.id,
                stageId: stage.id,
                subjectId: subject.id,
                topicId: topicId || null,
                options: {
                  create: [
                    { optionKey: 'A', optionText: q.options.A },
                    { optionKey: 'B', optionText: q.options.B },
                    { optionKey: 'C', optionText: q.options.C },
                    { optionKey: 'D', optionText: q.options.D },
                  ],
                },
                source: {
                  create: {
                    sourceType: 'AI_GENERATED', // EXPLICIT AI SOURCE TYPE
                    examName: 'AI Practice Generator',
                  },
                },
              },
            });
            createdAiQuestionIds.push(created.id);
          } catch (qErr) {
            console.error('[AI Quiz Gen] Error saving question:', qErr.message);
          }
        }
      }

      const allQuestionIds = [...selectedPyqIds, ...createdAiQuestionIds];

      if (allQuestionIds.length === 0) {
        return next(
          new AppError(
            'Failed to gather or generate questions for this quiz.',
            500
          )
        );
      }

      // 3. Package into a new Quiz record
      const quizTitle =
        title ||
        `AI Hybrid Quiz — ${subject.name} (${actualPyqCount} PYQ / ${createdAiQuestionIds.length} AI)`;

      const quiz = await prisma.quiz.create({
        data: {
          title: quizTitle,
          description: `AI-generated practice quiz with ${actualPyqCount} PYQs and ${createdAiQuestionIds.length} AI practice questions.`,
          quizType: 'DAILY',
          duration: parseInt(duration),
          totalQuestions: allQuestionIds.length,
          totalMarks: allQuestionIds.length,
          quizQuestions: {
            create: allQuestionIds.map((qId, idx) => ({
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
        message: 'AI Quiz generated successfully',
        data: {
          quiz,
          breakdown: {
            totalQuestions: allQuestionIds.length,
            pyqCount: actualPyqCount,
            aiGeneratedCount: createdAiQuestionIds.length,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

