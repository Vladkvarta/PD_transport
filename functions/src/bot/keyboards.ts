import { Markup } from "telegraf";

export const labels = {
  startShift: "Начать смену",
  addDocument: "Фото документа",
  finishShift: "Завершить смену",
  cancel: "Отмена",
} as const;

export const idleKeyboard = Markup.keyboard([
  [labels.startShift],
]).resize();

export const activeShiftKeyboard = Markup.keyboard([
  [labels.addDocument],
  [labels.finishShift],
]).resize();

export const cancelKeyboard = Markup.keyboard([
  [labels.cancel],
]).resize();

export const documentTypeKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("Чек АЗС", "document:fuelReceipt"),
    Markup.button.callback("Накладная", "document:invoice"),
  ],
  [
    Markup.button.callback("Маршрутный лист", "document:routeSheet"),
    Markup.button.callback("Другое", "document:other"),
  ],
]);

