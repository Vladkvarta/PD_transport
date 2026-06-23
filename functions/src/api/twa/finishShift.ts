import { HttpsError, onCall } from "firebase-functions/v2/https";
import { telegramBotToken } from "../../config.js";
import { validateInitData } from "../../middleware/validateInitData.js";
import { db } from "../../firebase.js";
import { FieldValue } from "firebase-admin/firestore";

export const finishShift = onCall(
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
    const activeShiftId = driverDoc.data()?.activeShiftId;
    if (!activeShiftId) throw new HttpsError("failed-precondition", "No active shift");

    const shiftRef = db.collection("shifts").doc(activeShiftId);

    await db.runTransaction(async (t) => {
      const shiftSnap = await t.get(shiftRef);
      const shiftData = shiftSnap.data();
      if (!shiftData) throw new Error("Shift not found");

      const tripsSnap = await db.collection("trips")
        .where("shiftId", "==", activeShiftId)
        .get();

      let totalTripDistance = 0;
      tripsSnap.forEach(doc => {
        totalTripDistance += doc.data().distanceFromPrev || 0;
      });

      const startMileage = shiftData.startMileage;
      const endMileage = Number(mileage);

      if (endMileage < startMileage) {
        throw new Error("End mileage cannot be less than start mileage");
      }

      t.update(shiftRef, {
        status: "completed",
        endMileage,
        distance: endMileage - startMileage,
        totalTripDistance: Math.round(totalTripDistance * 100) / 100,
        completedAt: FieldValue.serverTimestamp(),
      });

      t.update(driverDoc.ref, {
        activeShiftId: FieldValue.delete()
      });
    });

    return { ok: true };
  }
);
