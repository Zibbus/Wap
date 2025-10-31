// client/src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
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

// (opzionale) protezione rotta se vuoi che sia accessibile solo ai loggati
import { useAuth } from "./hooks/useAuth";
function RequireAuth({ children }: { children: ReactNode }) {
  const { authData, isLoading } = useAuth();
  if (isLoading) return null; // oppure uno spinner
  if (!authData) return <Navigate to="/" replace />;
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

          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/workout/nutrition" element={<Navigate to="/workout?mode=nutrizione" replace />} />
          <Route path="/workout/workout"   element={<Navigate to="/workout?mode=allenamento" replace />} />

          <Route path="/schedules" element={<ScheduleListPage />} />
          <Route path="/schedules/:id" element={<ScheduleDetailPage />} />

          <Route path="/professionisti" element={<Professionisti />} />
          <Route path="/professionisti/:id" element={<ProfessionistaDettaglio />} />

          <Route path="/profilo" element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          } />

          {/* 👇 nuova rotta */}
          <Route path="/impostazioni" element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}