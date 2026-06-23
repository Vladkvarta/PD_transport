import { useState } from "react";
import { Mic, Camera, Navigation } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useTelegram } from "../../hooks/useTelegram";
import { VoiceAddressInput } from "./VoiceAddressInput";
import { PhotoUpload } from "./PhotoUpload";
import type { Driver } from "../../types";

interface ShiftControlProps {
  driver: Driver;
}

export function ShiftControl({ driver }: ShiftControlProps) {
  const { initData } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const isShiftActive = !!driver.activeShiftId;

  async function handleStartShift() {
    const mileageStr = prompt("Введите текущий пробег:");
    if (!mileageStr) return;

    const mileage = parseInt(mileageStr.replace(/\D/g, ""), 10);
    if (isNaN(mileage)) return alert("Введите число");

    setLoading(true);
    try {
      const startShiftFn = httpsCallable(functions!, "startShift");
      await startShiftFn({ initData, mileage });
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEndShift() {
    const mileageStr = prompt("Введите конечный пробег:");
    if (!mileageStr) return;

    const mileage = parseInt(mileageStr.replace(/\D/g, ""), 10);
    if (isNaN(mileage)) return alert("Введите число");

    setLoading(true);
    try {
      const finishShiftFn = httpsCallable(functions!, "finishShift");
      await finishShiftFn({ initData, mileage });
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isShiftActive) {
    return (
      <div className="driver-card">
        <h2>Смена не начата</h2>
        <p>Нажмите кнопку ниже, чтобы начать рабочий день и ввести пробег.</p>
        <button
          className="button primary full"
          style={{ marginTop: "20px" }}
          onClick={handleStartShift}
          disabled={loading}
        >
          {loading ? "Запуск..." : "Начать смену"}
        </button>
      </div>
    );
  }

  return (
    <div className="driver-app-content">
      <div className="driver-card highlight">
        <div className="shift-info">
          <span>{driver.vehicleLabel}</span>
          <strong>{driver.vehiclePlate}</strong>
        </div>
        <div className="shift-status">В смене</div>
      </div>

      <div className="action-grid">
        <button className="action-button" onClick={() => setShowVoice(true)}>
          <div className="action-icon voice"><Mic size={28} /></div>
          <span>Куда едем?</span>
        </button>
        <button className="action-button" onClick={() => setShowPhoto(true)}>
          <div className="action-icon doc"><Camera size={28} /></div>
          <span>Фото документа</span>
        </button>
      </div>

      {showVoice && (
        <VoiceAddressInput
          onClose={() => setShowVoice(false)}
          onSuccess={() => {
            setShowVoice(false);
          }}
        />
      )}

      {showPhoto && (
        <PhotoUpload
          onClose={() => setShowPhoto(false)}
          onSuccess={() => {
            setShowPhoto(false);
            alert("Документ отправлен!");
          }}
        />
      )}

      <button
        className="button secondary full"
        style={{ marginTop: "auto" }}
        onClick={handleEndShift}
        disabled={loading}
      >
        {loading ? "Обработка..." : "Завершить смену"}
      </button>
    </div>
  );
}
