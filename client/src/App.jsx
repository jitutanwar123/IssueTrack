import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar.jsx";
import { UserSidebar } from "./components/UserSidebar.jsx";
import { StaffSidebar } from "./components/StaffSidebar.jsx";
import { Header } from "./components/Header.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { plantLabel } from "./utils/plants.js";

// ─── Lazy-loaded pages (code-split per route) ───────────────────────────────
const Dashboard        = lazy(() => import("./pages/Dashboard.jsx"));
const TicketList       = lazy(() => import("./pages/TicketList.jsx"));
const TicketDetail     = lazy(() => import("./pages/TicketDetail.jsx"));
const Reports          = lazy(() => import("./pages/Reports.jsx"));
const Team             = lazy(() => import("./pages/Team.jsx"));
const Login            = lazy(() => import("./pages/Login.jsx"));
const UserLogin        = lazy(() => import("./pages/user/UserLogin.jsx"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword.jsx"));
const Register         = lazy(() => import("./pages/Register.jsx"));
const UserDashboard    = lazy(() => import("./pages/user/UserDashboard.jsx"));
const MyTickets        = lazy(() => import("./pages/user/MyTickets.jsx"));
const UserCreateTicket = lazy(() => import("./pages/user/UserCreateTicket.jsx"));
const UserTicketDetail = lazy(() => import("./pages/user/UserTicketDetail.jsx"));
const UserProfile      = lazy(() => import("./pages/user/UserProfile.jsx"));
const DepartmentResolve = lazy(() => import("./pages/DepartmentResolve.jsx"));

// ─── Staff portal pages ──────────────────────────────────────────────────────
const StaffLogin          = lazy(() => import("./pages/staff/StaffLogin.jsx"));
const StaffDashboard      = lazy(() => import("./pages/staff/StaffDashboard.jsx"));
const StaffCreateTicket   = lazy(() => import("./pages/staff/StaffCreateTicket.jsx"));
const StaffTicketDetail   = lazy(() => import("./pages/staff/StaffTicketDetail.jsx"));
const StaffResolvedHistory = lazy(() => import("./pages/staff/StaffResolvedHistory.jsx"));
const StaffReports         = lazy(() => import("./pages/staff/StaffReports.jsx"));

// ─── Loading fallback ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-bg, #f8fafc)" }}>
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-[3px]"
          style={{ borderColor: "#e2e8f0", borderTopColor: "#2563eb" }}
        />
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

// ─── Hamburger Button (shared) ───────────────────────────────────────────────
function HamburgerButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex md:hidden items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50"
      aria-label="Open menu"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}

// ─── Dark mode toggle icon (shared for User/Staff shell headers) ─────────────
function ThemeToggleBtn() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:bg-slate-50"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ─── Admin Shell ─────────────────────────────────────────────────────────────
function Shell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-full" style={{ background: "var(--color-bg, #f8fafc)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: "clamp(0px, var(--sidebar-width, 15rem), 15rem)" }}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 pb-6 pt-[calc(var(--header-h,4rem)+1.5rem)] sm:px-6 lg:px-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── User Shell ──────────────────────────────────────────────────────────────
function UserShell({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-full" style={{ background: "var(--color-bg, #f8fafc)" }}>
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: "clamp(0px, var(--sidebar-width, 15rem), 15rem)" }}
      >
        <header
          className="sticky top-0 z-20"
          style={{
            background: "var(--color-surface, rgba(255,255,255,0.94))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--color-border-soft, rgba(226,232,240,0.9))",
            height: "var(--header-h, 4.25rem)",
          }}
        >
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Viraj Profiles Limited</p>
                <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">User Support Portal</h1>
                <p className="mt-0.5 text-xs text-slate-500 hidden sm:block">Track, raise, and follow up on your requests.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggleBtn />
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Creator
              </div>
              <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-slate-700 dark:bg-slate-800">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #334155, #475569)" }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user?.plant ? plantLabel(user.plant) : user?.department || "User"}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-soft transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

// ─── Staff Shell ─────────────────────────────────────────────────────────────
function StaffShell({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-full" style={{ background: "var(--color-bg, #f8fafc)" }}>
      <StaffSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: "clamp(0px, var(--sidebar-width, 15rem), 15rem)" }}
      >
        <header
          className="sticky top-0 z-20"
          style={{
            background: "var(--color-surface, rgba(255,255,255,0.94))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--color-border-soft, rgba(226,232,240,0.9))",
            height: "var(--header-h, 4.25rem)",
          }}
        >
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Viraj Profiles Limited</p>
                <h1 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-tight">IT Staff Portal</h1>
                <p className="mt-0.5 text-xs text-slate-500 hidden sm:block">Handle assigned tickets and close the loop cleanly.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggleBtn />
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                IT Staff
              </div>
              <div className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-soft dark:border-slate-700 dark:bg-slate-800">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: user?.avatar_color || "linear-gradient(135deg, #334155, #475569)" }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "I"}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {user?.role || "IT Staff"}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-soft transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}

// ─── Route Guards ────────────────────────────────────────────────────────────
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function ProtectedUserRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/user-login" replace state={{ from: location.pathname }} />;
  return children;
}

function ProtectedStaffRoute({ children }) {
  const { isAuthenticated, isStaff, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/staff-login" replace state={{ from: location.pathname }} />;
  // Allow both staff and admin to access staff portal (admin supervising)
  if (!isStaff && !isAdmin) return <Navigate to="/staff-login" replace state={{ from: location.pathname }} />;
  return children;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/staff-login" element={<StaffLogin />} />

          {/* Admin routes */}
          <Route
            path="/*"
            element={
              <ProtectedAdminRoute>
                <Shell>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tickets" element={<TicketList />} />
                    <Route path="/tickets/new" element={<Navigate to="/tickets" replace />} />
                    <Route path="/tickets/:id" element={<TicketDetail />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/resolve/:ticketId" element={<DepartmentResolve />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Shell>
              </ProtectedAdminRoute>
            }
          />

          {/* User portal routes */}
          <Route
            path="/user/*"
            element={
              <ProtectedUserRoute>
                <UserShell>
                  <Routes>
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/my-tickets" element={<MyTickets />} />
                    <Route path="/create-ticket" element={<UserCreateTicket />} />
                    <Route path="/ticket/:id" element={<UserTicketDetail />} />
                    <Route path="/profile" element={<UserProfile />} />
                    <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
                  </Routes>
                </UserShell>
              </ProtectedUserRoute>
            }
          />

          {/* IT Staff portal routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedStaffRoute>
                <StaffShell>
                  <Routes>
                    <Route path="/dashboard" element={<StaffDashboard />} />
                    <Route path="/create-ticket" element={<StaffCreateTicket />} />
                    <Route path="/tickets/:id" element={<StaffTicketDetail />} />
                    <Route path="/history" element={<StaffResolvedHistory />} />
                    <Route path="/reports" element={<StaffReports />} />
                    <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
                  </Routes>
                </StaffShell>
              </ProtectedStaffRoute>
            }
          />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
