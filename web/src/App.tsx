import {
  Check,
  Clipboard,
  Inbox,
  LogOut,
  Pencil,
  Plus,
  Save,
  Search,
  Truck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { demoDrivers, demoRequests, demoTopics } from "./demo";
import {
  auth,
  db,
  functions,
  isFirebaseConfigured,
} from "./firebase";
import type {
  ArchiveTopic,
  Driver,
  DriverDraft,
  RegistrationRequest,
  TelegramArchiveSettings,
} from "./types";

const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

const emptyDraft: DriverDraft = {
  fullName: "",
  telegramUserId: "",
  phone: "",
  department: "",
  vehicleLabel: "",
  vehiclePlate: "",
  archiveTopicName: "",
  archiveThreadId: 0,
  notes: "",
  active: true,
};

function displayTelegramName(request: RegistrationRequest): string {
  return [
    request.telegramFirstName,
    request.telegramLastName,
  ].filter(Boolean).join(" ");
}

function requestToDraft(request: RegistrationRequest): DriverDraft {
  const fullName = displayTelegramName(request);
  return {
    ...emptyDraft,
    fullName,
    telegramUserId: request.telegramUserId,
    archiveTopicName: fullName,
  };
}

function formatLastSeen(request: RegistrationRequest): string {
  const date = request.lastSeenAt?.toDate();
  if (!date) {
    return "только что";
  }

  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!auth) {
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setError("Не удалось войти. Проверьте почту и пароль.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-panel" onSubmit={submit}>
        <div className="brand-mark"><Truck size={24} /></div>
        <h1>Маршрутные листы</h1>
        <p>Вход для менеджера</p>
        <label>
          Электронная почта
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Пароль
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary full" disabled={submitting}>
          {submitting ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}

function ConfigMissing() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand-mark"><Truck size={24} /></div>
        <h1>Нужна настройка Firebase</h1>
        <p>Заполните переменные из файла web/.env.example.</p>
      </section>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(demoMode);
  const [requests, setRequests] = useState<RegistrationRequest[]>(
    demoMode ? demoRequests : [],
  );
  const [drivers, setDrivers] = useState<Driver[]>(
    demoMode ? demoDrivers : [],
  );
  const [topics, setTopics] = useState<ArchiveTopic[]>(
    demoMode ? demoTopics : [],
  );
  const [archiveSettings, setArchiveSettings] =
    useState<TelegramArchiveSettings | null>(
      demoMode
        ? {
            chatId: "-1001234567890",
            title: "Архив маршрутных листов",
            isForum: true,
          }
        : null,
    );
  const [view, setView] = useState<"requests" | "drivers">("requests");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<RegistrationRequest | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [draft, setDraft] = useState<DriverDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (demoMode || !auth) {
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (
      demoMode
      && new URLSearchParams(window.location.search).get("open") === "request"
    ) {
      openRequest(demoRequests[0]);
    }
  }, []);

  useEffect(() => {
    if (demoMode || !user || !db) {
      return;
    }

    const unsubscribeRequests = onSnapshot(
      query(collection(db, "registrationRequests"), orderBy("lastSeenAt", "desc")),
      (snapshot) => {
        setRequests(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as RegistrationRequest[]);
      },
    );
    const unsubscribeDrivers = onSnapshot(
      query(collection(db, "drivers"), orderBy("fullName")),
      (snapshot) => {
        setDrivers(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Driver[]);
      },
    );
    const unsubscribeTopics = onSnapshot(
      query(collection(db, "archiveTopics"), orderBy("name")),
      (snapshot) => {
        setTopics(snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as ArchiveTopic[]);
      },
    );
    const unsubscribeSettings = onSnapshot(
      doc(db, "appSettings", "telegramArchive"),
      (snapshot) => {
        setArchiveSettings(
          snapshot.exists()
            ? snapshot.data() as TelegramArchiveSettings
            : null,
        );
      },
    );

    return () => {
      unsubscribeRequests();
      unsubscribeDrivers();
      unsubscribeTopics();
      unsubscribeSettings();
    };
  }, [user]);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests],
  );
  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const filteredRequests = pendingRequests.filter((request) => {
    const haystack = [
      displayTelegramName(request),
      request.telegramUsername,
      request.telegramUserId,
    ].join(" ").toLocaleLowerCase("ru");
    return haystack.includes(normalizedSearch);
  });
  const filteredDrivers = drivers.filter((driver) => {
    const haystack = [
      driver.fullName,
      driver.telegramUserId,
      driver.vehicleLabel,
      driver.vehiclePlate,
    ].join(" ").toLocaleLowerCase("ru");
    return haystack.includes(normalizedSearch);
  });

  function openRequest(request: RegistrationRequest) {
    setSelectedDriver(null);
    setSelectedRequest(request);
    setDraft(requestToDraft(request));
    setNotice("");
  }

  function openDriver(driver: Driver) {
    setSelectedRequest(null);
    setSelectedDriver(driver);
    setDraft({
      fullName: driver.fullName,
      telegramUserId: driver.telegramUserId,
      phone: driver.phone ?? "",
      department: driver.department ?? "",
      vehicleLabel: driver.vehicleLabel ?? "",
      vehiclePlate: driver.vehiclePlate ?? "",
      archiveTopicName: driver.archiveTopicName ?? "",
      archiveThreadId: driver.archiveThreadId ?? 0,
      notes: driver.notes ?? "",
      active: driver.active,
    });
    setNotice("");
  }

  function closeEditor() {
    setSelectedRequest(null);
    setSelectedDriver(null);
    setDraft(emptyDraft);
  }

  async function copyTelegramId(id: string) {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  function updateDraft<K extends keyof DriverDraft>(
    key: K,
    value: DriverDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveDriver(event: FormEvent) {
    event.preventDefault();
    if (!draft.telegramUserId || !draft.fullName || !draft.archiveThreadId) {
      setNotice("Заполните ФИО, Telegram ID и ID темы.");
      return;
    }

    setSaving(true);
    setNotice("");
    const driver: Driver = {
      id: draft.telegramUserId,
      ...draft,
      archiveThreadId: Number(draft.archiveThreadId),
    };

    try {
      if (demoMode) {
        setDrivers((current) => {
          const exists = current.some((item) => item.id === driver.id);
          return exists
            ? current.map((item) => item.id === driver.id ? driver : item)
            : [driver, ...current];
        });
        if (selectedRequest) {
          setRequests((current) => current.map((item) => (
            item.id === selectedRequest.id
              ? { ...item, status: "approved" }
              : item
          )));
        }
      } else if (db) {
        if (selectedRequest) {
          const batch = writeBatch(db);
          batch.set(doc(db, "drivers", driver.id), {
            ...draft,
            archiveThreadId: Number(draft.archiveThreadId),
            botState: { step: "idle" },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, "registrationRequests", selectedRequest.id), {
            status: "approved",
            driverId: driver.id,
            approvedAt: serverTimestamp(),
          });
          await batch.commit();
        } else {
          await setDoc(doc(db, "drivers", driver.id), {
            ...draft,
            archiveThreadId: Number(draft.archiveThreadId),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }

      setNotice("Карточка сохранена.");
      window.setTimeout(closeEditor, 650);
    } catch {
      setNotice("Не удалось сохранить карточку.");
    } finally {
      setSaving(false);
    }
  }

  async function createTopic() {
    const topicName = draft.archiveTopicName.trim() || draft.fullName.trim();
    if (!topicName) {
      setNotice("Сначала укажите ФИО или название темы.");
      return;
    }

    setCreatingTopic(true);
    setNotice("");
    try {
      if (demoMode) {
        const threadId = Math.max(0, ...topics.map((topic) => topic.threadId)) + 1;
        const topic: ArchiveTopic = {
          id: threadId.toString(),
          threadId,
          name: topicName,
          groupTitle: archiveSettings?.title,
          active: true,
        };
        setTopics((current) => [...current, topic].sort(
          (left, right) => left.name.localeCompare(right.name, "ru"),
        ));
        updateDraft("archiveThreadId", threadId);
        updateDraft("archiveTopicName", topicName);
      } else if (functions) {
        const callable = httpsCallable<
          { name: string },
          { threadId: number; name: string }
        >(functions, "createArchiveTopic");
        const result = await callable({ name: topicName });
        updateDraft("archiveThreadId", result.data.threadId);
        updateDraft("archiveTopicName", result.data.name);
      }
      setNotice("Тема создана и выбрана.");
    } catch {
      setNotice(
        "Не удалось создать тему. Проверьте права бота на управление темами.",
      );
    } finally {
      setCreatingTopic(false);
    }
  }

  function selectTopic(threadId: number) {
    const topic = topics.find((item) => item.threadId === threadId);
    updateDraft("archiveThreadId", threadId);
    updateDraft("archiveTopicName", topic?.name ?? "");
  }

  if (!demoMode && !isFirebaseConfigured) {
    return <ConfigMissing />;
  }
  if (!authReady) {
    return <div className="loading">Загрузка...</div>;
  }
  if (!demoMode && !user) {
    return <Login />;
  }

  const editorOpen = Boolean(selectedRequest || selectedDriver);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Truck size={22} /></div>
          <div>
            <strong>Маршрутные листы</strong>
            <span>Панель менеджера</span>
          </div>
        </div>

        <nav>
          <button
            className={view === "requests" ? "nav-item active" : "nav-item"}
            onClick={() => setView("requests")}
          >
            <Inbox size={19} />
            <span>Заявки</span>
            {pendingRequests.length > 0 && (
              <b className="counter">{pendingRequests.length}</b>
            )}
          </button>
          <button
            className={view === "drivers" ? "nav-item active" : "nav-item"}
            onClick={() => setView("drivers")}
          >
            <Users size={19} />
            <span>Водители</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="account">
            <span>Менеджер</span>
            <small>{demoMode ? "demo@company.ua" : user?.email}</small>
          </div>
          <button
            className="icon-button"
            onClick={() => auth && signOut(auth)}
            title="Выйти"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="page-header">
          <div>
            <h1>{view === "requests" ? "Заявки из Telegram" : "Водители"}</h1>
            <p>
              {view === "requests"
                ? `${pendingRequests.length} ожидают оформления`
                : `${drivers.length} в базе`}
            </p>
          </div>
          {view === "drivers" && (
            <button
              className="button primary"
              onClick={() => {
                setSelectedRequest(null);
                setSelectedDriver({
                  id: "",
                  ...emptyDraft,
                });
                setDraft(emptyDraft);
              }}
            >
              <Plus size={18} />
              Добавить
            </button>
          )}
        </header>

        <div className="toolbar">
          <Search size={18} />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск"
            value={search}
          />
        </div>

        {view === "requests" ? (
          <section className="data-section">
            <div className="table-head request-grid">
              <span>Пользователь</span>
              <span>Telegram ID</span>
              <span>Обращение</span>
              <span />
            </div>
            {filteredRequests.length === 0 ? (
              <div className="empty-state">
                <Check size={30} />
                <strong>Новых заявок нет</strong>
              </div>
            ) : filteredRequests.map((request) => (
              <div className="table-row request-grid" key={request.id}>
                <div className="person-cell">
                  <span className="avatar">
                    {request.telegramFirstName.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{displayTelegramName(request)}</strong>
                    <small>
                      {request.telegramUsername
                        ? `@${request.telegramUsername}`
                        : "без username"}
                    </small>
                  </div>
                </div>
                <div className="id-cell">
                  <code>{request.telegramUserId}</code>
                  <button
                    className="icon-button compact"
                    onClick={() => copyTelegramId(request.telegramUserId)}
                    title="Копировать Telegram ID"
                  >
                    {copiedId === request.telegramUserId
                      ? <Check size={16} />
                      : <Clipboard size={16} />}
                  </button>
                </div>
                <div>
                  <span>{formatLastSeen(request)}</span>
                  <small>{request.messageCount} сообщ.</small>
                </div>
                <button
                  className="button secondary"
                  onClick={() => openRequest(request)}
                  title="Оформить водителя"
                >
                  <UserPlus size={17} />
                  <span>Оформить</span>
                </button>
              </div>
            ))}
          </section>
        ) : (
          <section className="data-section">
            <div className="table-head driver-grid">
              <span>Водитель</span>
              <span>Автомобиль</span>
              <span>Тема Telegram</span>
              <span>Статус</span>
              <span />
            </div>
            {filteredDrivers.map((driver) => (
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
                  onClick={() => openDriver(driver)}
                  title="Редактировать"
                >
                  <Pencil size={17} />
                </button>
              </div>
            ))}
          </section>
        )}
      </main>

      {editorOpen && (
        <aside className="editor">
          <div className="editor-header">
            <div>
              <span className="eyebrow">
                {selectedRequest ? "Новая карточка" : "Карточка водителя"}
              </span>
              <h2>{draft.fullName || "Новый водитель"}</h2>
            </div>
            <button className="icon-button" onClick={closeEditor} title="Закрыть">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={saveDriver}>
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
                    disabled={Boolean(selectedRequest || selectedDriver?.id)}
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
                  onClick={() => copyTelegramId(draft.telegramUserId)}
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
                  onChange={(event) => selectTopic(Number(event.target.value))}
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
                onClick={createTopic}
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
              <button className="button secondary" onClick={closeEditor} type="button">
                Отмена
              </button>
              <button className="button primary" disabled={saving}>
                <Save size={18} />
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        </aside>
      )}
    </div>
  );
}
