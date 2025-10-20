import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/LoginModal.tsx";
import WorkoutPage from "./pages/WorkoutPage.tsx";
import ShopPage from "./pages/ShopPage.tsx"; // 🛒 Import nuova pagina e-commerce

export default function App() {
  const { auth, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <BrowserRouter>
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
