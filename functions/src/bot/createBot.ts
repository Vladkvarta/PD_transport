import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { Markup, Telegraf } from "telegraf";
import { archiveChatId } from "../config.js";
import { parseMileage } from "../domain/mileage.js";
import { db } from "../firebase.js";
import type { DocumentType, Shift } from "../types.js";
import { findDriver, setBotState } from "./driver.js";
import {
  activeShiftKeyboard,
  cancelKeyboard,
  documentTypeKeyboard,
  idleKeyboard,
  labels,
} from "./keyboards.js";
import { captureRegistrationRequest } from "./registration.js";
import { documentTypeLabels, escapeHtml } from "./text.js";
import { captureArchiveTopic } from "./archiveTopics.js";

const documentTypes = new Set<DocumentType>([
  "fuelReceipt",
  "invoice",
  "routeSheet",
  "other",
]);

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  bot.use(async (ctx, next) => {
    const updateId = ctx.update.update_id.toString();
    const updateRef = db.collection("telegramUpdates").doc(updateId);
    const shouldProcess = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(updateRef);
      if (current.exists) {
        return false;
      }

      transaction.create(updateRef, {
        receivedAt: FieldValue.serverTimestamp(),
        status: "processing",
      });
      return true;
    });

    if (shouldProcess) {
      try {
        await captureArchiveTopic(ctx);
        await captureRegistrationRequest(ctx);
        await next();
        await updateRef.update({
          status: "completed",
          completedAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        await updateRef.delete();
        throw error;
      }
    }
  });

  bot.start(async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver) {
      await ctx.reply(
        [
          "Заявка передана менеджеру.",
          `Ваш Telegram ID: ${ctx.from.id}`,
          "После создания карточки нажмите /start еще раз.",
        ].join("\n"),
        Markup.removeKeyboard(),
      );
      return;
    }

    const keyboard = driver.data.activeShiftId
      ? activeShiftKeyboard
      : idleKeyboard;
    await ctx.reply(
      `Здравствуйте, ${driver.data.fullName}. Автомобиль: ${driver.data.vehicleLabel}.`,
      keyboard,
    );
  });

  bot.hears(labels.startShift, async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver) {
      await ctx.reply(
        `Заявка передана менеджеру. Ваш Telegram ID: ${ctx.from.id}`,
      );
      return;
    }
    if (driver.data.activeShiftId) {
      await ctx.reply("Смена уже начата.", activeShiftKeyboard);
      return;
    }

    await setBotState(driver, { step: "awaitingStartMileage" });
    await ctx.reply(
      "Введите пробег на начало смены только цифрами.",
      cancelKeyboard,
    );
  });

  bot.hears(labels.addDocument, async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver?.data.activeShiftId) {
      await ctx.reply("Сначала начните смену.", idleKeyboard);
      return;
    }

    await ctx.reply("Выберите тип документа.", documentTypeKeyboard);
  });

  bot.action(/^document:(.+)$/, async (ctx) => {
    const documentType = ctx.match[1] as DocumentType;
    if (!documentTypes.has(documentType)) {
      await ctx.answerCbQuery("Неизвестный тип документа.");
      return;
    }

    const driver = await findDriver(ctx);
    if (!driver?.data.activeShiftId) {
      await ctx.answerCbQuery("Активная смена не найдена.");
      return;
    }

    await setBotState(driver, {
      step: "awaitingDocument",
      shiftId: driver.data.activeShiftId,
      documentType,
    });
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Тип: ${documentTypeLabels[documentType]}. Теперь отправьте фотографию.`,
    );
    await ctx.reply("Жду фотографию документа.", cancelKeyboard);
  });

  bot.hears(labels.finishShift, async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver?.data.activeShiftId) {
      await ctx.reply("Активной смены нет.", idleKeyboard);
      return;
    }

    await setBotState(driver, {
      step: "awaitingEndMileage",
      shiftId: driver.data.activeShiftId,
    });
    await ctx.reply(
      "Введите пробег на конец смены только цифрами.",
      cancelKeyboard,
    );
  });

  bot.hears(labels.cancel, async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver) {
      return;
    }

    await setBotState(driver, { step: "idle" });
    await ctx.reply(
      "Действие отменено.",
      driver.data.activeShiftId ? activeShiftKeyboard : idleKeyboard,
    );
  });

  bot.on("photo", async (ctx) => {
    const driver = await findDriver(ctx);
    const state = driver?.data.botState;
    if (!driver || state?.step !== "awaitingDocument") {
      await ctx.reply(
        "Сначала нажмите «Фото документа» и выберите его тип.",
        driver?.data.activeShiftId ? activeShiftKeyboard : idleKeyboard,
      );
      return;
    }

    const largestPhoto = ctx.message.photo.at(-1);
    if (!largestPhoto) {
      await ctx.reply("Не удалось прочитать фотографию. Отправьте еще раз.");
      return;
    }

    const shiftRef = db.collection("shifts").doc(state.shiftId);
    const shiftSnapshot = await shiftRef.get();
    if (!shiftSnapshot.exists) {
      await ctx.reply("Смена не найдена. Обратитесь к секретарю.");
      return;
    }

    const caption = [
      `<b>${escapeHtml(documentTypeLabels[state.documentType])}</b>`,
      `Водитель: ${escapeHtml(driver.data.fullName)}`,
      `Автомобиль: ${escapeHtml(driver.data.vehicleLabel)}`,
      `Смена: <code>${escapeHtml(state.shiftId)}</code>`,
    ].join("\n");

    const archivedMessage = await ctx.telegram.sendPhoto(
      archiveChatId.value(),
      largestPhoto.file_id,
      {
        message_thread_id: driver.data.archiveThreadId,
        caption,
        parse_mode: "HTML",
      },
    );

    await db.collection("documents").add({
      driverId: driver.id,
      shiftId: state.shiftId,
      type: state.documentType,
      telegramFileId: largestPhoto.file_id,
      sourceChatId: ctx.chat.id.toString(),
      sourceMessageId: ctx.message.message_id,
      archiveChatId: archiveChatId.value(),
      archiveThreadId: driver.data.archiveThreadId,
      archiveMessageId: archivedMessage.message_id,
      createdAt: FieldValue.serverTimestamp(),
    });

    await setBotState(driver, { step: "idle" });
    await ctx.reply("Фото сохранено.", activeShiftKeyboard);
  });

  bot.on("text", async (ctx) => {
    const driver = await findDriver(ctx);
    if (!driver) {
      await ctx.reply(
        `Заявка передана менеджеру. Ваш Telegram ID: ${ctx.from.id}`,
      );
      return;
    }

    const mileage = parseMileage(ctx.message.text);
    const state = driver.data.botState ?? { step: "idle" };

    if (state.step === "awaitingStartMileage") {
      if (mileage === null) {
        await ctx.reply("Не понял пробег. Например: 125430.");
        return;
      }

      const shiftRef = db.collection("shifts").doc();
      const shift: Shift = {
        driverId: driver.id,
        driverName: driver.data.fullName,
        vehicleLabel: driver.data.vehicleLabel,
        status: "active",
        startMileage: mileage,
        startedAt: Timestamp.now(),
      };

      await db.runTransaction(async (transaction) => {
        const latestDriver = await transaction.get(driver.ref);
        if (latestDriver.data()?.activeShiftId) {
          throw new Error("Driver already has an active shift");
        }

        transaction.create(shiftRef, shift);
        transaction.update(driver.ref, {
          activeShiftId: shiftRef.id,
          botState: { step: "idle" },
        });
      });

      await ctx.reply(
        `Смена начата. Стартовый пробег: ${mileage} км.`,
        activeShiftKeyboard,
      );
      return;
    }

    if (state.step === "awaitingEndMileage") {
      if (mileage === null) {
        await ctx.reply("Не понял пробег. Например: 125780.");
        return;
      }

      const shiftRef = db.collection("shifts").doc(state.shiftId);
      try {
        await db.runTransaction(async (transaction) => {
          const shiftSnapshot = await transaction.get(shiftRef);
          const shift = shiftSnapshot.data() as Shift | undefined;
          if (!shift || shift.status !== "active") {
            throw new Error("Active shift not found");
          }
          if (mileage < shift.startMileage) {
            throw new Error("End mileage is lower than start mileage");
          }

          transaction.update(shiftRef, {
            status: "completed",
            endMileage: mileage,
            distance: mileage - shift.startMileage,
            completedAt: FieldValue.serverTimestamp(),
          });
          transaction.update(driver.ref, {
            activeShiftId: FieldValue.delete(),
            botState: { step: "idle" },
          });
        });
      } catch (error: unknown) {
        if (
          error instanceof Error
          && error.message === "End mileage is lower than start mileage"
        ) {
          await ctx.reply("Конечный пробег не может быть меньше начального.");
          return;
        }
        throw error;
      }

      await ctx.reply(
        `Смена завершена. Конечный пробег: ${mileage} км.`,
        idleKeyboard,
      );
      return;
    }

    await ctx.reply(
      "Выберите действие кнопкой ниже.",
      driver.data.activeShiftId ? activeShiftKeyboard : idleKeyboard,
    );
  });

  bot.catch((error, ctx) => {
    logger.error("Telegram bot update failed", {
      error,
      updateId: ctx.update.update_id,
    });
  });

  return bot;
}
