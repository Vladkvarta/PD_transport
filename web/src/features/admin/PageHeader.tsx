import { Plus } from "lucide-react";

interface PageHeaderProps {
  view: "requests" | "drivers" | "history";
  count: number;
  onAddDriver: () => void;
}

export function PageHeader({ view, count, onAddDriver }: PageHeaderProps) {
  const titles = {
    requests: "Заявки из Telegram",
    drivers: "Водители",
    history: "История смен",
  };

  const subtitles = {
    requests: `${count} ожидают оформления`,
    drivers: `${count} в базе`,
    history: `${count} записей`,
  };

  return (
    <header className="page-header">
      <div>
        <h1>{titles[view]}</h1>
        <p>{subtitles[view]}</p>
      </div>
      {view === "drivers" && (
        <button className="button primary" onClick={onAddDriver}>
          <Plus size={18} />
          Добавить
        </button>
      )}
    </header>
  );
}
