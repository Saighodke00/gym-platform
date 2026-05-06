import { Telegraf } from 'telegraf';
import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

// Initialize Telegram Bot
let bot: Telegraf | null = null;
if (config.telegram.botToken) {
  logger.info('🤖 Initializing Telegram Bot...');
  bot = new Telegraf(config.telegram.botToken);
  // Note: We do NOT call bot.launch() here because we only SEND messages.
  // bot.launch() is only needed if the bot needs to RECEIVE/respond to messages.
  logger.info('✅ Telegram Bot ready to send messages');
} else {
  logger.warn('⚠️ No Telegram Bot Token found in configuration');
}

// Initialize Email Transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password,
  },
});

/**
 * Send a notification via Telegram and/or Email
 */
export const sendNotification = async (options: {
  email?: string;
  telegramChatId?: string;
  subject?: string;
  message: string;
  channel?: 'telegram' | 'email' | 'both';
}) => {
  const { email, telegramChatId, subject = 'GDK Gym Notification', message, channel = 'both' } = options;
  const results = { telegram: false, email: false };

  // 1. Send via Telegram
  if ((channel === 'telegram' || channel === 'both') && bot && telegramChatId) {
    try {
      await bot.telegram.sendMessage(telegramChatId, message);
      logger.info(`[Telegram] Sent to ${telegramChatId} ✅`);
      results.telegram = true;
    } catch (error) {
      logger.error('[Telegram] Failed to send message:', error);
    }
  }

  // 2. Send via Email
  if ((channel === 'email' || channel === 'both') && email && config.smtp.user) {
    try {
      await transporter.sendMail({
        from: config.smtp.from,
        to: email,
        subject: subject,
        text: message,
        // Optional: Add HTML version if needed
        html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1A56A0;">GDK Gym Update</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message.replace(/\n/g, '<br>')}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">GDK Gym Management Platform · Local Node</p>
        </div>`
      });
      logger.info(`[Email] Sent to ${email} ✅`);
      results.email = true;
    } catch (error) {
      logger.error('[Email] Failed to send email:', error);
    }
  }

  return results;
};

// Helper message generators
export const getWelcomeMessage = (name: string, memberCode: string) => {
  return `🎉 Hello ${name},\n\nWelcome to the GDK Gym Family! 💪\n\nWe are thrilled to have you with us. Your journey to greatness starts now!\n\n🔑 Your Member Code: ${memberCode}\n\nPlease save this code. You can use it at the front desk to mark your daily attendance.\n\nLet's crush those goals! 🏋️‍♂️🔥`;
};

export const getRenewalMessage = (name: string, planName: string, endDate: Date) => {
  const dateStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `✅ Membership Renewed!\n\nHi ${name},\n\nThank you for your payment. Your ${planName} plan has been successfully renewed! 🚀\n\n📅 Valid until: ${dateStr}\n\nKeep up the great work and consistency! 🏆`;
};

export const getExpiryMessage = (name: string, daysLeft: number) => {
  if (daysLeft <= 0) {
    return `⚠️ Membership Expired\n\nHi ${name},\n\nYour GDK Gym membership has expired today. 🛑\n\nPlease visit the front desk to renew your plan so you don't miss a single day of your fitness journey! 🏋️‍♀️`;
  }
  return `🔔 Renewal Reminder\n\nHi ${name},\n\nJust a quick heads-up that your gym membership will expire in ${daysLeft} days. ⏳\n\nDon't forget to renew soon to keep your streak going! 💪`;
};

export const getCheckInMessage = (name: string, time: Date, streak: number) => {
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const streakEmoji = streak > 3 ? '🔥' : '💪';
  return `✅ Check-in Successful!\n\nGreat to see you at the gym, ${name}! You logged in today at ${timeStr}.\n\nCurrent Streak: ${streak} days ${streakEmoji}\n\nHave an amazing workout! 🏋️‍♂️`;
};
