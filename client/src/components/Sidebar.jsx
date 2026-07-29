import { NavLink } from "react-router-dom";
import virajLogo from "../viraaj.webp";
import { useTheme } from "../context/ThemeContext.jsx";

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

export function Sidebar({ open, onClose }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "var(--sidebar-width-fixed, 15rem)",
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
          <p className="sidebar-section-label mt-2 mb-1.5">Overview</p>
          {navItems.slice(0, 1).map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} />
          ))}

          <p className="sidebar-section-label mt-4 mb-1.5">Manage</p>
          {navItems.slice(1, 2).map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} />
          ))}

          <p className="sidebar-section-label mt-4 mb-1.5">Analytics</p>
          {navItems.slice(2).map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover:bg-white/10"
            style={{ color: "rgba(148,163,184,0.85)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {theme === "dark" ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                Light Mode
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Dark Mode
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "rgba(148,163,184,0.58)" }}>
            Incident · Service Request · Change · Problem
          </p>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClose}
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
