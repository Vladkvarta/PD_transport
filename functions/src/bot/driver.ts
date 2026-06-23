import type { Context } from "telegraf";
import { db } from "../firebase.js";
import type { BotState, Driver } from "../types.js";

export interface DriverContext {
  id: string;
  ref: FirebaseFirestore.DocumentReference<Driver>;
  data: Driver;
}

export async function findDriver(ctx: Context): Promise<DriverContext | null> {
  const telegramUserId = ctx.from?.id.toString();
  if (!telegramUserId) {
    return null;
  }

  const directDocument = await db
    .collection("drivers")
    .doc(telegramUserId)
    .get();
  if (directDocument.exists && directDocument.data()?.active === true) {
    return {
      id: directDocument.id,
      ref: directDocument.ref as FirebaseFirestore.DocumentReference<Driver>,
      data: directDocument.data() as Driver,
    };
  }

  const snapshot = await db
    .collection("drivers")
    .where("telegramUserId", "==", telegramUserId)
    .where("active", "==", true)
    .limit(1)
    .get();

  const document = snapshot.docs[0];
  if (!document) {
    return null;
  }

  return {
    id: document.id,
    ref: document.ref as FirebaseFirestore.DocumentReference<Driver>,
    data: document.data() as Driver,
  };
}

export async function setBotState(
  driver: DriverContext,
  state: BotState,
): Promise<void> {
  await driver.ref.update({ botState: state });
  driver.data.botState = state;
}
