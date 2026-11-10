import { lazy, Suspense, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { ToastProvider } from "@/components/toast";
import { PublicLayout, ScrollReset } from "@/layouts/PublicLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import Home from "@/pages/public/Home";
import NotFound from "@/pages/public/NotFound";

// Área pública carrega imediatamente; áreas de cliente e admin são separadas em chunks.
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const AdminLogin = lazy(() => import("@/pages/auth/AdminLogin"));
const Booking = lazy(() => import("@/pages/booking/Booking"));
const ClientDashboard = lazy(() => import("@/pages/client/ClientDashboard"));
const Overview = lazy(() => import("@/pages/admin/Overview"));
const Agenda = lazy(() => import("@/pages/admin/Agenda"));
const Appointments = lazy(() => import("@/pages/admin/Appointments"));
const Clients = lazy(() => import("@/pages/admin/Clients"));
const Services = lazy(() => import("@/pages/admin/Services"));
const Professionals = lazy(() => import("@/pages/admin/Professionals"));
const Hours = lazy(() => import("@/pages/admin/Hours"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));

function RequireClient({ children }: { children: ReactNode }) {
  const { currentClient } = useStore();
  const loc = useLocation();
  if (!currentClient) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
function RequireAdmin({ children }: { children: ReactNode }) {
  const { session } = useStore();
  if (!session.admin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

const Fallback = () => (
  <div className="flex min-h-[60dvh] items-center justify-center text-rose-400"><Loader2 className="size-8 animate-spin" /></div>
);

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <ScrollReset />
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="entrar" element={<Login />} />
              <Route path="cadastro" element={<Register />} />
              <Route path="esqueci-senha" element={<ForgotPassword />} />
              <Route path="agendar" element={<Booking />} />
              <Route path="cliente" element={<RequireClient><ClientDashboard /></RequireClient>} />
              <Route path="admin/login" element={<AdminLogin />} />
              <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<Overview />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="agendamentos" element={<Appointments />} />
                <Route path="clientes" element={<Clients />} />
                <Route path="servicos" element={<Services />} />
                <Route path="profissionais" element={<Professionals />} />
                <Route path="horarios" element={<Hours />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}
