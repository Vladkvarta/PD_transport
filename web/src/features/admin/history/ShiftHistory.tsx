import { History, Map as MapIcon, Clock, Truck } from "lucide-react";
import type { Shift } from "../../../types";

interface ShiftHistoryProps {
  shifts: any[];
  onSelect: (shift: any) => void;
}

export function ShiftHistory({ shifts, onSelect }: ShiftHistoryProps) {
  if (shifts.length === 0) {
    return <div className="empty-state">Смен пока нет</div>;
  }

  return (
    <section className="data-section">
      <div className="table-head history-grid">
        <span>Водитель</span>
        <span>Дата</span>
        <span>Пробег (км)</span>
        <span>Дистанция</span>
        <span />
      </div>
      {shifts.map((shift) => (
        <div className="table-row history-grid" key={shift.id}>
          <div className="person-cell">
            <strong>{shift.driverName}</strong>
            <small>{shift.vehicleLabel}</small>
          </div>
          <div>
            <span>{shift.startedAt?.toDate()?.toLocaleDateString()}</span>
            <small>{shift.startedAt?.toDate()?.toLocaleTimeString()} - {shift.completedAt?.toDate()?.toLocaleTimeString()}</small>
          </div>
          <div>
            <span>{shift.startMileage} → {shift.endMileage || '...'}</span>
          </div>
          <div>
            <span className="distance-badge">{shift.distance || 0} км</span>
          </div>
          <button className="icon-button" onClick={() => onSelect(shift)}>
            <MapIcon size={18} />
          </button>
        </div>
      ))}
    </section>
  );
}
