const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

/**
 * GET /api/subjects
 * Returns all subjects with their associated topics.
 */
router.get('/', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      status: 'success',
      data: {
        subjects,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
