const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

const router = express.Router();

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return next(new AppError('An account with this email already exists.', 409));
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'STUDENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      const token = signToken({ id: user.id, role: user.role });

      res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
          user,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return next(new AppError('Invalid email or password.', 401));
      }

      if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 403));
      }

      const token = signToken({ id: user.id, role: user.role });

      const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };

      res.json({
        status: 'success',
        message: 'Logged in successfully',
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

module.exports = router;
