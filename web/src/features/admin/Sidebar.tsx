import { Inbox, LogOut, Users, History } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { Brand } from "../../components/ui/Brand";

const demoMode = import.meta.env.VITE_DEMO_MODE === "true";

interface SidebarProps {
  view: "requests" | "drivers" | "history";
  setView: (view: "requests" | "drivers" | "history") => void;
  pendingCount: number;
  userEmail?: string | null;
}

export function Sidebar({ view, setView, pendingCount, userEmail }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Brand />

      <nav>
        <button
          className={view === "requests" ? "nav-item active" : "nav-item"}
          onClick={() => setView("requests")}
        >
          <Inbox size={19} />
          <span>Заявки</span>
          {pendingCount > 0 && (
            <b className="counter">{pendingCount}</b>
          )}
        </button>
        <button
          className={view === "drivers" ? "nav-item active" : "nav-item"}
          onClick={() => setView("drivers")}
        >
          <Users size={19} />
          <span>Водители</span>
        </button>
        <button
          className={view === "history" ? "nav-item active" : "nav-item"}
          onClick={() => setView("history")}
        >
          <History size={19} />
          <span>История смен</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="account">
          <span>Менеджер</span>
          <small>{demoMode ? "demo@company.ua" : userEmail}</small>
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
  );
}
