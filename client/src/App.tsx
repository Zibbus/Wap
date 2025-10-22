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

export default function App() {
  return (
    <AuthProvider>
      <LoginModalProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/workout" element={<WorkoutPage />} />
              <Route path="/schedules" element={<ScheduleListPage />} />
              <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LoginModalProvider>
    </AuthProvider>
  );
}