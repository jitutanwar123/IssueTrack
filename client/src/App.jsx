import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar.jsx";
import { UserSidebar } from "./components/UserSidebar.jsx";
import { Header } from "./components/Header.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TicketList from "./pages/TicketList.jsx";
import CreateTicket from "./pages/CreateTicket.jsx";
import TicketDetail from "./pages/TicketDetail.jsx";
import Reports from "./pages/Reports.jsx";
import Team from "./pages/Team.jsx";
import Login from "./pages/Login.jsx";
import UserLogin from "./pages/user/UserLogin.jsx";
import Register from "./pages/Register.jsx";
import UserDashboard from "./pages/user/UserDashboard.jsx";
import MyTickets from "./pages/user/MyTickets.jsx";
import UserCreateTicket from "./pages/user/UserCreateTicket.jsx";
import UserTicketDetail from "./pages/user/UserTicketDetail.jsx";
import UserProfile from "./pages/user/UserProfile.jsx";

// ─── Admin Shell ────────────────────────────────────────────────
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

// ─── User Shell ──────────────────────────────────────────────────
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
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Viraj Profiles Limited</div>
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

// ─── Route Guards ────────────────────────────────────────────────
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

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/register" element={<Register />} />

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
      </Routes>
    </ToastProvider>
  );
}
