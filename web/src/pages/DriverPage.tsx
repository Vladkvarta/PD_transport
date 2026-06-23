import { useTelegram } from "../hooks/useTelegram";
import { useDriver } from "../hooks/useDriver";
import { Loading } from "../components/ui/Loading";
import { RegistrationForm } from "../features/driver/RegistrationForm";
import { ShiftControl } from "../features/driver/ShiftControl";

export function DriverPage() {
  const { user } = useTelegram();
  const telegramUserId = user?.id?.toString();
  const { driver, loading } = useDriver(telegramUserId);

  if (loading) return <Loading />;

  // Если пользователя нет в системе вообще
  if (!telegramUserId) {
    return (
      <div className="driver-card">
        <h2>Доступ ограничен</h2>
        <p>Пожалуйста, откройте это приложение через официального бота.</p>
      </div>
    );
  }

  // Если водитель не найден в коллекции drivers
  if (!driver) {
    return (
      <div className="driver-app-container">
        <RegistrationForm telegramUserId={telegramUserId} telegramUser={user} />
      </div>
    );
  }

  // Если водитель деактивирован
  if (!driver.active) {
    return (
      <div className="driver-card">
        <h2>Аккаунт отключен</h2>
        <p>Ваш доступ был временно ограничен менеджером. Свяжитесь с администрацией.</p>
      </div>
    );
  }

  return (
    <div className="driver-app-container">
      <header className="driver-header">
        <div className="driver-profile">
          <span className="avatar-sm">{driver.fullName.slice(0, 1)}</span>
          <div>
            <strong>{driver.fullName}</strong>
            <small>ID {telegramUserId}</small>
          </div>
        </div>
      </header>

      <main className="driver-main">
        <ShiftControl driver={driver} />
      </main>
    </div>
  );
}
