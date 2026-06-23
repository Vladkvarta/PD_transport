import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import {
  telegramBotToken,
  telegramWebhookSecret,
} from "./config.js";
import { createBot } from "./bot/createBot.js";

// Регистрация новых API функций для TWA
export { startShift } from "./api/twa/startShift.js";
export { finishShift } from "./api/twa/finishShift.js";
export { addTripPoint } from "./api/twa/addTripPoint.js";
export { uploadDocument } from "./api/twa/uploadDocument.js";
export { createArchiveTopic } from "./createArchiveTopic.js";

let bot: ReturnType<typeof createBot> | undefined;

export const telegramWebhook = onRequest(
  {
    region: "europe-west1",
    secrets: [telegramBotToken, telegramWebhookSecret],
  },
  async (request, response) => {
    bot ??= createBot(telegramBotToken.value());

    // В новой архитектуре бот только приветствует и дает ссылку на TWA
    // Текстовая обработка в createBot.ts будет максимально упрощена
    try {
      await bot.handleUpdate(request.body);
      response.status(200).send("OK");
    } catch (error) {
      logger.error("Telegram webhook failed", error);
      response.status(500).send("Failed");
    }
  },
);
