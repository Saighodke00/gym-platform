import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from './logger';

/**
 * WhatsApp Utility for GDK Gym
 * Using Option C: Local QR Bridge (whatsapp-web.js)
 */

let client: Client;
let isReady = false;

export const initializeWhatsApp = () => {
  logger.info('📱 Initializing WhatsApp Web Bridge...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      handleSIGINT: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  client.on('qr', (qr) => {
    logger.info('📢 WhatsApp QR Code received! Scan it now:');
    qrcode.generate(qr, { small: true });
    logger.warn('⚠️ Please scan the QR code above with your WhatsApp (Linked Devices) to enable messaging.');
  });

  client.on('ready', () => {
    isReady = true;
    logger.info('✅ WhatsApp Web Client is READY!');
  });

  client.on('authenticated', () => {
    logger.info('🔓 WhatsApp Authenticated successfully.');
  });

  client.on('auth_failure', (msg) => {
    logger.error('❌ WhatsApp Authentication failure:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    logger.warn('🔌 WhatsApp Client disconnected:', reason);
    // Attempt to re-initialize after a delay
    setTimeout(() => initializeWhatsApp(), 5000);
  });

  client.initialize().catch(err => {
    logger.error('❌ Failed to initialize WhatsApp client:', err);
  });
};

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  try {
    if (!isReady) {
      logger.warn(`[WhatsApp] Skip sending to ${phone} - Client not ready.`);
      return false;
    }

    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const chatId = `${cleanPhone}@c.us`;
    await client.sendMessage(chatId, message);
    logger.info(`[WhatsApp] Sent to ${cleanPhone} ✅`);
    return true;
  } catch (error) {
    logger.error('[WhatsApp] Failed to send message:', error);
    return false;
  }
};

export const getWhatsAppWelcomeMessage = (name: string, memberCode: string) => {
  return `Hi ${name}! Welcome to GDK Gym. Your Member ID is *${memberCode}*. 🏋️‍♂️ Use this ID for scanning at the entrance. Let's crush those goals!`;
};

export const getWhatsAppRenewalMessage = (name: string, planName: string, endDate: Date) => {
  const dateStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `Hi ${name}! Your membership for *${planName}* has been successfully renewed. It is valid until *${dateStr}*. Thank you for choosing GDK Gym! 💪`;
};

export const getWhatsAppExpiryMessage = (name: string, daysLeft: number) => {
  return `Hi ${name}! This is a friendly reminder from GDK Gym. Your membership is expiring in *${daysLeft} days*. Please visit the front desk to renew and keep your progress going! 🏃‍♂️`;
};
