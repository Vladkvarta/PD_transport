import { useEffect, useState } from "react";

export function useTelegram() {
  const [tg, setTg] = useState<any>(null);

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram) {
      telegram.ready();
      telegram.expand();
      setTg(telegram);
    }
  }, []);

  const user = tg?.initDataUnsafe?.user;

  return {
    tg,
    user,
    initData: tg?.initData || "",
    close: () => tg?.close(),
  };
}
