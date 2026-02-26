/**
 * Stripe Controller
 * Handles subscription and payment management
 */

import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';
import Stripe from 'stripe';

// Initialize Stripe only if API key is present (for webhook signature verification)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
}

export class StripeController {
  /**
   * POST /api/stripe/create-subscription
   * Create subscription
   */
  static async createSubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { plan, paymentMethodId } = req.body;

      if (!plan || !['basic', 'plus'].includes(plan)) {
        return res.status(400).json({
          error: 'InvalidPlan',
          message: 'Plan must be either "basic" or "plus"',
        });
      }

      const result = await StripeService.createSubscription(userId, plan, paymentMethodId);

      return res.json({
        success: true,
        subscriptionId: result.subscriptionId,
        clientSecret: result.clientSecret,
        status: result.status,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'CreateSubscriptionFailed',
        message: error.message || 'Failed to create subscription',
      });
    }
  }

  /**
   * POST /api/stripe/cancel-subscription
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const result = await StripeService.cancelSubscription(userId);

      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of billing period',
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'CancelSubscriptionFailed',
        message: error.message || 'Failed to cancel subscription',
      });
    }
  }

  /**
   * POST /api/stripe/resume-subscription
   * Resume cancelled subscription
   */
  static async resumeSubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      await StripeService.resumeSubscription(userId);

      res.json({
        success: true,
        message: 'Subscription resumed successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'ResumeSubscriptionFailed',
        message: error.message || 'Failed to resume subscription',
      });
    }
  }

  /**
   * POST /api/stripe/change-plan
   * Change subscription plan
   */
  static async changePlan(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { plan } = req.body;

      if (!plan || !['basic', 'plus'].includes(plan)) {
        return res.status(400).json({
          error: 'InvalidPlan',
          message: 'Plan must be either "basic" or "plus"',
        });
      }

      await StripeService.changeSubscriptionPlan(userId, plan);

      res.json({
        success: true,
        message: 'Plan changed successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'ChangePlanFailed',
        message: error.message || 'Failed to change plan',
      });
    }
  }

  /**
   * POST /api/stripe/add-payment-method
   * Add payment method
   */
  static async addPaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({
          error: 'MissingPaymentMethod',
          message: 'Payment method ID is required',
        });
      }

      await StripeService.addPaymentMethod(userId, paymentMethodId);

      res.json({
        success: true,
        message: 'Payment method added successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'AddPaymentMethodFailed',
        message: error.message || 'Failed to add payment method',
      });
    }
  }

  /**
   * POST /api/stripe/set-default-payment-method
   * Set default payment method
   */
  static async setDefaultPaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { paymentMethodId } = req.body;

      if (!paymentMethodId) {
        return res.status(400).json({
          error: 'MissingPaymentMethod',
          message: 'Payment method ID is required',
        });
      }

      await StripeService.setDefaultPaymentMethod(userId, paymentMethodId);

      res.json({
        success: true,
        message: 'Default payment method updated',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'SetDefaultFailed',
        message: error.message || 'Failed to set default payment method',
      });
    }
  }

  /**
   * DELETE /api/stripe/payment-method/:paymentMethodId
   * Remove payment method
   */
  static async removePaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { paymentMethodId } = req.params;

      await StripeService.removePaymentMethod(userId, paymentMethodId);

      res.json({
        success: true,
        message: 'Payment method removed successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'RemovePaymentMethodFailed',
        message: error.message || 'Failed to remove payment method',
      });
    }
  }

  /**
   * GET /api/stripe/payment-methods
   * Get all payment methods
   */
  static async getPaymentMethods(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const paymentMethods = await StripeService.getPaymentMethods(userId);

      res.json({
        success: true,
        paymentMethods,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetPaymentMethodsFailed',
        message: 'Failed to retrieve payment methods',
      });
    }
  }

  /**
   * GET /api/stripe/subscription
   * Get subscription details
   */
  static async getSubscription(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const subscription = await StripeService.getSubscription(userId);

      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'GetSubscriptionFailed',
        message: 'Failed to retrieve subscription',
      });
    }
  }

  /**
   * POST /api/stripe/webhook
   * Handle Stripe webhooks
   */
  static async webhook(req: Request, res: Response) {
    try {
      if (!stripe) {
        return res.status(500).json({
          error: 'StripeNotConfigured',
          message: 'Stripe is not configured',
        });
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      await StripeService.handleWebhook(event);

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      res.status(500).json({
        error: 'WebhookFailed',
        message: 'Failed to process webhook',
      });
    }
  }
}
