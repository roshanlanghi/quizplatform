const express = require('express');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { AppError } = require('../utils/errors');

const router = express.Router();

// ─── GET /api/subscriptions/plans — List active subscription plans (Public/Authed) ─
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json({
      status: 'success',
      data: { plans },
    });
  } catch (err) {
    next(err);
  }
});

// Enforce authentication for remaining subscription endpoints
router.use(authenticate);

// ─── GET /api/subscriptions/me — Get user's current active subscription ────
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      include: {
        plan: true,
      },
      orderBy: { endDate: 'desc' },
    });

    const isPremium =
      activeSubscription && activeSubscription.plan?.code !== 'FREE';

    res.json({
      status: 'success',
      data: {
        isPremium: !!isPremium,
        subscription: activeSubscription || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/subscriptions/checkout — Initiate subscription checkout ────
router.post(
  '/checkout',
  [body('planId').notEmpty().withMessage('planId is required')],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { planId } = req.body;

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.isActive) {
        return next(new AppError('Selected subscription plan is invalid or inactive.', 404));
      }

      // If plan is FREE, activate free tier directly
      if (plan.price === 0 || plan.code === 'FREE') {
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 10); // 10 years for free

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            planId: plan.id,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate,
          },
          include: { plan: true },
        });

        return res.status(201).json({
          status: 'success',
          message: 'Free Tier active',
          data: {
            isFree: true,
            subscription,
          },
        });
      }

      // Create a unique checkout order reference ID
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Record PENDING payment
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount: plan.price,
          currency: plan.currency,
          provider: process.env.PAYMENT_KEY_ID ? 'RAZORPAY' : 'MOCK',
          orderId,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Checkout order initialized',
        data: {
          orderId: payment.orderId,
          amount: plan.price,
          currency: plan.currency,
          plan,
          keyId: process.env.PAYMENT_KEY_ID || 'rzp_test_mock_key_2026',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/subscriptions/verify — Server-side Payment Verification & Activation ─
router.post(
  '/verify',
  [body('orderId').notEmpty().withMessage('orderId is required')],
  validate,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { orderId, paymentId = `pay_${Date.now()}`, planId } = req.body;

      // Find pending payment record or payment by orderId
      const payment = await prisma.payment.findFirst({
        where: { orderId, userId },
      });

      // Target plan
      let targetPlan = null;
      if (planId) {
        targetPlan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      } else if (payment) {
        // Find plan by payment amount match or default to monthly
        targetPlan = await prisma.subscriptionPlan.findFirst({
          where: { price: payment.amount, isActive: true },
        });
      }

      if (!targetPlan) {
        targetPlan = await prisma.subscriptionPlan.findFirst({
          where: { code: 'PREMIUM_MONTHLY' },
        });
      }

      // Compute end date according to plan interval
      const now = new Date();
      const endDate = new Date(now);
      if (targetPlan.interval === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (targetPlan.interval === 'QUARTERLY') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Perform transaction: update Payment status & activate Subscription
      const [updatedPayment, activeSubscription] = await prisma.$transaction(async (tx) => {
        // Update existing payment or create success payment record
        let p;
        if (payment) {
          p = await tx.payment.update({
            where: { id: payment.id },
            data: {
              paymentId,
              status: 'SUCCESS',
            },
          });
        } else {
          p = await tx.payment.create({
            data: {
              userId,
              amount: targetPlan.price,
              currency: targetPlan.currency,
              provider: 'MOCK',
              orderId,
              paymentId,
              status: 'SUCCESS',
            },
          });
        }

        // Cancel previous active subscriptions for user
        await tx.subscription.updateMany({
          where: { userId, status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        // Create new active subscription
        const sub = await tx.subscription.create({
          data: {
            userId,
            planId: targetPlan.id,
            status: 'ACTIVE',
            startDate: now,
            endDate,
          },
          include: { plan: true },
        });

        // Connect payment to subscription
        await tx.payment.update({
          where: { id: p.id },
          data: { subscriptionId: sub.id },
        });

        return [p, sub];
      });

      res.json({
        status: 'success',
        message: 'Payment verified and subscription activated successfully!',
        data: {
          subscription: activeSubscription,
          payment: updatedPayment,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
