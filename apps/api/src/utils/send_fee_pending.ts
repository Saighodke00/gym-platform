import { sendNotification } from './notifications';

async function sendFeePending() {
  const memberName = "Sai";
  const memberEmail = "saig3478@gmail.com";
  const adminChatId = "5841456954";

  console.log(`Sending fee pending notification to ${memberName}...`);
  
  const message = `🔔 Payment Pending\n\nHi ${memberName},\n\nWe noticed that your membership fee for this month is still pending. 💳\n\nPlease visit the front desk or use the app to clear your dues so you can continue your workouts without interruption! 💪\n\nThank you,\nGDK Gym Management`;

  const res = await sendNotification({
    email: memberEmail,
    telegramChatId: adminChatId, // Sending to admin for now as per previous tests
    subject: "GDK Gym: Payment Reminder 💳",
    message: message,
    channel: 'both'
  });

  console.log('Results:', res);
}

sendFeePending();
