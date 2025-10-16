import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginModal from "./components/LoginModal.tsx";
import WorkoutPage from "./pages/WorkoutPage.tsx"

export default function App() {
  const { auth, login, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const initials = useMemo(
    () => auth?.username?.slice(0, 2).toUpperCase() ?? "",
    [auth]
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800">
        <Header
          auth={auth}
          initials={initials}
          onLogin={() => setShowLogin(true)}
          onLogout={logout}
        />

        <Routes>
          <Route path="/" element={<HomePage auth={auth} onLogin={() => setShowLogin(true)} />} />
          <Route path="/workout" element={<WorkoutPage />} />
        </Routes>

        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onLoggedIn={(p) => login(p)}   // usa login
          />
        )}

      </div>
    </BrowserRouter>
  );
}
