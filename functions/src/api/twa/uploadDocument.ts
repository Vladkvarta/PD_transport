import { HttpsError, onCall } from "firebase-functions/v2/https";
import { archiveChatId, telegramBotToken } from "../../config.js";
import { validateInitData } from "../../middleware/validateInitData.js";
import { db } from "../../firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import { Telegraf } from "telegraf";

export const uploadDocument = onCall(
  { region: "europe-west1", secrets: [telegramBotToken], memory: "512MiB" },
  async (request) => {
    const { initData, type, base64Photo } = request.data;

    if (!validateInitData(initData, telegramBotToken.value())) {
      throw new HttpsError("unauthenticated", "Invalid Telegram data");
    }

    const urlParams = new URLSearchParams(initData);
    const user = JSON.parse(urlParams.get("user") || "{}");
    const telegramUserId = user.id?.toString();

    const driverDoc = await db.collection("drivers").doc(telegramUserId).get();
    const driverData = driverDoc.data();
    if (!driverData) throw new HttpsError("not-found", "Driver not found");

    const activeShiftId = driverData.activeShiftId;
    if (!activeShiftId) throw new HttpsError("failed-precondition", "No active shift");

    const bot = new Telegraf(telegramBotToken.value());
    const photoBuffer = Buffer.from(base64Photo, 'base64');

    const caption = `<b>Документ: ${type}</b>\nВодитель: ${driverData.fullName}`;

    const targetChatId = archiveChatId.value();
    const threadId = driverData.archiveThreadId;

    const sent = await bot.telegram.sendPhoto(
      targetChatId,
      { source: photoBuffer },
      {
        message_thread_id: threadId,
        caption,
        parse_mode: "HTML"
      } as any
    );

    await db.collection("documents").add({
      driverId: telegramUserId,
      shiftId: activeShiftId,
      type,
      archiveMessageId: (sent as any).message_id,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true };
  }
);
