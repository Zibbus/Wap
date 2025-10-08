import { useNavigate } from "react-router-dom";

export default function Header({
  auth,
  initials,
  onLogin,
  onLogout,
}: {
  auth: { username: string } | null;
  initials: string;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-indigo-100 z-50">
      <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4">
        
        {/* 🔹 Logo cliccabile */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-bold text-indigo-700 cursor-pointer hover:text-indigo-800 hover:scale-105 transform transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm cursor-pointer">
            MF
          </div>
          <span className="cursor-pointer select-none">MyFit</span>
        </div>

        {/* 🔹 Login / Logout */}
        {!auth ? (
          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 hover:scale-105 transform transition-all duration-200 shadow-sm cursor-pointer"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transform transition-all duration-200"
              onClick={() => navigate("/profile")}
              title={auth.username}
            >
              {initials}
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 text-sm hover:bg-indigo-50 hover:scale-105 transform transition-all duration-200 shadow-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
