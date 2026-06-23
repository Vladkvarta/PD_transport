import { Check, Clipboard, UserPlus } from "lucide-react";
import type { RegistrationRequest } from "../../types";

interface RequestListProps {
  requests: RegistrationRequest[];
  onOpen: (request: RegistrationRequest) => void;
  onCopyId: (id: string) => void;
  copiedId: string | null;
}

function displayTelegramName(request: RegistrationRequest): string {
  return [request.telegramFirstName, request.telegramLastName].filter(Boolean).join(" ");
}

function formatLastSeen(request: RegistrationRequest): string {
  const date = request.lastSeenAt?.toDate();
  if (!date) return "только что";
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RequestList({ requests, onOpen, onCopyId, copiedId }: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <Check size={30} />
        <strong>Новых заявок нет</strong>
      </div>
    );
  }

  return (
    <section className="data-section">
      <div className="table-head request-grid">
        <span>Пользователь</span>
        <span>Telegram ID</span>
        <span>Обращение</span>
        <span />
      </div>
      {requests.map((request) => (
        <div className="table-row request-grid" key={request.id}>
          <div className="person-cell">
            <span className="avatar">
              {request.telegramFirstName.slice(0, 1)}
            </span>
            <div>
              <strong>{displayTelegramName(request)}</strong>
              <small>
                {request.telegramUsername ? `@${request.telegramUsername}` : "без username"}
              </small>
            </div>
          </div>
          <div className="id-cell">
            <code>{request.telegramUserId}</code>
            <button
              className="icon-button compact"
              onClick={() => onCopyId(request.telegramUserId)}
              title="Копировать Telegram ID"
            >
              {copiedId === request.telegramUserId ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <div>
            <span>{formatLastSeen(request)}</span>
            <small>{request.messageCount} сообщ.</small>
          </div>
          <button
            className="button secondary"
            onClick={() => onOpen(request)}
            title="Оформить водителя"
          >
            <UserPlus size={17} />
            <span>Оформить</span>
          </button>
        </div>
      ))}
    </section>
  );
}
