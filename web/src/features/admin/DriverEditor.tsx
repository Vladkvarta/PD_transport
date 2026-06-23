import { Clipboard, Plus, Save, X } from "lucide-react";
import type { FormEvent } from "react";
import type { DriverDraft, ArchiveTopic, TelegramArchiveSettings } from "../../types";

interface DriverEditorProps {
  draft: DriverDraft;
  updateDraft: <K extends keyof DriverDraft>(key: K, value: DriverDraft[K]) => void;
  onSave: (event: FormEvent) => void;
  onClose: () => void;
  onCopyId: (id: string) => void;
  onCreateTopic: () => void;
  onSelectTopic: (threadId: number) => void;
  topics: ArchiveTopic[];
  archiveSettings: TelegramArchiveSettings | null;
  saving: boolean;
  creatingTopic: boolean;
  notice: string;
  isNew: boolean;
}

export function DriverEditor({
  draft,
  updateDraft,
  onSave,
  onClose,
  onCopyId,
  onCreateTopic,
  onSelectTopic,
  topics,
  archiveSettings,
  saving,
  creatingTopic,
  notice,
  isNew,
}: DriverEditorProps) {
  return (
    <aside className="editor">
      <div className="editor-header">
        <div>
          <span className="eyebrow">
            {isNew ? "Новая карточка" : "Карточка водителя"}
          </span>
          <h2>{draft.fullName || "Новый водитель"}</h2>
        </div>
        <button className="icon-button" onClick={onClose} title="Закрыть">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSave}>
        <div className="form-section">
          <h3>Основное</h3>
          <label>
            ФИО
            <input
              onChange={(event) => updateDraft("fullName", event.target.value)}
              required
              value={draft.fullName}
            />
          </label>
          <div className="field-with-action">
            <label>
              Telegram ID
              <input
                disabled={!isNew}
                onChange={(event) => updateDraft(
                  "telegramUserId",
                  event.target.value.replace(/\D/g, ""),
                )}
                required
                value={draft.telegramUserId}
              />
            </label>
            <button
              className="icon-button copy-field"
              onClick={() => onCopyId(draft.telegramUserId)}
              title="Копировать Telegram ID"
              type="button"
            >
              <Clipboard size={17} />
            </button>
          </div>
          <div className="two-columns">
            <label>
              Телефон
              <input
                onChange={(event) => updateDraft("phone", event.target.value)}
                value={draft.phone}
              />
            </label>
            <label>
              Подразделение
              <input
                onChange={(event) => updateDraft(
                  "department",
                  event.target.value,
                )}
                value={draft.department}
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Автомобиль</h3>
          <div className="two-columns">
            <label>
              Марка и модель
              <input
                onChange={(event) => updateDraft(
                  "vehicleLabel",
                  event.target.value,
                )}
                value={draft.vehicleLabel}
              />
            </label>
            <label>
              Госномер
              <input
                onChange={(event) => updateDraft(
                  "vehiclePlate",
                  event.target.value.toUpperCase(),
                )}
                value={draft.vehiclePlate}
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3>Архив Telegram</h3>
          <div className="archive-group">
            <span>Основная группа</span>
            <strong>
              {archiveSettings?.title ?? "Группа из настроек Firebase"}
            </strong>
            {archiveSettings?.chatId && (
              <code>{archiveSettings.chatId}</code>
            )}
          </div>
          <label>
            Название темы
            <input
              onChange={(event) => updateDraft(
                "archiveTopicName",
                event.target.value,
              )}
              value={draft.archiveTopicName}
            />
          </label>
          <label>
            Тема для документов
            <select
              onChange={(event) => onSelectTopic(Number(event.target.value))}
              required
              value={draft.archiveThreadId || ""}
            >
              <option value="">Выберите тему</option>
              {topics
                .filter((topic) => topic.active)
                .map((topic) => (
                  <option key={topic.id} value={topic.threadId}>
                    {topic.name} · ID {topic.threadId}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="button secondary create-topic"
            disabled={creatingTopic || archiveSettings?.isForum === false}
            onClick={onCreateTopic}
            type="button"
          >
            <Plus size={17} />
            {creatingTopic ? "Создание..." : "Создать тему в группе"}
          </button>
          <small className="field-hint">
            Старые темы появятся после любого сообщения в них.
          </small>
        </div>

        <div className="form-section">
          <label>
            Заметка
            <textarea
              onChange={(event) => updateDraft("notes", event.target.value)}
              rows={3}
              value={draft.notes}
            />
          </label>
          <label className="toggle-row">
            <input
              checked={draft.active}
              onChange={(event) => updateDraft("active", event.target.checked)}
              type="checkbox"
            />
            <span>Водитель активен</span>
          </label>
        </div>

        {notice && (
          <div className={notice.includes("сохранена") ? "notice ok" : "notice"}>
            {notice}
          </div>
        )}

        <div className="editor-actions">
          <button className="button secondary" onClick={onClose} type="button">
            Отмена
          </button>
          <button className="button primary" disabled={saving}>
            <Save size={18} />
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </aside>
  );
}
