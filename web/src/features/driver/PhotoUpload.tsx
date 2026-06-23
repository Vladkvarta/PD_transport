import { useState } from "react";
import { Camera, X, Upload } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useTelegram } from "../../hooks/useTelegram";

interface PhotoUploadProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PhotoUpload({ onClose, onSuccess }: PhotoUploadProps) {
  const { initData } = useTelegram();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [type, setType] = useState("fuelReceipt");

  const documentTypes = [
    { id: "fuelReceipt", label: "Чек АЗС" },
    { id: "invoice", label: "Накладная" },
    { id: "routeSheet", label: "Маршрутный лист" },
    { id: "other", label: "Другое" },
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Сжатие на клиенте через Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPhoto(dataUrl.split(",")[1]); // Только base64 часть
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!photo) return;
    setLoading(true);
    try {
      const uploadFn = httpsCallable(functions!, "uploadDocument");
      await uploadFn({ initData, type, base64Photo: photo });
      onSuccess();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="voice-modal">
      <div className="voice-modal-content">
        <header>
          <h3>Фото документа</h3>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="form-section">
          <label>Тип документа</label>
          <select value={type} onChange={e => setType(e.target.value)} className="full-select">
            {documentTypes.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="upload-area">
          {!photo ? (
            <label className="camera-btn">
              <Camera size={48} />
              <span>Сделать фото</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} hidden />
            </label>
          ) : (
            <div className="photo-preview">
              <p>Фото готово к отправке</p>
              <button className="button secondary" onClick={() => setPhoto(null)}>Переснять</button>
            </div>
          )}
        </div>

        <button
          className="button primary full"
          disabled={!photo || loading}
          onClick={handleUpload}
        >
          {loading ? "Отправка..." : "Отправить в архив"}
        </button>
      </div>
    </div>
  );
}
