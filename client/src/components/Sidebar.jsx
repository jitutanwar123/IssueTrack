import { NavLink } from "react-router-dom";
import { cn } from "../utils/helpers.js";
import virajLogo from "../viraj.jpg";   // adjust path if needed

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/tickets", label: "Tickets", icon: "ticket" },
  { to: "/tickets/new", label: "Create Ticket", icon: "plus" },
  { to: "/reports", label: "Reports", icon: "chart" },
  { to: "/team", label: "Team", icon: "users" },
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
    case "chart":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19V5M4 19h16" strokeLinecap="round" />
          <path d="M8 17v-6M12 17V8M16 17v-3" strokeLinecap="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M21 20v-1a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-navy overflow-y-auto z-50">
      <div className="px-6 py-6">
  <img
    src={virajLogo}
    alt="Viraj Profiles"
    className="w-full max-w-[180px] h-auto object-contain"
  />
</div>
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
      <div className="px-6 py-6 text-xs text-slate-400">
        Desk-first layout for incident, service request, and change workflows.
      </div>
    </aside>
  );
} 