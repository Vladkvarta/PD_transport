import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { demoDrivers, demoRequests, demoTopics } from "../demo";
import type {
  ArchiveTopic,
  Driver,
  RegistrationRequest,
  TelegramArchiveSettings,
} from "../types";

const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

export function useAdminData(user: any) {
  const [requests, setRequests] = useState<RegistrationRequest[]>(
    demoMode ? demoRequests : [],
  );
  const [drivers, setDrivers] = useState<Driver[]>(
    demoMode ? demoDrivers : [],
  );
  const [topics, setTopics] = useState<ArchiveTopic[]>(
    demoMode ? demoTopics : [],
  );
  const [archiveSettings, setArchiveSettings] =
    useState<TelegramArchiveSettings | null>(
      demoMode
        ? {
            chatId: "-1001234567890",
            title: "Архив маршрутных листов",
            isForum: true,
          }
        : null,
    );

  useEffect(() => {
    if (demoMode || !user || !db) {
      return;
    }

    const unsubscribeRequests = onSnapshot(
      query(collection(db, "registrationRequests"), orderBy("lastSeenAt", "desc")),
      (snapshot) => {
        setRequests(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as RegistrationRequest[]);
      },
    );
    const unsubscribeDrivers = onSnapshot(
      query(collection(db, "drivers"), orderBy("fullName")),
      (snapshot) => {
        setDrivers(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Driver[]);
      },
    );
    const unsubscribeTopics = onSnapshot(
      query(collection(db, "archiveTopics"), orderBy("name")),
      (snapshot) => {
        setTopics(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as ArchiveTopic[]);
      },
    );
    const unsubscribeSettings = onSnapshot(
      doc(db, "appSettings", "telegramArchive"),
      (snapshot) => {
        setArchiveSettings(
          snapshot.exists()
            ? snapshot.data() as TelegramArchiveSettings
            : null,
        );
      },
    );

    return () => {
      unsubscribeRequests();
      unsubscribeDrivers();
      unsubscribeTopics();
      unsubscribeSettings();
    };
  }, [user]);

  return { requests, drivers, topics, archiveSettings, setRequests, setDrivers, setTopics };
}
