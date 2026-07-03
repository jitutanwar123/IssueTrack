import { NavLink } from "react-router-dom";
import virajLogo from "../viraaj.webp";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid", section: null },
  { to: "/tickets", label: "Tickets", icon: "ticket", section: "Tickets" },
  { to: "/reports", label: "Reports", icon: "chart", section: "Analytics" },
  { to: "/team", label: "Team", icon: "users", section: null },
];

function Icon({ name }) {
  const cls = "h-4 w-4 shrink-0";
  switch (name) {
    case "grid":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19V5M4 19h16" />
          <path d="M8 17v-6M12 17V8M16 17v-3" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M21 20v-1a4 4 0 0 0-3-3.87M16 3.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    default: return null;
  }
}

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto"
      style={{
        width: "var(--sidebar-width, 15rem)",
        background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <img
          src={virajLogo}
          alt="Viraj Profiles"
          className="w-full max-w-[160px] h-auto object-contain"
        />
      </div>

      {/* Portal label */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">Admin Command Center</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {/* Overview section */}
        <p className="sidebar-section-label mt-2 mb-1.5">Overview</p>
        {navItems.slice(0, 1).map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}

        <p className="sidebar-section-label mt-4 mb-1.5">Manage</p>
        {navItems.slice(1, 2).map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}

        <p className="sidebar-section-label mt-4 mb-1.5">Analytics</p>
        {navItems.slice(2).map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.58)" }}>
          Incident · Service Request · Change · Problem
        </p>
      </div>
    </aside>
  );
}

function SidebarLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "text-white"
            : "hover:text-white"
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? "rgba(37,99,235,0.18)" : "transparent",
        color: isActive ? "#ffffff" : "rgba(148,163,184,0.85)",
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
              style={{ background: "#60a5fa" }}
            />
          )}
          <span style={{ color: isActive ? "#60a5fa" : "inherit" }}>
            <Icon name={item.icon} />
          </span>
          {item.label}
        </>
      )}
    </NavLink>
  );
}
