import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { LoginModalProvider } from "./hooks/useLoginModal";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layouts/Layout";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import WorkoutPage from "./pages/WorkoutPage";
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleDetailPage from "./pages/ScheduleDetailPage";

// ✅ nuove pagine principali
import Professionisti from "./pages/Professionisti";
import ProfessionistaDettaglio from "./pages/ProfessionistaDettaglio";

export default function App() {
  return (
    <AuthProvider>
      <LoginModalProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Layout globale */}
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />

              {/* Workout + alias deep-link */}
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/workout/nutrition" element={<Navigate to="/workout?mode=nutrizione" replace />} />
              <Route path="/workout/workout"   element={<Navigate to="/workout?mode=allenamento" replace />} />

              {/* Schedules */}
              <Route path="/schedules" element={<ScheduleListPage />} />
              <Route path="/schedules/:id" element={<ScheduleDetailPage />} />

              {/* ✅ Professionisti */}
              <Route path="/professionisti" element={<Professionisti />} />
              <Route path="/professionisti/:id" element={<ProfessionistaDettaglio />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LoginModalProvider>
    </AuthProvider>
  );
}
