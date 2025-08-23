// Email Integration Service for ChristianKit
// Sends daily re-engagement emails to keep users spiritually active

import { Resend } from 'resend';
import { User } from '@supabase/supabase-js';

export interface EmailTemplate {
  id: string;
  subject: string;
  content: string;
  urgencyLevel: 'gentle' | 'moderate' | 'urgent' | 'critical';
}

export interface EmailSchedule {
  userId: string;
  email: string;
  lastActivity: Date;
  daysSinceLastPrayer: number;
  consecutiveMissedDays: number;
  streak: number;
}

class EmailService {
  private resend: Resend | null = null;

  constructor() {
    // Use Resend for reliable email delivery
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend email service initialized');
    } else {
      console.warn('⚠️ VITE_RESEND_API_KEY not found. Email functionality will be disabled.');
    }
  }

  // Singleton instance
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send daily re-engagement email based on user activity
   */
  async sendDailyReEngagementEmail(schedule: EmailSchedule): Promise<boolean> {
    try {
      if (!this.resend) {
        console.warn('⚠️ Resend service not initialized');
        return false;
      }

      const template = this.selectEmailTemplate(schedule);
      
      const result = await this.resend.emails.send({
        from: 'ChristianKit <onboarding@resend.dev>',
        to: schedule.email,
        subject: template.subject,
        html: this.generateEmailHTML(template, schedule),
      });

      if (result.data) {
        console.log(`📧 Re-engagement email sent to ${schedule.email}`, result.data);
        return true;
      } else {
        console.error('Failed to send email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  /**
   * Select email template based on user behavior
   */
  private selectEmailTemplate(schedule: EmailSchedule): EmailTemplate {
    const { consecutiveMissedDays, daysSinceLastPrayer, streak } = schedule;

    // Escalating urgency based on missed days
    if (consecutiveMissedDays >= 7) {
      return this.getCriticalTemplate(streak);
    } else if (consecutiveMissedDays >= 3) {
      return this.getUrgentTemplate(daysSinceLastPrayer);
    } else if (consecutiveMissedDays >= 1) {
      return this.getModerateTemplate(streak);
    } else {
      return this.getGentleTemplate();
    }
  }

  /**
   * Email templates with increasing urgency
   */
  private getGentleTemplate(): EmailTemplate {
    const subjects = [
      "🌅 Your daily spiritual moment awaits",
      "✨ God is waiting for you to connect",
      "🙏 Your prayer time is ready",
      "💫 Continue your spiritual journey today"
    ];

    return {
      id: 'gentle',
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      content: `
        <h2>Good morning, faithful one! 🌟</h2>
        <p>Your spiritual journey continues today. Take a moment to connect with God and feel His presence in your life.</p>
        <p><strong>Today's spiritual focus:</strong> Gratitude and reflection</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://christiankit.app/?utm_source=email&utm_medium=daily" 
             style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            🙏 Start Prayer Session
          </a>
        </div>
      `,
      urgencyLevel: 'gentle'
    };
  }

  private getModerateTemplate(streak: number): EmailTemplate {
    return {
      id: 'moderate',
      subject: `⚠️ Don't break your ${streak}-day streak!`,
      content: `
        <h2>Your spiritual streak is at risk! 📊</h2>
        <p>You've built an amazing ${streak}-day prayer streak. Don't let it slip away today!</p>
        <p><strong>What you'll lose if you skip today:</strong></p>
        <ul>
          <li>✨ Your spiritual momentum</li>
          <li>🔥 Your prayer streak</li>
          <li>💝 God's daily blessing</li>
          <li>🌱 Your spiritual growth</li>
        </ul>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>💡 Just 5 minutes can save your entire streak!</strong></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://christiankit.app/?utm_source=email&utm_medium=streak_save" 
             style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            🔥 Save My Streak Now
          </a>
        </div>
      `,
      urgencyLevel: 'moderate'
    };
  }

  private getUrgentTemplate(daysSinceLastPrayer: number): EmailTemplate {
    return {
      id: 'urgent',
      subject: `💝 We miss you! Come back to your prayer time`,
      content: `
        <h2 style="color: #059669;">Your prayer journey awaits! 💝</h2>
        <p>It's been <strong>${daysSinceLastPrayer} days</strong> since your last prayer session. We'd love to see you back!</p>
        
        <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0;">
          <h3 style="color: #059669; margin-top: 0;">What you're missing:</h3>
          <ul style="color: #065f46;">
            <li>✨ Daily spiritual peace and comfort</li>
            <li>✨ God's loving presence in your life</li>
            <li>✨ Growing closer to your faith</li>
            <li>✨ Building meaningful prayer habits</li>
          </ul>
        </div>

        <p><strong>Ready to reconnect?</strong> God is always waiting with open arms.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://christiankit.app/?utm_source=email&utm_medium=gentle_return" 
             style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            🙏 Start Praying Again
          </a>
        </div>
      `,
      urgencyLevel: 'urgent'
    };
  }

  private getCriticalTemplate(streak: number): EmailTemplate {
    return {
      id: 'critical',
      subject: `💝 We'd love to see you back! Your prayer journey continues`,
      content: `
        <h2 style="color: #059669;">Welcome back! 💝</h2>
        <p style="font-size: 18px; color: #065f46;"><strong>It's been a while since your last prayer session.</strong></p>
        
        <div style="background: #ecfdf5; color: #065f46; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0;">🌟 Your Prayer Journey 🌟</h3>
          <p>Previous streak: <strong>${streak} days</strong></p>
          <p>Status: <strong>Ready to continue growing!</strong></p>
        </div>

        <h3 style="color: #059669;">What's waiting for you:</h3>
        <ul style="color: #065f46; font-weight: bold;">
          <li>✨ Renewed spiritual connection</li>
          <li>✨ God's endless love and grace</li>
          <li>✨ Fresh start on your prayer journey</li>
          <li>✨ Community of supportive believers</li>
          <li>✨ Daily spiritual growth opportunities</li>
        </ul>

        <div style="background: #f0fdf4; border: 3px solid #059669; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #059669; text-align: center;">🌟 Fresh Start Available 🌟</h3>
          <p style="text-align: center; font-size: 16px;">Whenever you're ready, we're here to support your spiritual journey.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://christiankit.app/?utm_source=email&utm_medium=welcome_back" 
               style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 20px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
              🙏 Continue My Journey
            </a>
          </div>
        </div>

        <p style="font-size: 12px; color: #6b7280; text-align: center;">
          No pressure, no guilt. We're here whenever you're ready to reconnect with your faith.
        </p>
      `,
      urgencyLevel: 'critical'
    };
  }

  /**
   * Generate complete HTML email
   */
  private generateEmailHTML(template: EmailTemplate, schedule: EmailSchedule): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.subject}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', Arial, sans-serif;
                background: linear-gradient(135deg, #0a0a0a, #111111);
                color: #ffffff;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                color: #333333;
            }
            
            .header {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                padding: 30px 20px;
                text-align: center;
            }
            
            .header h1 {
                margin: 0;
                color: white;
                font-size: 28px;
                font-weight: 700;
            }
            
            .content {
                padding: 30px 20px;
                line-height: 1.6;
            }
            
            .footer {
                background: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                border-top: 1px solid #e5e7eb;
            }
            
            .cross-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="cross-icon">✝️</div>
                <h1>ChristianKit</h1>
                <p style="margin: 0; color: rgba(255,255,255,0.9);">Your Spiritual Growth Companion</p>
            </div>
            
            <div class="content">
                ${template.content}
                
                <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px;">
                    <h4 style="margin-top: 0; color: #374151;">📊 Your Spiritual Stats:</h4>
                    <ul style="margin: 0; color: #6b7280;">
                        <li>Current streak: ${schedule.streak} days</li>
                        <li>Days since last prayer: ${schedule.daysSinceLastPrayer}</li>
                        <li>Missed days: ${schedule.consecutiveMissedDays}</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>You're receiving this because your spiritual growth matters.</p>
                <p>ChristianKit - Growing faith through daily habits</p>
                <p>
                    <a href="https://christiankit.app/unsubscribe?email=${schedule.email}" style="color: #6b7280;">Unsubscribe</a> | 
                    <a href="https://christiankit.app/settings" style="color: #6b7280;">Notification Preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Schedule daily emails for all inactive users
   */
  async sendDailyBatch(userSchedules: EmailSchedule[]): Promise<void> {
    console.log(`📧 Processing ${userSchedules.length} daily re-engagement emails...`);
    
    for (const schedule of userSchedules) {
      try {
        await this.sendDailyReEngagementEmail(schedule);
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send email to ${schedule.email}:`, error);
      }
    }
    
    console.log('✅ Daily email batch completed');
  }
}

// Lazy initialization to avoid issues during module loading
let emailServiceInstance: EmailService | null = null;

export const emailService = {
  getInstance: () => {
    if (!emailServiceInstance) {
      emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
  }
};
export default EmailService;
