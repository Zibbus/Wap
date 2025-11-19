// client/src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layouts/Layout";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import WorkoutPage from "./pages/WorkoutPage";
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleDetailPage from "./pages/ScheduleDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Professionisti from "./pages/Professionisti";
import ProfessionistaDettaglio from "./pages/ProfessionistaDettaglio";
import ChatPage from "./pages/ChatPage";
import NutritionPage from "./pages/NutritionPage";
import NutritionPlanDetailPage from "./pages/NutritionPlanDetailPage";
import ProgressPage from "./pages/ProgressPage";

import { useAuth } from "./hooks/useAuth";

// 🔒 Protezione rotta
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-6 text-center">Caricamento…</div>;
  }

  if (!isAuthenticated) {
    // Apri il LoginModal globale
    if (typeof (window as any).openLoginModal === "function") {
      (window as any).openLoginModal();
    } else {
      window.dispatchEvent(new Event("myfit:login:open"));
    }
    // Torna alla home e, opzionalmente, conserva la destinazione
    // per un redirect post-login (se vuoi usarla nel tuo LoginModal)
    sessionStorage.setItem("postLoginRedirect", location.pathname + location.search);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          
          <Route path="/workout" element={ <RequireAuth> <WorkoutPage /> </RequireAuth> }/>
          <Route path="/nutrizione" element={ <RequireAuth> <NutritionPage /> </RequireAuth> }/>

          <Route path="/chat" element={<ChatPage />} />

          <Route path="/schedules" element={<ScheduleListPage />} />
          <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
          <Route path="/nutrition/plans/:id" element={<NutritionPlanDetailPage />} />

          <Route path="/professionisti" element={<Professionisti />} />
          <Route path="/professionisti/:id" element={<ProfessionistaDettaglio />} />

          <Route path="/profilo" element={ <RequireAuth> <ProfilePage /> </RequireAuth> }/>

          <Route path="/impostazioni" element={ <RequireAuth> <SettingsPage /> </RequireAuth> }/>

          <Route path="/progressi" element={ <RequireAuth> <ProgressPage /> </RequireAuth> }/>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
