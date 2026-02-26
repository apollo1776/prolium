/**
 * Stripe Routes
 * Subscription and payment management endpoints
 */

import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Subscription routes
router.post('/create-subscription', authMiddleware, StripeController.createSubscription);

router.post('/cancel-subscription', authMiddleware, StripeController.cancelSubscription);

router.post('/resume-subscription', authMiddleware, StripeController.resumeSubscription);

router.post('/change-plan', authMiddleware, StripeController.changePlan);

router.get('/subscription', authMiddleware, StripeController.getSubscription);

// Payment method routes
router.post('/add-payment-method', authMiddleware, StripeController.addPaymentMethod);

router.post('/set-default-payment-method', authMiddleware, StripeController.setDefaultPaymentMethod);

router.delete('/payment-method/:paymentMethodId', authMiddleware, StripeController.removePaymentMethod);

router.get('/payment-methods', authMiddleware, StripeController.getPaymentMethods);

// Webhook route (raw body needed for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), StripeController.webhook);

export default router;
