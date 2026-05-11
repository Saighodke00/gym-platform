import { sendNotification } from './notifications';

async function test() {
  console.log('Testing Telegram...');
  const res = await sendNotification({
    telegramChatId: "5841456954",
    message: "🚀 Test from GDK Gym Platform! If you see this, Telegram is working.",
    channel: 'telegram'
  });
  console.log('Telegram Result:', res.telegram);

  console.log('Testing Email...');
  const emailRes = await sendNotification({
    email: "saig3478@gmail.com",
    subject: "GDK Gym Test",
    message: "This is a test email from your gym platform.",
    channel: 'email'
  });
  console.log('Email Result:', emailRes.email);
}

test();
