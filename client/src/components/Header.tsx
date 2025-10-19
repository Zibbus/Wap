import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User } from "lucide-react";
import logo from "../assets/IconaMyFitNoBG.png";

interface HeaderProps {
  isLoggedIn: boolean;
  username?: string;
  userType?: "utente" | "professionista";
  avatarUrl?: string;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Header({
  isLoggedIn,
  username,
  userType,
  avatarUrl,
  onLogin,
  onLogout,
}: HeaderProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [animateClose, setAnimateClose] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔹 Chiudi il menu se clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const header = document.querySelector("header");
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (header && header.contains(event.target as Node)) return;
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeDropdown = () => {
    setAnimateClose(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setAnimateClose(false);
    }, 250);
  };

  const handleLogout = () => {
    closeDropdown();
    onLogout();
  };

  const dropdownItemClass =
    "px-6 py-3 text-left text-gray-700 text-base hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all duration-200 cursor-pointer";

  return (
    <header className="fixed top-0 left-0 right-0 bg-white text-gray-800 py-5 px-10 flex justify-between items-center shadow-md z-50">
      {/* 🔹 Logo + MyFit */}
      <div
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        <img
          src={logo}
          alt="Logo MyFit"
          className="h-12 w-12 drop-shadow-md"
        />
        <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">
          MyFit
        </h1>
      </div>

      {/* 🔹 Menu centrale */}
      <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-10 font-semibold text-lg">
        {[
          { label: "Home", path: "home" },
          { label: "Chi siamo", path: "chi-siamo" },
          { label: "Shop", path: "/shop" },
        ].map((link) => (
          <button
            key={link.path}
            onClick={(e) => {
              e.stopPropagation();

              if (link.path === "home") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (link.path === "chi-siamo") {
                document
                  .getElementById("chi-siamo")
                  ?.scrollIntoView({ behavior: "smooth" });
              } else {
                navigate(link.path);
              }
            }}
            className="
              relative group text-gray-700 font-semibold px-4 py-2 rounded-lg overflow-hidden
              transition-colors duration-300
            "
          >
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              {link.label}
            </span>

            {/* 🔹 Effetto gradiente dietro la scritta */}
            <span
              className="
                absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg
                opacity-0 group-hover:opacity-100
                scale-0 group-hover:scale-100
                transition-all duration-400 ease-out
                origin-center blur-[0.3px]
              "
              style={{
                transformOrigin: "center",
                transition:
                  "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-in-out",
              }}
            ></span>
          </button>
        ))}
      </nav>

      {/* 🔹 Sezione utente */}
      <div className="relative flex items-center" ref={dropdownRef}>
        {isLoggedIn ? (
          <>
            {/* Pulsante utente */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dropdownOpen ? closeDropdown() : setDropdownOpen(true);
              }}
              className="flex items-center gap-2 font-bold text-lg px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <span className="whitespace-nowrap text-gray-800 text-lg font-extrabold">
                Ciao, {username}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 🔽 Menu tendina (centrato sotto) */}
            {(dropdownOpen || animateClose) && (
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white/95 backdrop-blur border border-gray-200 shadow-2xl z-40 transition-all duration-300 overflow-hidden rounded-2xl ${
                  animateClose ? "animate-slide-up" : "animate-slide-down"
                }`}
              >
                <div className="flex flex-col divide-y divide-gray-100">
                  <div
                    onClick={() => {
                      navigate("/profilo");
                      closeDropdown();
                    }}
                    className={dropdownItemClass}
                  >
                    Profilo
                  </div>
                  <div
                    onClick={() => {
                      navigate("/impostazioni");
                      closeDropdown();
                    }}
                    className={dropdownItemClass}
                  >
                    Impostazioni
                  </div>

                  {userType === "utente" && (
                    <>
                      <div
                        onClick={() => {
                          navigate("/allenamenti");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                      >
                        I miei allenamenti
                      </div>
                      <div
                        onClick={() => {
                          navigate("/progressi");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                      >
                        Progressi
                      </div>
                    </>
                  )}

                  {userType === "professionista" && (
                    <>
                      <div
                        onClick={() => {
                          navigate("/clienti");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                      >
                        I miei clienti
                      </div>
                      <div
                        onClick={() => {
                          navigate("/scheda-cliente");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                      >
                        Crea scheda cliente
                      </div>
                    </>
                  )}

                  <div
                    onClick={handleLogout}
                    className="px-6 py-3 text-left text-red-600 text-base hover:bg-red-50 font-semibold transition-all duration-200 cursor-pointer"
                  >
                    Logout
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={onLogin}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-base font-semibold hover:bg-indigo-700 transition-colors"
          >
            Accedi
          </button>
        )}
      </div>

      {/* 🔹 Animazioni dropdown */}
      <style>{`
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-15px); }
        }
        .animate-slide-down {
          animation: slideDown 300ms ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 300ms ease-in forwards;
        }
      `}</style>
    </header>
  );
}