⚠️/**
 * Stripe Payment Service
 * Handles subscriptions and payment methods
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe only if API key is present
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  });
} else {
  console.warn('⚠️  Stripe not configured. Payment features will be disabled.');
  console.warn('   To enable: Add STRIPE_SECRET_KEY to .env');
}

// Plan pricing (in cents)
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['1 platform connection', 'Basic analytics', '10 scheduled posts/month'],
  },
  basic: {
    id: 'price_basic_monthly', // Replace with actual Stripe Price ID
    name: 'Basic',
    price: 999, // $9.99
    features: ['3 platform connections', 'Advanced analytics', 'Unlimited posts', 'AI content suggestions'],
  },
  plus: {
    id: 'price_plus_monthly', // Replace with actual Stripe Price ID
    name: 'Plus',
    price: 1999, // $19.99
    features: ['Unlimited platforms', 'Team collaboration', 'Priority support', 'API access', 'Custom branding'],
  },
};

export class StripeService {
  /**
   * Check if Stripe is configured
   */
  private static checkStripeConfigured(): asserts stripe is Stripe {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to .env');
    }
  }

  /**
   * Create or get Stripe customer for user
   */
  static async getOrCreateCustomer(userId: string): Promise<string> {
    this.checkStripeConfigured();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if customer already exists
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: user.id,
      },
    });

    // Save customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create subscription for user
   */
  static async createSubscription(userId: string, plan: 'basic' | 'plus', paymentMethodId?: string) {
    if (plan === 'basic' && !PLANS.basic.id.startsWith('price_')) {
      throw new Error('Basic plan not configured in Stripe');
    }
    if (plan === 'plus' && !PLANS.plus.id.startsWith('price_')) {
      throw new Error('Plus plan not configured in Stripe');
    }

    const customerId = await this.getOrCreateCustomer(userId);

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PLANS[plan].id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription to database
    await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: PLANS[plan].id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
    };
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end (don't immediately revoke access)
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        status: stripeSubscription.status,
      },
    });

    return {
      success: true,
      endsAt: new Date(stripeSubscription.current_period_end * 1000),
    };
  }

  /**
   * Resume cancelled subscription
   */
  static async resumeSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, cancelAtPeriodEnd: true },
    });

    if (!subscription) {
      throw new Error('No subscription to resume');
    }

    // Resume subscription
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        status: stripeSubscription.status,
      },
    });

    return { success: true };
  }

  /**
   * Change subscription plan
   */
  static async changeSubscriptionPlan(userId: string, newPlan: 'basic' | 'plus') {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'trialing'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Update subscription item
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: PLANS[newPlan].id,
      }],
      proration_behavior: 'always_invoice', // Immediate proration
    });

    // Update database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { stripePriceId: PLANS[newPlan].id },
    });

    return { success: true };
  }

  /**
   * Add payment method
   */
  static async addPaymentMethod(userId: string, paymentMethodId: string) {
    const customerId = await this.getOrCreateCustomer(userId);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Save to database
    await prisma.paymentMethod.create({
      data: {
        userId,
        stripePaymentMethodId: paymentMethodId,
        type: paymentMethod.type,
        last4: paymentMethod.card?.last4 || '',
        brand: paymentMethod.card?.brand || '',
        expiryMonth: paymentMethod.card?.exp_month || 0,
        expiryYear: paymentMethod.card?.exp_year || 0,
      },
    });

    return { success: true };
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    const customerId = await this.getOrCreateCustomer(userId);

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Update database - set all to non-default, then set this one as default
    await prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    await prisma.paymentMethod.updateMany({
      where: { userId, stripePaymentMethodId: paymentMethodId },
      data: { isDefault: true },
    });

    return { success: true };
  }

  /**
   * Remove payment method
   */
  static async removePaymentMethod(userId: string, paymentMethodId: string) {
    // Detach from Stripe
    await stripe.paymentMethods.detach(paymentMethodId);

    // Remove from database
    await prisma.paymentMethod.deleteMany({
      where: { userId, stripePaymentMethodId: paymentMethodId },
    });

    return { success: true };
  }

  /**
   * Get payment methods for user
   */
  static async getPaymentMethods(userId: string) {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return paymentMethods.map(pm => ({
      id: pm.stripePaymentMethodId,
      type: pm.type,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      isDefault: pm.isDefault,
    }));
  }

  /**
   * Get subscription details
   */
  static async getSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        plan: 'free',
        status: 'active',
        features: PLANS.free.features,
      };
    }

    // Determine plan from price ID
    let planName = 'free';
    if (subscription.stripePriceId === PLANS.basic.id) planName = 'basic';
    if (subscription.stripePriceId === PLANS.plus.id) planName = 'plus';

    return {
      plan: planName,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: PLANS[planName as keyof typeof PLANS].features,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscription(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Update payment status
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle failed payment - notify user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Sync subscription status from Stripe
   */
  private static async syncSubscription(stripeSubscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!dbSubscription) return;

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });
  }
}
