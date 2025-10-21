// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Header from "./components/homepage/Header";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/homepage/LoginModal";
import WorkoutPage from "./pages/WorkoutPage";
import ShopPage from "./pages/ShopPage";
import ScrollToTop from "./components/ScrollToTop";

// 🔹 Contenuto principale dell'app (usa useAuth)
function AppContent() {
  const { authData, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      {/* ✅ Header visibile su tutte le pagine */}
      <Header
        isLoggedIn={!!authData}
        username={authData?.username}
        onLogin={() => setShowLogin(true)}
        onLogout={logout}
      />

      {/* ✅ Definizione delle rotte */}
      <Routes>
        <Route
          path="/"
          element={<HomePage auth={authData} onLogin={() => setShowLogin(true)} />}
        />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>

      {/* ✅ Modal login */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLoggedIn={(data) => {
            login(data);
            setShowLogin(false);
          }}
        />
      )}
    </>
  );
}

// 🔹 App principale: avvolge TUTTO in AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800 pt-20">
          <AppContent />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
