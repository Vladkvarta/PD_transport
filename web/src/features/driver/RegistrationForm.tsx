import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

interface RegistrationFormProps {
  telegramUserId: string;
  telegramUser: any;
}

export function RegistrationForm({ telegramUserId, telegramUser }: RegistrationFormProps) {
  const [fullName, setFullName] = useState(
    [telegramUser?.first_name, telegramUser?.last_name].filter(Boolean).join(" ")
  );
  const [phone, setPhone] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db) return;
    setSubmitting(true);
    try {
      await setDoc(doc(db, "registrationRequests", telegramUserId), {
        telegramUserId,
        telegramFirstName: telegramUser?.first_name || "",
        telegramLastName: telegramUser?.last_name || null,
        telegramUsername: telegramUser?.username || null,
        fullName,
        phone,
        vehicleLabel,
        vehiclePlate: vehiclePlate.toUpperCase(),
        status: "pending",
        messageCount: 1,
        createdAt: serverTimestamp(),
        lastSeenAt: serverTimestamp(),
      });
      setDone(true);
    } catch (err) {
      alert("Ошибка при регистрации. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="driver-card">
        <h2>Заявка отправлена</h2>
        <p>Менеджер проверит ваши данные и активирует доступ. Обычно это занимает не более часа.</p>
      </div>
    );
  }

  return (
    <div className="driver-card">
      <h2>Регистрация водителя</h2>
      <p>Заполните данные для начала работы</p>
      <form onSubmit={handleSubmit}>
        <label>
          ФИО
          <input value={fullName} onChange={e => setFullName(e.target.value)} required />
        </label>
        <label>
          Телефон
          <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+380..." />
        </label>
        <label>
          Автомобиль (Марка/Модель)
          <input value={vehicleLabel} onChange={e => setVehicleLabel(e.target.value)} required placeholder="Toyota Camry" />
        </label>
        <label>
          Госномер
          <input value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value.toUpperCase())} required placeholder="AA0000BB" />
        </label>
        <button className="button primary full" disabled={submitting}>
          {submitting ? "Отправка..." : "Зарегистрироваться"}
        </button>
      </form>
    </div>
  );
}
