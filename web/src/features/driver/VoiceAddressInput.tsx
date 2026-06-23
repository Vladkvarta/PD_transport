import { useState, useEffect } from "react";
import { Mic, X, Check, Search, MapPin } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { useTelegram } from "../../hooks/useTelegram";

interface VoiceAddressInputProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function VoiceAddressInput({ onClose, onSuccess }: VoiceAddressInputProps) {
  const { initData } = useTelegram();
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Web Speech API Setup
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
      handleSearch(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
  }

  function toggleListening() {
    if (isListening) {
      recognition?.stop();
    } else {
      setText("");
      setResults([]);
      setIsListening(true);
      recognition?.start();
    }
  }

  async function handleSearch(query: string) {
    if (!query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(item: any) {
    setLoading(true);
    try {
      const addTripPointFn = httpsCallable(functions!, "addTripPoint");
      await addTripPointFn({
        initData,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
      });
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
          <h3>Куда едем?</h3>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="voice-input-area">
          <button
            className={`voice-record-btn ${isListening ? 'active' : ''}`}
            onClick={toggleListening}
            disabled={!recognition || loading}
          >
            <Mic size={32} />
          </button>
          <p>{isListening ? "Слушаю..." : (text || "Нажмите на микрофон и скажите адрес")}</p>
        </div>

        {results.length > 0 && (
          <div className="address-results">
            {results.map((item, i) => (
              <button key={i} className="address-item" onClick={() => handleSelect(item)} disabled={loading}>
                <MapPin size={18} />
                <span>{item.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {loading && <div className="loading-small">Обработка...</div>}
        {!recognition && <p className="error">Голосовой ввод не поддерживается вашим браузером</p>}
      </div>
    </div>
  );
}
