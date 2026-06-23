import { HttpsError, onCall } from "firebase-functions/v2/https";
import { telegramBotToken } from "../../config.js";
import { validateInitData } from "../../middleware/validateInitData.js";
import { db } from "../../firebase.js";
import { FieldValue } from "firebase-admin/firestore";
import { getOSRMDistance } from "../../domain/routing.js";

export const addTripPoint = onCall(
  { region: "europe-west1", secrets: [telegramBotToken] },
  async (request) => {
    const { initData, address, lat, lon } = request.data;

    if (!validateInitData(initData, telegramBotToken.value())) {
      throw new HttpsError("unauthenticated", "Invalid Telegram data");
    }

    const urlParams = new URLSearchParams(initData);
    const userString = urlParams.get("user");
    if (!userString) throw new HttpsError("unauthenticated", "No user data");

    const user = JSON.parse(userString);
    const telegramUserId = user.id?.toString();

    const driverDoc = await db.collection("drivers").doc(telegramUserId).get();
    const driverData = driverDoc.data();
    if (!driverData) throw new HttpsError("not-found", "Driver not found");

    const activeShiftId = driverData.activeShiftId as string | undefined;
    if (!activeShiftId) throw new HttpsError("failed-precondition", "No active shift");

    const lastTripSnap = await db.collection("trips")
      .where("shiftId", "==", activeShiftId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let distanceFromPrev = 0;
    let durationFromPrev = 0;

    if (!lastTripSnap.empty && lastTripSnap.docs[0]) {
      const prev = lastTripSnap.docs[0].data();
      if (prev && typeof prev.lat === 'number' && typeof prev.lon === 'number') {
        const route = await getOSRMDistance(prev.lat, prev.lon, lat, lon);
        distanceFromPrev = route.distance;
        durationFromPrev = route.duration;
      }
    }

    const tripRef = db.collection("trips").doc();

    await tripRef.set({
      driverId: telegramUserId,
      shiftId: activeShiftId,
      address,
      lat,
      lon,
      distanceFromPrev,
      durationFromPrev,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, distance: distanceFromPrev };
  }
);
