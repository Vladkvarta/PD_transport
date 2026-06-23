import { defineSecret, defineString } from "firebase-functions/params";

export const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
export const telegramWebhookSecret = defineSecret("TELEGRAM_WEBHOOK_SECRET");

export const archiveChatId = defineString("TELEGRAM_ARCHIVE_CHAT_ID", {
  description: "Numeric chat ID of the private archive supergroup",
});

