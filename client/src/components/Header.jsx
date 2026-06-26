import { useAuth } from "../context/AuthContext.jsx";
import { getInitials } from "../utils/helpers.js";

// Maps user status values to Tailwind colour classes
function statusStyle(status) {
  switch ((status || "").toLowerCase()) {
    case "available": return { dot: "bg-emerald-500", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    case "busy":      return { dot: "bg-amber-500",   badge: "border-amber-200   bg-amber-50   text-amber-700"   };
    case "away":      return { dot: "bg-orange-500",  badge: "border-orange-200  bg-orange-50  text-orange-700"  };
    case "offline":   return { dot: "bg-slate-400",   badge: "border-slate-200   bg-slate-50   text-slate-600"   };
    default:          return { dot: "bg-cyan-500",    badge: "border-cyan-200    bg-cyan-50    text-cyan-700"    };
  }
}

export function Header() {
  const { user, logout } = useAuth();
  const status = user?.status || "Available";
  const { dot, badge } = statusStyle(status);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Viraj Profiles Limited</div>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Ticket Tracking Command Center</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Dynamic status badge — reads user.status from DB */}
          <div className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium md:flex ${badge}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
            {status}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {getInitials(user?.name || "U")}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
