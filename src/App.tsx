import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import HomePage from "./pages/HomePage";
import HabitsPage from "./pages/HabitsPage";
import NewHabitPage from "./pages/NewHabitPage";
import StatsPage from "./pages/StatsPage";
import ProfilePage from "./pages/ProfilePage";
import SocialPage from "./pages/Social";
import OnboardingPage from "./pages/Onboarding";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold"
      style={{
        backgroundColor: "hsl(18 100% 56% / 0.1)",
        borderBottom: "1px solid hsl(18 100% 56% / 0.3)",
        color: "#FF6B2B",
      }}
    >
      <span className="material-symbols-outlined text-sm">wifi_off</span>
      Mode hors ligne — reconnexion...
    </div>
  );
}

// Route "/" — checks auth session to decide where to go
function RootRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to="/home" replace />;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Sonner position="top-center" />
            <OfflineBanner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Root — smart redirect */}
                <Route path="/" element={<RootRoute />} />

                {/* Onboarding — guarded but separate (no BottomNav) */}
                <Route
                  path="/onboarding"
                  element={
                    <AuthGuard>
                      <OnboardingPage />
                    </AuthGuard>
                  }
                />

                {/* Protected app routes */}
                <Route
                  path="/home"
                  element={
                    <AuthGuard>
                      <HomePage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/habits"
                  element={
                    <AuthGuard>
                      <HabitsPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/habits/new"
                  element={
                    <AuthGuard>
                      <NewHabitPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <AuthGuard>
                      <StatsPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/social"
                  element={
                    <AuthGuard>
                      <SocialPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <ProfilePage />
                    </AuthGuard>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;