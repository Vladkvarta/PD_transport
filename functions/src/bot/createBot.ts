import { Markup, Telegraf } from "telegraf";
import { captureArchiveTopic } from "./archiveTopics.js";

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  // Обработка тем в архиве остается
  bot.use(async (ctx, next) => {
    await captureArchiveTopic(ctx);
    await next();
  });

  bot.start(async (ctx) => {
    await ctx.reply(
      `Здравствуйте, ${ctx.from.first_name}! Для работы с маршрутными листами используйте приложение.`,
      Markup.keyboard([
        [Markup.button.webApp("Открыть приложение", "https://your-app-url.web.app/app")]
      ]).resize()
    );
  });

  // Остальные обработчики (hears, photo, text) удалены, так как всё перенесено в TWA

  return bot;
}
