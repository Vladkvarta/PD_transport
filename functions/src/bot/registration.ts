import { FieldValue } from "firebase-admin/firestore";
import type { Context } from "telegraf";
import { db } from "../firebase.js";

export async function captureRegistrationRequest(ctx: Context): Promise<void> {
  const sender = ctx.from;
  const chat = ctx.chat;
  if (!sender || !chat || chat.type !== "private") {
    return;
  }

  const telegramUserId = sender.id.toString();
  const driverById = await db.collection("drivers").doc(telegramUserId).get();
  if (driverById.exists) {
    return;
  }

  const legacyDriver = await db
    .collection("drivers")
    .where("telegramUserId", "==", telegramUserId)
    .limit(1)
    .get();
  if (!legacyDriver.empty) {
    return;
  }

  const requestRef = db.collection("registrationRequests").doc(telegramUserId);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(requestRef);
    const profile = {
      telegramUserId,
      telegramChatId: chat.id.toString(),
      telegramUsername: sender.username ?? null,
      telegramFirstName: sender.first_name,
      telegramLastName: sender.last_name ?? null,
      languageCode: sender.language_code ?? null,
      lastSeenAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
    };

    if (current.exists) {
      transaction.update(requestRef, profile);
      return;
    }

    transaction.create(requestRef, {
      ...profile,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
