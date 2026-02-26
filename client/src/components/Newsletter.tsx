
import React, { useState } from 'react';
import {
  Mail,
  Users,
  Send,
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  Copy,
  Plus,
  X,
  FileText,
  BarChart3,
  Filter,
  Search,
  Download,
  UserPlus,
  UserMinus,
  Zap,
  Target,
  Layout,
  Sparkles,
  Code,
  Monitor,
  Smartphone
} from 'lucide-react';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  previewText: string;
  status: 'draft' | 'scheduled' | 'sent';
  sentDate?: string;
  scheduledFor?: string;
  recipients: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  template: string;
  htmlContent: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribedAt: string;
  tags: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  htmlContent: string;
}

// Real HTML Email Templates
const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce new features or products',
    category: 'announcement',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Product Launch</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Introducing Prolium 2.0</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">The Future of Creator Analytics</h2>
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We're excited to announce Prolium 2.0 - a complete redesign with powerful new features to help creators grow faster than ever.
              </p>
              <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                <li>AI-powered content suggestions</li>
                <li>Real-time collaboration tools</li>
                <li>Advanced analytics dashboard</li>
                <li>Multi-platform scheduling</li>
              </ul>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <a href="#" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Get Started</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">© 2026 Prolium. All rights reserved.</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                <a href="#" style="color: #667eea; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: #667eea; text-decoration: none;">View in browser</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'weekly-newsletter',
    name: 'Weekly Newsletter',
    description: 'Regular content updates',
    category: 'content',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; background-color: #000000;">
              <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: bold;">Weekly Tech Digest</h1>
              <p style="margin: 10px 0 0 0; color: #999999; font-size: 14px;">Issue #42 - February 6, 2026</p>
            </td>
          </tr>
          <!-- Featured Article -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 20px;">Featured: 5 AI Tools That Will Change Your Workflow</h2>
                <p style="margin: 0; color: #047857; font-size: 14px;">Discover the tools top creators are using to 10x their productivity.</p>
              </div>
              <!-- Article 1 -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">The Rise of AI Content Creation</h3>
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                  Artificial intelligence is transforming how creators produce content. Here's what you need to know.
                </p>
                <a href="#" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: bold;">Read more →</a>
              </div>
              <!-- Article 2 -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">Optimizing Your YouTube Strategy</h3>
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                  New algorithm changes mean it's time to rethink your approach. Here's our complete guide.
                </p>
                <a href="#" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: bold;">Read more →</a>
              </div>
              <!-- Article 3 -->
              <div style="margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 18px;">Community Spotlight</h3>
                <p style="margin: 0 0 15px 0; color: #666666; font-size: 15px; line-height: 1.6;">
                  Meet Sarah, who grew from 0 to 100K subscribers in 6 months using these strategies.
                </p>
                <a href="#" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: bold;">Read more →</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #000000; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #999999; font-size: 14px;">Thanks for reading!</p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                <a href="#" style="color: #10b981; text-decoration: none;">Unsubscribe</a> |
                <a href="#" style="color: #10b981; text-decoration: none;">Update preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'promotional',
    name: 'Promotional',
    description: 'Special offers and discounts',
    category: 'marketing',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef3c7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 30px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); text-align: center;">
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 36px; font-weight: bold;">🎉 Limited Time Offer!</h1>
              <p style="margin: 0; color: #ffffff; font-size: 18px;">50% OFF Premium Plans</p>
            </td>
          </tr>
          <!-- Countdown -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fffbeb;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold; text-transform: uppercase;">Offer ends in</p>
              <div style="display: inline-block;">
                <table role="presentation" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 15px 20px; background-color: #fbbf24; border-radius: 8px; margin: 0 5px;">
                      <div style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1;">23</div>
                      <div style="color: #ffffff; font-size: 12px; margin-top: 5px;">HOURS</div>
                    </td>
                    <td style="padding: 0 5px; color: #92400e; font-size: 24px; font-weight: bold;">:</td>
                    <td style="padding: 15px 20px; background-color: #fbbf24; border-radius: 8px; margin: 0 5px;">
                      <div style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1;">45</div>
                      <div style="color: #ffffff; font-size: 12px; margin-top: 5px;">MINUTES</div>
                    </td>
                    <td style="padding: 0 5px; color: #92400e; font-size: 24px; font-weight: bold;">:</td>
                    <td style="padding: 15px 20px; background-color: #fbbf24; border-radius: 8px; margin: 0 5px;">
                      <div style="color: #ffffff; font-size: 28px; font-weight: bold; line-height: 1;">12</div>
                      <div style="color: #ffffff; font-size: 12px; margin-top: 5px;">SECONDS</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 28px;">Upgrade to Premium Today</h2>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Get access to all premium features including advanced analytics, AI tools, and priority support.
              </p>
              <!-- Pricing -->
              <div style="display: inline-block; margin-bottom: 30px;">
                <div style="text-decoration: line-through; color: #999999; font-size: 18px; margin-bottom: 5px;">$99/month</div>
                <div style="color: #f59e0b; font-size: 48px; font-weight: bold;">$49<span style="font-size: 24px;">/month</span></div>
              </div>
              <!-- CTA Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);">
                    <a href="#" style="display: inline-block; padding: 20px 50px; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: bold;">Claim Your Discount</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px;">No credit card required • Cancel anytime</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #fef3c7; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">© 2026 Prolium. All rights reserved.</p>
              <p style="margin: 0; color: #92400e; font-size: 12px;">
                <a href="#" style="color: #f59e0b; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    description: 'Invite subscribers to events',
    category: 'event',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 50px 30px; text-align: center;">
                <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 32px; font-weight: bold;">You're Invited!</h1>
                <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Join us for an exclusive creator meetup</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Creator Summit 2026</h2>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Network with fellow creators, learn from industry experts, and discover the latest tools shaping the future of content creation.
              </p>
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; margin: 0 0 30px 0;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Date</div>
                      <div style="color: #333333; font-size: 16px; font-weight: bold;">March 15, 2026</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Time</div>
                      <div style="color: #333333; font-size: 16px; font-weight: bold;">2:00 PM - 6:00 PM PST</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Location</div>
                      <div style="color: #333333; font-size: 16px; font-weight: bold;">San Francisco Convention Center</div>
                    </td>
                  </tr>
                </table>
              </div>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);">
                    <a href="#" style="display: inline-block; padding: 18px 45px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Reserve Your Spot</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 14px;">© 2026 Prolium. All rights reserved.</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                <a href="#" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'simple-text',
    name: 'Simple Text',
    description: 'Clean text-only newsletter',
    category: 'minimal',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" style="width: 600px; border-collapse: collapse;">
          <tr>
            <td style="padding: 0 30px 30px 30px; border-bottom: 2px solid #000000;">
              <h1 style="margin: 0; color: #000000; font-size: 36px; font-weight: normal; font-family: Georgia, serif;">Creator's Digest</h1>
              <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, sans-serif;">Weekly insights for modern creators</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                Hello friend,
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                This week I've been thinking about the importance of authenticity in content creation. The best creators aren't the ones with the fanciest equipment or the most followers—they're the ones who show up consistently and share their genuine perspective.
              </p>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                Here are three things worth your attention this week:
              </p>
              <ol style="margin: 0 0 20px 20px; padding: 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                <li style="margin-bottom: 10px;">Why consistency beats perfection every time</li>
                <li style="margin-bottom: 10px;">The surprising power of showing your process</li>
                <li style="margin-bottom: 10px;">How to find your unique voice (hint: stop trying so hard)</li>
              </ol>
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.8; font-family: Georgia, serif;">
                Until next week,<br>
                <strong>The Prolium Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; font-family: Arial, sans-serif;">
                © 2026 Prolium · <a href="#" style="color: #666666; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },
  {
    id: 'welcome-series',
    name: 'Welcome Email',
    description: 'Onboard new subscribers',
    category: 'onboarding',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="padding: 50px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                <div style="font-size: 48px;">👋</div>
              </div>
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 32px; font-weight: bold;">Welcome to Prolium!</h1>
              <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.9;">We're excited to have you here</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Let's get you started</h2>
              <p style="margin: 0 0 30px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                You've just joined thousands of creators who are growing their audience with Prolium. Here's what you can do next:
              </p>
              <div style="margin-bottom: 20px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 18px;">Step 1: Connect Your Platforms</h3>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                  Link your YouTube, Instagram, and TikTok accounts to start tracking your growth.
                </p>
              </div>
              <div style="margin-bottom: 20px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 18px;">Step 2: Explore Your Dashboard</h3>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                  See all your analytics in one place with our beautiful, easy-to-use dashboard.
                </p>
              </div>
              <div style="margin-bottom: 30px; padding: 20px; background-color: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #6b21a8; font-size: 18px;">Step 3: Schedule Your Content</h3>
                <p style="margin: 0; color: #7c3aed; font-size: 14px; line-height: 1.6;">
                  Use our AI-powered scheduler to post at the perfect time for your audience.
                </p>
              </div>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <a href="#" style="display: inline-block; padding: 18px 45px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Get Started Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px;">Need help? We're here for you.</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                <a href="#" style="color: #10b981; text-decoration: none;">Contact Support</a> |
                <a href="#" style="color: #10b981; text-decoration: none;">Help Center</a> |
                <a href="#" style="color: #10b981; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }
];

// Extended library for "Browse More Templates"
const EXTENDED_TEMPLATE_LIBRARY: EmailTemplate[] = [...EMAIL_TEMPLATES];

const Newsletter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers' | 'templates'>('campaigns');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [showBrowseLibraryModal, setShowBrowseLibraryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [customTemplateCode, setCustomTemplateCode] = useState('');
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateDescription, setCustomTemplateDescription] = useState('');

  // State for campaigns
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([
    {
      id: '1',
      name: 'Weekly Tech Newsletter #42',
      subject: '5 AI Tools That Will Change Your Workflow',
      previewText: 'Discover the tools top creators are using...',
      status: 'sent',
      sentDate: '2026-02-01T10:00:00',
      recipients: 5247,
      openRate: 42.3,
      clickRate: 8.7,
      createdAt: '2026-01-28T14:00:00',
      template: 'weekly-newsletter',
      htmlContent: EMAIL_TEMPLATES[1].htmlContent
    }
  ]);

  // State for subscribers
  const [subscribers, setSubscribers] = useState<Subscriber[]>([
    {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      status: 'active',
      subscribedAt: '2025-12-15T10:00:00',
      tags: ['creator', 'premium']
    },
    {
      id: '2',
      email: 'sarah@example.com',
      name: 'Sarah Smith',
      status: 'active',
      subscribedAt: '2026-01-03T14:00:00',
      tags: ['creator']
    }
  ]);

  // Form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    previewText: '',
    template: ''
  });

  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const [newSubscriber, setNewSubscriber] = useState({
    name: '',
    email: '',
    tags: ''
  });

  const stats = [
    {
      label: 'Total Subscribers',
      value: subscribers.filter(s => s.status === 'active').length.toString(),
      change: `+${Math.round(subscribers.length * 0.047)} this month`,
      icon: Users,
      color: 'emerald'
    },
    {
      label: 'Avg. Open Rate',
      value: '42.3%',
      change: '+3.2% vs last month',
      icon: Eye,
      color: 'blue'
    },
    {
      label: 'Avg. Click Rate',
      value: '8.7%',
      change: '+1.1% vs last month',
      icon: MousePointerClick,
      color: 'purple'
    },
    {
      label: 'Campaigns Sent',
      value: campaigns.filter(c => c.status === 'sent').length.toString(),
      change: `${campaigns.length} total`,
      icon: Send,
      color: 'amber'
    }
  ];

  const statusConfig = {
    draft: { label: 'Draft', color: 'amber', icon: Edit },
    scheduled: { label: 'Scheduled', color: 'blue', icon: Clock },
    sent: { label: 'Sent', color: 'emerald', icon: CheckCircle2 }
  };

  const subscriberStatusConfig = {
    active: { label: 'Active', color: 'emerald', icon: CheckCircle2 },
    unsubscribed: { label: 'Unsubscribed', color: 'gray', icon: UserMinus },
    bounced: { label: 'Bounced', color: 'red', icon: Target }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  // Campaign actions
  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.template) {
      alert('Please fill in all required fields');
      return;
    }

    const template = EMAIL_TEMPLATES.find(t => t.id === newCampaign.template);
    if (!template) return;

    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      subject: newCampaign.subject,
      previewText: newCampaign.previewText,
      status: 'draft',
      recipients: subscribers.filter(s => s.status === 'active').length,
      createdAt: new Date().toISOString(),
      template: newCampaign.template,
      htmlContent: template.htmlContent
    };

    setCampaigns([...campaigns, campaign]);
    setShowCreateModal(false);
    setNewCampaign({ name: '', subject: '', previewText: '', template: '' });
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    }
  };

  const handleDuplicateCampaign = (campaign: EmailCampaign) => {
    const duplicate: EmailCampaign = {
      ...campaign,
      id: Date.now().toString(),
      name: `${campaign.name} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentDate: undefined,
      scheduledFor: undefined,
      openRate: undefined,
      clickRate: undefined
    };
    setCampaigns([...campaigns, duplicate]);
  };

  const handleSendCampaign = (id: string) => {
    setCampaigns(campaigns.map(c =>
      c.id === id
        ? {
            ...c,
            status: 'sent',
            sentDate: new Date().toISOString(),
            openRate: Math.random() * 50 + 20, // Mock 20-70%
            clickRate: Math.random() * 15 + 5   // Mock 5-20%
          }
        : c
    ));
  };

  // Subscriber actions
  const handleAddSubscriber = () => {
    if (!newSubscriber.name || !newSubscriber.email) {
      alert('Please fill in all required fields');
      return;
    }

    const subscriber: Subscriber = {
      id: Date.now().toString(),
      name: newSubscriber.name,
      email: newSubscriber.email,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      tags: newSubscriber.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    setSubscribers([...subscribers, subscriber]);
    setShowSubscriberModal(false);
    setNewSubscriber({ name: '', email: '', tags: '' });
  };

  const handleDeleteSubscriber = (id: string) => {
    if (confirm('Are you sure you want to delete this subscriber?')) {
      setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setShowEditorModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${getColorClasses(stat.color)} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-500">{stat.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-[#1a1a1a]">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'campaigns'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'subscribers'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Subscribers
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'templates'
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4 inline mr-2" />
            Templates
          </button>
        </div>

        {activeTab === 'campaigns' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Campaign
          </button>
        )}

        {activeTab === 'subscribers' && (
          <button
            onClick={() => setShowSubscriberModal(true)}
            className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add Subscriber
          </button>
        )}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2a2a2a]"
              />
            </div>
          </div>

          {/* Campaign Cards */}
          {campaigns.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subject.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((campaign) => {
            const StatusIcon = statusConfig[campaign.status].icon;

            return (
              <div
                key={campaign.id}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#2a2a2a] transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white truncate">{campaign.name}</h3>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getColorClasses(statusConfig[campaign.status].color)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[campaign.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      <Mail className="w-3 h-3 inline mr-1" />
                      {campaign.subject}
                    </p>

                    {/* Metrics for sent campaigns */}
                    {campaign.status === 'sent' && campaign.openRate !== undefined && (
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Send className="w-3 h-3" />
                            Sent
                          </div>
                          <div className="text-sm font-bold text-white">{campaign.recipients.toLocaleString()}</div>
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Eye className="w-3 h-3" />
                            Opens
                          </div>
                          <div className="text-sm font-bold text-white">{campaign.openRate.toFixed(1)}%</div>
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <MousePointerClick className="w-3 h-3" />
                            Clicks
                          </div>
                          <div className="text-sm font-bold text-white">{campaign.clickRate?.toFixed(1)}%</div>
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <Calendar className="w-3 h-3" />
                            Sent On
                          </div>
                          <div className="text-sm font-bold text-white">
                            {new Date(campaign.sentDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info for draft campaigns */}
                    {campaign.status === 'draft' && (
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(campaign.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {campaign.recipients.toLocaleString()} recipients ready
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEditCampaign(campaign)}
                      className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center"
                      title="Preview/Edit"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleSendCampaign(campaign.id)}
                        className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center"
                        title="Send Now"
                      >
                        <Send className="w-4 h-4 text-emerald-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicateCampaign(campaign)}
                      className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:bg-[#1a1a1a] transition-all flex items-center justify-center"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="w-9 h-9 rounded-lg bg-[#0a0a0a] border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {campaigns.length === 0 && (
            <div className="bg-[#0a0a0a] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Campaigns Yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first email campaign to engage with your subscribers</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-400 text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
              >
                Create Campaign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Search & Actions */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search subscribers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#2a2a2a]"
              />
            </div>
            <button className="px-4 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
              <Download className="w-4 h-4 inline mr-2" />
              Export CSV
            </button>
          </div>

          {/* Subscriber Table */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <div className="col-span-4 text-xs font-bold text-gray-500 uppercase">Subscriber</div>
              <div className="col-span-3 text-xs font-bold text-gray-500 uppercase">Status</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase">Tags</div>
              <div className="col-span-2 text-xs font-bold text-gray-500 uppercase">Subscribed</div>
              <div className="col-span-1 text-xs font-bold text-gray-500 uppercase text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {subscribers.filter(s =>
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((subscriber) => {
              const StatusIcon = subscriberStatusConfig[subscriber.status].icon;

              return (
                <div
                  key={subscriber.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#0a0a0a]/50 transition-all"
                >
                  <div className="col-span-4">
                    <div className="font-semibold text-white text-sm">{subscriber.name}</div>
                    <div className="text-xs text-gray-500">{subscriber.email}</div>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${getColorClasses(subscriberStatusConfig[subscriber.status].color)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {subscriberStatusConfig[subscriber.status].label}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {subscriber.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-500">
                    {new Date(subscriber.subscribedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleDeleteSubscriber(subscriber.id)}
                      className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Template Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowCustomTemplateModal(true)}
              className="flex-1 bg-emerald-400 text-black px-6 py-4 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <Code className="w-5 h-5" />
              Create Custom Template
            </button>
            <button
              onClick={() => setShowBrowseLibraryModal(true)}
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-white px-6 py-4 rounded-xl text-sm font-bold hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Browse Template Library
            </button>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMAIL_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  setEditingCampaign({
                    id: 'preview-' + template.id,
                    name: template.name,
                    subject: template.name + ' Template Preview',
                    previewText: template.description,
                    status: 'draft',
                    recipients: 0,
                    createdAt: new Date().toISOString(),
                    template: template.id,
                    htmlContent: template.htmlContent
                  });
                  setShowEditorModal(true);
                }}
                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all group cursor-pointer"
              >
                {/* Template Preview - iframe */}
                <div className="h-64 bg-white border-b border-[#1a1a1a] overflow-hidden relative">
                  <iframe
                    srcDoc={template.htmlContent}
                    className="w-full h-full scale-[0.4] origin-top-left"
                    style={{ width: '250%', height: '250%' }}
                    title={template.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <span className="text-white text-sm font-bold">Click to Preview</span>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{template.description}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewCampaign({ ...newCampaign, template: template.id });
                        setShowCreateModal(true);
                      }}
                      className="flex-1 bg-emerald-400 text-black py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Email Campaign</h2>
                <p className="text-sm text-gray-500 mt-1">Design and send your newsletter</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCampaign({ name: '', subject: '', previewText: '', template: '' });
                }}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Campaign Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Weekly Newsletter #43"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Subject Line *</label>
                <input
                  type="text"
                  placeholder="Enter email subject..."
                  value={newCampaign.subject}
                  onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
                <p className="text-xs text-gray-600 mt-2">Keep it under 50 characters for best results</p>
              </div>

              {/* Preview Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Preview Text</label>
                <input
                  type="text"
                  placeholder="Preview text shown in inbox..."
                  value={newCampaign.previewText}
                  onChange={(e) => setNewCampaign({ ...newCampaign, previewText: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">Choose Template *</label>
                <div className="grid grid-cols-3 gap-3">
                  {EMAIL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setNewCampaign({ ...newCampaign, template: template.id })}
                      className={`bg-[#0a0a0a] border rounded-xl p-4 transition-all flex flex-col items-center gap-2 group ${
                        newCampaign.template === template.id
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all">
                        <Layout className="w-6 h-6 text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <span className="text-xs font-bold text-white text-center">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Send To</label>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white">All Active Subscribers</span>
                    <span className="text-sm text-gray-500">{subscribers.filter(s => s.status === 'active').length} recipients</span>
                  </div>
                  <p className="text-xs text-gray-600">Campaign will be sent to all active subscribers</p>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-400 mb-1">AI Suggestion</p>
                    <p className="text-sm text-gray-400">
                      Best time to send: Wednesday at 10:00 AM (based on your subscribers' engagement patterns)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-6 flex gap-3 z-10">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCampaign({ name: '', subject: '', previewText: '', template: '' });
                }}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all"
              >
                Create as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview/Editor Modal */}
      {showEditorModal && editingCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a] flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">{editingCampaign.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{editingCampaign.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Desktop/Mobile Toggle */}
                <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#1a1a1a]">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      previewMode === 'desktop'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-4 h-4 inline mr-1" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      previewMode === 'mobile'
                        ? 'bg-[#1a1a1a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Mobile
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowEditorModal(false);
                    setEditingCampaign(null);
                  }}
                  className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Email Preview */}
            <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a] flex items-start justify-center">
              <div
                className="bg-white rounded-lg shadow-2xl transition-all duration-300"
                style={{
                  width: previewMode === 'desktop' ? '100%' : '375px',
                  maxWidth: previewMode === 'desktop' ? '800px' : '375px'
                }}
              >
                <iframe
                  srcDoc={editingCampaign.htmlContent}
                  className="w-full"
                  style={{ height: '600px', border: 'none' }}
                  title="Email Preview"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1a1a1a] flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditorModal(false);
                  setEditingCampaign(null);
                }}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Close Preview
              </button>
              {editingCampaign.status === 'draft' && !editingCampaign.id.startsWith('preview-') && (
                <button
                  onClick={() => {
                    handleSendCampaign(editingCampaign.id);
                    setShowEditorModal(false);
                    setEditingCampaign(null);
                  }}
                  className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all"
                >
                  <Send className="w-4 h-4 inline mr-2" />
                  Send Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Subscriber Modal */}
      {showSubscriberModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Add Subscriber</h2>
                <p className="text-sm text-gray-500 mt-1">Add a new subscriber to your list</p>
              </div>
              <button
                onClick={() => {
                  setShowSubscriberModal(false);
                  setNewSubscriber({ name: '', email: '', tags: '' });
                }}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={newSubscriber.name}
                  onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="creator, premium"
                  value={newSubscriber.tags}
                  onChange={(e) => setNewSubscriber({ ...newSubscriber, tags: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1a1a1a] flex gap-3">
              <button
                onClick={() => {
                  setShowSubscriberModal(false);
                  setNewSubscriber({ name: '', email: '', tags: '' });
                }}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscriber}
                className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all"
              >
                Add Subscriber
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Template Modal */}
      {showCustomTemplateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Create Custom Template</h2>
                <p className="text-sm text-gray-500 mt-1">Build your own HTML email template</p>
              </div>
              <button
                onClick={() => {
                  setShowCustomTemplateModal(false);
                  setCustomTemplateName('');
                  setCustomTemplateDescription('');
                  setCustomTemplateCode('');
                }}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g., My Custom Template"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              {/* Template Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Description *</label>
                <input
                  type="text"
                  placeholder="Brief description of this template"
                  value={customTemplateDescription}
                  onChange={(e) => setCustomTemplateDescription(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a]"
                />
              </div>

              {/* HTML Code Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">HTML Code *</label>
                <textarea
                  placeholder="Paste your HTML email template code here..."
                  value={customTemplateCode}
                  onChange={(e) => setCustomTemplateCode(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#2a2a2a] font-mono text-sm"
                  rows={15}
                  style={{ resize: 'vertical' }}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Tip: Use table-based layouts with inline CSS for best email client compatibility
                </p>
              </div>

              {/* Preview */}
              {customTemplateCode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Preview</label>
                  <div className="bg-white rounded-xl overflow-hidden border border-[#1a1a1a]" style={{ height: '400px' }}>
                    <iframe
                      srcDoc={customTemplateCode}
                      className="w-full h-full"
                      title="Custom Template Preview"
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#1a1a1a] p-6 flex gap-3 z-10">
              <button
                onClick={() => {
                  setShowCustomTemplateModal(false);
                  setCustomTemplateName('');
                  setCustomTemplateDescription('');
                  setCustomTemplateCode('');
                }}
                className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 py-3 rounded-xl font-bold hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!customTemplateName || !customTemplateDescription || !customTemplateCode) {
                    alert('Please fill in all required fields');
                    return;
                  }

                  const newTemplate: EmailTemplate = {
                    id: 'custom-' + Date.now(),
                    name: customTemplateName,
                    description: customTemplateDescription,
                    category: 'custom',
                    htmlContent: customTemplateCode
                  };

                  EMAIL_TEMPLATES.push(newTemplate);
                  alert('Custom template saved successfully!');
                  setShowCustomTemplateModal(false);
                  setCustomTemplateName('');
                  setCustomTemplateDescription('');
                  setCustomTemplateCode('');
                }}
                className="flex-1 bg-emerald-400 text-black py-3 rounded-xl font-bold hover:bg-emerald-500 transition-all"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browse Template Library Modal */}
      {showBrowseLibraryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Template Library</h2>
                <p className="text-sm text-gray-500 mt-1">Browse and select from our collection of email templates</p>
              </div>
              <button
                onClick={() => setShowBrowseLibraryModal(false)}
                className="w-10 h-10 rounded-xl bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-all flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Category Filter */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-all">
                  All Templates
                </button>
                <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Announcement
                </button>
                <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Content
                </button>
                <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Marketing
                </button>
                <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Event
                </button>
                <button className="px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:border-[#2a2a2a] transition-all">
                  Minimal
                </button>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXTENDED_TEMPLATE_LIBRARY.map((template) => (
                  <div
                    key={template.id}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all group"
                  >
                    {/* Template Preview */}
                    <div
                      className="h-48 bg-white border-b border-[#1a1a1a] overflow-hidden relative cursor-pointer"
                      onClick={() => {
                        setEditingCampaign({
                          id: 'preview-' + template.id,
                          name: template.name,
                          subject: template.name + ' Template Preview',
                          previewText: template.description,
                          status: 'draft',
                          recipients: 0,
                          createdAt: new Date().toISOString(),
                          template: template.id,
                          htmlContent: template.htmlContent
                        });
                        setShowEditorModal(true);
                        setShowBrowseLibraryModal(false);
                      }}
                    >
                      <iframe
                        srcDoc={template.htmlContent}
                        className="w-full h-full scale-[0.3] origin-top-left"
                        style={{ width: '333%', height: '333%' }}
                        title={template.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                        <span className="text-white text-xs font-bold">Click to Preview</span>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-bold text-white">{template.name}</h3>
                        <span className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-gray-400 capitalize">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{template.description}</p>

                      <button
                        onClick={() => {
                          setNewCampaign({ ...newCampaign, template: template.id });
                          setShowBrowseLibraryModal(false);
                          setShowCreateModal(true);
                        }}
                        className="w-full bg-emerald-400 text-black py-2 rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all"
                      >
                        Use This Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Newsletter;
