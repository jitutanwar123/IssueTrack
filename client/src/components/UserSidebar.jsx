import { NavLink } from "react-router-dom";
import { cn } from "../utils/helpers.js";
import virajLogo from "../viraaj.webp";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { to: "/user/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/user/my-tickets", label: "My Tickets", icon: "ticket" },
  { to: "/user/create-ticket", label: "Create Ticket", icon: "plus" },
  { to: "/user/profile", label: "Profile", icon: "user" },
];

function Icon({ name }) {
  const common = "h-5 w-5";
  switch (name) {
    case "grid":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="7" r="4" />
          <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
        </svg>
      );
    default:
      return null;
  }
}

export function UserSidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-navy overflow-y-auto z-50 flex flex-col">
      <div className="px-6 py-6">
        <img
          src={virajLogo}
          alt="Viraj Profiles"
          className="w-full max-w-[180px] h-auto object-contain"
        />
      </div>

      {/* User Portal label */}
      <div className="mx-4 mb-4 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 px-3 py-2 text-center">
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">User Portal</span>
      </div>

      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-4 py-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>

      <div className="px-6 py-4 text-xs text-slate-400">
        Submit and track your support tickets with ease.
      </div>
    </aside>
  );
}
