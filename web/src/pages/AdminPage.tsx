import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { auth, db, functions, isFirebaseConfigured } from "../firebase";
import { Loading } from "../components/ui/Loading";
import { LoginPage } from "./LoginPage";
import { ConfigMissingPage } from "./ConfigMissingPage";
import { Sidebar } from "../features/admin/Sidebar";
import { PageHeader } from "../features/admin/PageHeader";
import { Toolbar } from "../features/admin/Toolbar";
import { RequestList } from "../features/admin/RequestList";
import { DriverList } from "../features/admin/DriverList";
import { DriverEditor } from "../features/admin/DriverEditor";
import { ShiftHistory } from "../features/admin/history/ShiftHistory";
import { useAdminData } from "../hooks/useAdminData";
import { useHistory } from "../hooks/useHistory";
import type { Driver, DriverDraft, RegistrationRequest } from "../types";

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

export function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(demoMode);

  // States
  const [view, setView] = useState<"requests" | "drivers" | "history">("requests");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [draft, setDraft] = useState<DriverDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  // Data Hooks
  const { requests, drivers, topics, archiveSettings } = useAdminData(user);
  const { shifts } = useHistory();

  useEffect(() => {
    if (demoMode || !auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  );

  const normalizedSearch = search.trim().toLocaleLowerCase("ru");
  const filteredRequests = pendingRequests.filter((r) => {
    const haystack = [r.telegramFirstName, r.telegramLastName, r.telegramUsername, r.telegramUserId]
      .join(" ").toLocaleLowerCase("ru");
    return haystack.includes(normalizedSearch);
  });

  const filteredDrivers = drivers.filter((d) => {
    const haystack = [d.fullName, d.telegramUserId, d.vehicleLabel, d.vehiclePlate]
      .join(" ").toLocaleLowerCase("ru");
    return haystack.includes(normalizedSearch);
  });

  function openRequest(request: RegistrationRequest) {
    setSelectedDriver(null);
    setSelectedRequest(request);
    setDraft({
      ...emptyDraft,
      fullName: [request.telegramFirstName, request.telegramLastName].filter(Boolean).join(" "),
      telegramUserId: request.telegramUserId,
      archiveTopicName: [request.telegramFirstName, request.telegramLastName].filter(Boolean).join(" "),
    });
    setNotice("");
  }

  function openDriver(driver: Driver) {
    setSelectedRequest(null);
    setSelectedDriver(driver);
    setDraft({ ...driver });
    setNotice("");
  }

  async function saveDriver(event: FormEvent) {
    event.preventDefault();
    if (!draft.telegramUserId || !draft.fullName || !draft.archiveThreadId) {
      setNotice("Заполните ФИО, Telegram ID и ID темы.");
      return;
    }
    setSaving(true);
    try {
      if (db) {
        if (selectedRequest) {
          const batch = writeBatch(db);
          batch.set(doc(db, "drivers", draft.telegramUserId), {
            ...draft,
            archiveThreadId: Number(draft.archiveThreadId),
            botState: { step: "idle" },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, "registrationRequests", selectedRequest.id), {
            status: "approved",
            driverId: draft.telegramUserId,
            approvedAt: serverTimestamp(),
          });
          await batch.commit();
        } else {
          await setDoc(doc(db, "drivers", draft.telegramUserId), {
            ...draft,
            archiveThreadId: Number(draft.archiveThreadId),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }
      setNotice("Карточка сохранена.");
      setTimeout(() => { setSelectedDriver(null); setSelectedRequest(null); }, 650);
    } catch {
      setNotice("Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function createTopic() {
    const topicName = draft.archiveTopicName.trim() || draft.fullName.trim();
    if (!topicName || !functions) return;
    setCreatingTopic(true);
    try {
      const callable = httpsCallable<{ name: string }, { threadId: number; name: string }>(functions, "createArchiveTopic");
      const result = await callable({ name: topicName });
      setDraft(prev => ({ ...prev, archiveThreadId: result.data.threadId, archiveTopicName: result.data.name }));
      setNotice("Тема создана.");
    } catch {
      setNotice("Ошибка создания темы.");
    } finally {
      setCreatingTopic(false);
    }
  }

  if (!demoMode && !isFirebaseConfigured) return <ConfigMissingPage />;
  if (!authReady) return <Loading />;
  if (!demoMode && !user) return <LoginPage />;

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        pendingCount={pendingRequests.length}
        userEmail={user?.email}
      />
      <main className="workspace">
        <PageHeader
          view={view}
          count={view === "history" ? shifts.length : (view === "requests" ? pendingRequests.length : drivers.length)}
          onAddDriver={() => { setSelectedRequest(null); setSelectedDriver({ id: "", ...emptyDraft } as Driver); setDraft(emptyDraft); }}
        />
        <Toolbar search={search} setSearch={setSearch} />
        {view === "requests" && (
          <RequestList
            requests={filteredRequests}
            onOpen={openRequest}
            onCopyId={(id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); }}
            copiedId={copiedId}
          />
        )}
        {view === "drivers" && (
          <DriverList drivers={filteredDrivers} onOpen={openDriver} />
        )}
        {view === "history" && (
          <ShiftHistory shifts={shifts} onSelect={(s) => console.log('Select shift', s)} />
        )}
      </main>
      {(selectedRequest || selectedDriver) && (
        <DriverEditor
          archiveSettings={archiveSettings}
          creatingTopic={creatingTopic}
          draft={draft}
          isNew={!!(selectedRequest || (selectedDriver && !selectedDriver.id))}
          notice={notice}
          onClose={() => { setSelectedRequest(null); setSelectedDriver(null); }}
          onCopyId={(id) => { navigator.clipboard.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); }}
          onCreateTopic={createTopic}
          onSave={saveDriver}
          onSelectTopic={(id) => {
            const t = topics.find(topic => topic.threadId === id);
            setDraft(prev => ({ ...prev, archiveThreadId: id, archiveTopicName: t?.name || "" }));
          }}
          saving={saving}
          topics={topics}
          updateDraft={(k, v) => setDraft(prev => ({ ...prev, [k]: v }))}
        />
      )}
    </div>
  );
}
