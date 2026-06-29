import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar.jsx";
import { UserSidebar } from "./components/UserSidebar.jsx";
import { StaffSidebar } from "./components/StaffSidebar.jsx";
import { Header } from "./components/Header.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

// ─── Lazy-loaded pages (code-split per route) ───────────────────────────────
const Dashboard        = lazy(() => import("./pages/Dashboard.jsx"));
const TicketList       = lazy(() => import("./pages/TicketList.jsx"));
const CreateTicket     = lazy(() => import("./pages/CreateTicket.jsx"));
const TicketDetail     = lazy(() => import("./pages/TicketDetail.jsx"));
const Reports          = lazy(() => import("./pages/Reports.jsx"));
const Team             = lazy(() => import("./pages/Team.jsx"));
const Login            = lazy(() => import("./pages/Login.jsx"));
const UserLogin        = lazy(() => import("./pages/user/UserLogin.jsx"));
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
const StaffTicketDetail   = lazy(() => import("./pages/staff/StaffTicketDetail.jsx"));
const StaffResolvedHistory = lazy(() => import("./pages/staff/StaffResolvedHistory.jsx"));

// ─── Loading fallback ────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-500">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-500" />
        <p className="text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ─── Admin Shell ────────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div className="flex min-h-full bg-slate-50">
      <Sidebar />
      <div className="ml-60 flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

// ─── User Shell ──────────────────────────────────────────────────────────────
function UserShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-full bg-slate-50">
      <UserSidebar />
      <div className="ml-60 flex min-h-screen min-w-0 flex-1 flex-col">
        {/* User Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Viraj Profiles Limited</div>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">User Support Portal</h1>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.department || "User"}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

// ─── Staff Shell ─────────────────────────────────────────────────────────────
function StaffShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="flex min-h-full bg-slate-50">
      <StaffSidebar />
      <div className="ml-60 flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Viraj Profiles Limited</div>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">IT Staff Portal</h1>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: user?.avatar_color || "#0891b2" }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "I"}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.role || "IT Staff"}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

// ─── Route Guards ────────────────────────────────────────────────────────────
function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/user/dashboard" replace />;
  return children;
}

function ProtectedUserRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/user-login" replace />;
  return children;
}

function ProtectedStaffRoute({ children }) {
  const { isAuthenticated, isStaff, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/staff-login" replace />;
  // Allow both staff and admin to access staff portal (admin supervising)
  if (!isStaff && !isAdmin) return <Navigate to="/user/dashboard" replace />;
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
                    <Route path="/tickets/new" element={<CreateTicket />} />
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
                    <Route path="/tickets/:id" element={<StaffTicketDetail />} />
                    <Route path="/history" element={<StaffResolvedHistory />} />
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

