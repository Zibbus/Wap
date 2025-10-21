import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/homepage/Header";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/homepage/LoginModal";
import WorkoutPage from "./pages/WorkoutPage";
import ShopPage from "./pages/ShopPage";
import ScrollToTop from "./components/ScrollToTop";
import ScheduleListPage from "./pages/ScheduleListPage";
import ScheduleDetailPage from "./pages/ScheduleDetailPage";

export default function App() {
  const { auth, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
      {/* ✅ forza lo scroll in alto a ogni cambio pagina */}
      <ScrollToTop />

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800 pt-20">
        {/* ✅ Header visibile su tutte le pagine */}
        <Header
          isLoggedIn={!!auth}
          username={auth?.username}
          onLogin={() => setShowLogin(true)}
          onLogout={logout}
        />

        {/* ✅ Definizione delle rotte */}
        <Routes>
          <Route
            path="/"
            element={<HomePage auth={auth} onLogin={() => setShowLogin(true)} />}
          />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/shop" element={<ShopPage />} /> {/* 🛒 Pagina shop */}
          <Route path="/" element={<Navigate to="/schedules" replace />} />
          <Route path="/schedules" element={<ScheduleListPage />} />
          <Route path="/schedules/:id" element={<ScheduleDetailPage />} />
        </Routes>

        {/* ✅ Modal login */}
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onLoggedIn={(data) => login(data)}
          />
        )}
      </div>
    </BrowserRouter>
  );
}
