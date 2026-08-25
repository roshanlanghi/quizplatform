const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * GET /api/exams
 * Returns all active exams with their exam stages.
 */
router.get('/', async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { isActive: true },
      include: {
        stages: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      status: 'success',
      data: {
        exams,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
