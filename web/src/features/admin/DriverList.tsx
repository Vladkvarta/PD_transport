import { Pencil } from "lucide-react";
import type { Driver } from "../../types";

interface DriverListProps {
  drivers: Driver[];
  onOpen: (driver: Driver) => void;
}

export function DriverList({ drivers, onOpen }: DriverListProps) {
  return (
    <section className="data-section">
      <div className="table-head driver-grid">
        <span>Водитель</span>
        <span>Автомобиль</span>
        <span>Тема Telegram</span>
        <span>Статус</span>
        <span />
      </div>
      {drivers.map((driver) => (
        <div className="table-row driver-grid" key={driver.id}>
          <div className="person-cell">
            <span className="avatar">{driver.fullName.slice(0, 1)}</span>
            <div>
              <strong>{driver.fullName}</strong>
              <small>{driver.telegramUserId}</small>
            </div>
          </div>
          <div>
            <span>{driver.vehicleLabel || "Не указан"}</span>
            <small>{driver.vehiclePlate}</small>
          </div>
          <div>
            <span>{driver.archiveTopicName || "Без названия"}</span>
            <small>ID {driver.archiveThreadId}</small>
          </div>
          <span className={driver.active ? "status active" : "status"}>
            {driver.active ? "Активен" : "Отключен"}
          </span>
          <button
            className="icon-button"
            onClick={() => onOpen(driver)}
            title="Редактировать"
          >
            <Pencil size={17} />
          </button>
        </div>
      ))}
    </section>
  );
}
