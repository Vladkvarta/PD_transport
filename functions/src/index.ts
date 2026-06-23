import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import {
  telegramBotToken,
  telegramWebhookSecret,
} from "./config.js";
import { createBot } from "./bot/createBot.js";
export { createArchiveTopic } from "./createArchiveTopic.js";

let bot: ReturnType<typeof createBot> | undefined;

export const telegramWebhook = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 10,
    secrets: [telegramBotToken, telegramWebhookSecret],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const suppliedSecret = request.header(
      "x-telegram-bot-api-secret-token",
    );
    if (suppliedSecret !== telegramWebhookSecret.value()) {
      logger.warn("Rejected Telegram webhook with invalid secret");
      response.status(401).send("Unauthorized");
      return;
    }

    bot ??= createBot(telegramBotToken.value());

    try {
      await bot.handleUpdate(request.body);
      response.status(200).send("OK");
    } catch (error) {
      logger.error("Telegram webhook failed", error);
      response.status(500).send("Failed");
    }
  },
);
