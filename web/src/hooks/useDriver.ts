import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { Driver } from "../types";

export function useDriver(telegramUserId?: string) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!telegramUserId || !db) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "drivers", telegramUserId),
      (snapshot) => {
        if (snapshot.exists()) {
          setDriver({ id: snapshot.id, ...snapshot.data() } as Driver);
        } else {
          setDriver(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [telegramUserId]);

  return { driver, loading, error };
}
