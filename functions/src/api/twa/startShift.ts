import { HttpsError, onCall } from "firebase-functions/v2/https";
import { telegramBotToken } from "../../config.js";
import { validateInitData } from "../../middleware/validateInitData.js";
import { db } from "../../firebase.js";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export const startShift = onCall(
  { region: "europe-west1", secrets: [telegramBotToken] },
  async (request) => {
    const { initData, mileage } = request.data;

    if (!validateInitData(initData, telegramBotToken.value())) {
      throw new HttpsError("unauthenticated", "Invalid Telegram data");
    }

    const urlParams = new URLSearchParams(initData);
    const user = JSON.parse(urlParams.get("user") || "{}");
    const telegramUserId = user.id?.toString();

    const driverDoc = await db.collection("drivers").doc(telegramUserId).get();
    if (!driverDoc.exists) throw new HttpsError("not-found", "Driver not found");
    if (driverDoc.data()?.activeShiftId) throw new HttpsError("failed-precondition", "Shift already active");

    const shiftRef = db.collection("shifts").doc();
    const shift = {
      driverId: telegramUserId,
      driverName: driverDoc.data()?.fullName,
      vehicleLabel: driverDoc.data()?.vehicleLabel,
      startMileage: Number(mileage),
      status: "active",
      startedAt: Timestamp.now(),
      startThreadId: driverDoc.data()?.archiveThreadId,
    };

    await db.runTransaction(async (t) => {
      t.create(shiftRef, shift);
      t.update(driverDoc.ref, { activeShiftId: shiftRef.id });
    });

    return { shiftId: shiftRef.id };
  }
);
