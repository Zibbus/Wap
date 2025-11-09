import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Shield } from "lucide-react";
import { useLoginModal } from "../../../hooks/useLoginModal";
import { useAuth } from "../../../hooks/useAuth";
import logo from "../../../assets/IconaMyFitNoBG.png";
import ThemeToggle from "../Header/drop-down_menu/ThemeToggle";
import { api } from "../../../services/api";

// In questo header NON servono funzioni di chat aggiuntive:
// import { listConversations } from "../../../services/chat";

function getInitials(username?: string | null) {
  if (!username) return "U";
  const clean = username.trim();
  if (!clean) return "U";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

// 👇 helper per URL relativi (/uploads/...)
function toAbsoluteUrl(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = window.location.origin;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [animateClose, setAnimateClose] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openLoginModal } = useLoginModal();

  // Rende disponibile openLoginModal a qualunque componente (es. MyFitBot)
useEffect(() => {
  (window as any).openLoginModal = openLoginModal;

  const onEvt = () => openLoginModal();
  window.addEventListener("myfit:login:open", onEvt);

  return () => {
    delete (window as any).openLoginModal;
    window.removeEventListener("myfit:login:open", onEvt);
  };
}, [openLoginModal]);

  const { authData, logout, updateAvatarUrl } = useAuth();
  const isLoggedIn = !!authData;
  const username = authData?.username;
  const userType = (authData?.role as "utente" | "professionista" | "admin") ?? "utente";
  const avatarUrl = authData?.avatarUrl ?? null;

  /* 🔔 Totale messaggi non letti (mostrato accanto a "Le mie chat") */
  const [unreadTotal, setUnreadTotal] = useState<number>(0);

  // Chiudi il menu quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownOpen) return;
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      closeDropdown();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Chiudi menu se cambi pagina
  useEffect(() => {
    if (dropdownOpen) closeDropdown();
  }, [location.pathname]);

  // Fallback avatar: se loggato ma avatar mancante, prova a leggerlo dal profilo
  useEffect(() => {
    let cancelled = false;
    async function fetchAvatarIfMissing() {
      if (!isLoggedIn || avatarUrl) return;
      try {
        const me = await api.get<any>("/profile");
        const fromProfile: string | null =
          me?.professional?.avatar_url ??
          me?.avatar_url ??
          null;
        if (!cancelled && fromProfile) updateAvatarUrl(fromProfile);
      } catch {}
    }
    fetchAvatarIfMissing();
    return () => { cancelled = true; };
  }, [isLoggedIn, avatarUrl, updateAvatarUrl]);

  /* 🔔 Fetch non letti + refresh su visibilità + polling leggero */
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: number | undefined;

    const pull = async () => {
      try {
        // NB: endpoint già esistente lato backend
        const data = await api.get<{ total: number; byThread: Record<number, number> }>("/chat/unread");
        setUnreadTotal(Number(data?.total || 0));
      } catch {
        // ignora errori silenziosamente
      }
    };

    // Primo fetch immediato
    pull();

    // Polling (15s) come fallback
    const loop = async () => {
      await pull();
      timeoutId = window.setTimeout(loop, 15000);
    };
    timeoutId = window.setTimeout(loop, 15000);

    // Aggiorna quando la tab torna visibile
    const onVisibility = () => { if (document.visibilityState === "visible") pull(); };
    document.addEventListener("visibilitychange", onVisibility);

    // Aggiorna subito se la ChatPage emette questo evento dopo aver marcato come letto
    const onSync = () => pull();
    window.addEventListener("chat:unread:sync", onSync as any);

    // (Compatibilità) se altrove avevi usato "myfit:unread:refresh", lo ascoltiamo lo stesso
    const onCompat = () => pull();
    window.addEventListener("myfit:unread:refresh", onCompat as any);

    return () => {
      timeoutId && clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("chat:unread:sync", onSync as any);
      window.removeEventListener("myfit:unread:refresh", onCompat as any);
    };
  }, [isLoggedIn]);

  const closeDropdown = () => {
    setAnimateClose(true);
    setTimeout(() => {
      setDropdownOpen(false);
      setAnimateClose(false);
    }, 200);
  };

  const handleLogout = async () => {
    closeDropdown();
    try {
      await logout(); // svuota token/stato
    } finally {
      sessionStorage.removeItem("openConversationId");
      navigate("/", { replace: true }); // torna alla home
    }
  };

  const dropdownItemClass =
    "px-6 py-3 text-left text-base font-medium cursor-pointer transition-colors " +
    "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 " +
    "dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 py-5 px-10 flex justify-between items-center shadow-md z-50 transition-colors duration-300
        ${userType === "admin" ? "bg-red-50" : "bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100"}
      `}
    >
      {/* Logo MyFit → Home */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-3 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 rounded-lg"
        aria-label="Vai alla home"
      >
        <img src={logo} alt="Logo MyFit" height={40} className="h-10 w-auto drop-shadow-md" />
        <h1
          className={`text-3xl font-extrabold tracking-tight transition-colors ${
            userType === "admin"
              ? "text-red-600 hover:text-red-700"
              : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          Fit
        </h1>
      </button>

      {/* Menu centrale */}
      <nav
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10 font-semibold text-lg"
        aria-label="Navigazione principale"
      >
        {[
          { label: "Home", path: "/" },
          { label: "Chi siamo", path: "chi-siamo" },
          { label: "Shop", path: "/shop" },
        ].map((link) => (
          <button
            key={link.path}
            onClick={(e) => {
              e.stopPropagation();
              if (link.path === "/") {
                navigate("/");
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else if (link.path === "chi-siamo") {
                const footer = document.getElementById("footer");
                if (footer) footer.scrollIntoView({ behavior: "smooth" });
              } else {
                navigate(link.path);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="
              relative group text-gray-700 dark:text-gray-200 font-semibold px-4 py-2 rounded-lg overflow-hidden
              transition-colors duration-300 cursor-pointer select-none
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40
            "
          >
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
              {link.label}
            </span>
            <span
              className="
                absolute inset-0 from-indigo-500 to-purple-500 rounded-lg
                opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100
                transition-all duration-400 ease-out origin-center blur-[0.3px]
              "
            />
          </button>
        ))}
      </nav>

      {/* Area utente */}
      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        {/* Toggle tema sempre visibile */}
        <ThemeToggle />

        {isLoggedIn ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((v) => !v);
              }}
              className="relative flex items-center gap-2 font-bold text-lg px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
              title={username ? `Account di ${username}` : "Account"}
            >
              {/* Avatar + (niente badge qui) */}
              <div className="relative w-10 h-10">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={toAbsoluteUrl(avatarUrl)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : userType === "admin" ? (
                    <Shield className="w-6 h-6 text-red-500" />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-200 select-none">
                      {getInitials(username)}
                    </span>
                  )}
                </div>
              </div>

              <span className="whitespace-nowrap text-gray-800 dark:text-gray-100 text-lg font-extrabold">
                Ciao, {username}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {(dropdownOpen || animateClose) && (
              <div
                role="menu"
                className={`absolute top-full right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 overflow-hidden rounded-2xl ${
                  animateClose ? "animate-slide-up" : "animate-slide-down"
                }`}
              >
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                  <div
                    onClick={() => {
                      navigate("/profilo");
                      closeDropdown();
                    }}
                    className={dropdownItemClass}
                    role="menuitem"
                  >
                    Profilo
                  </div>

                  <div
                    onClick={() => {
                      navigate("/impostazioni");
                      closeDropdown();
                    }}
                    className={dropdownItemClass}
                    role="menuitem"
                  >
                    Impostazioni
                  </div>

                  {/* Utente standard */}
                  {userType === "utente" && (
                    <>
                      <div
                        onClick={() => {
                          navigate("/chat");
                          closeDropdown();
                        }}
                        className={`${dropdownItemClass} flex items-center justify-between`}
                        role="menuitem"
                      >
                        <span>Le mie chat</span>
                        {unreadTotal > 0 && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {unreadTotal > 99 ? "99+" : unreadTotal}
                          </span>
                        )}
                      </div>
                      <div
                        onClick={() => {
                          navigate("/schedules");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Le mie schede
                      </div>
                      <div
                        onClick={() => {
                          navigate("/progressi");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Progressi
                      </div>
                    </>
                  )}

                  {/* Professionista */}
                  {userType === "professionista" && (
                    <>
                      <div
                        onClick={() => {
                          navigate("/chat");
                          closeDropdown();
                        }}
                        className={`${dropdownItemClass} flex items-center justify-between`}
                        role="menuitem"
                      >
                        <span>Le mie chat</span>
                        {unreadTotal > 0 && (
                          <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {unreadTotal > 99 ? "99+" : unreadTotal}
                          </span>
                        )}
                      </div>
                      <div
                        onClick={() => {
                          navigate("/scheda-cliente");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Crea scheda cliente
                      </div>
                    </>
                  )}

                  {/* Admin */}
                  {userType === "admin" && (
                    <>
                      <div
                        onClick={() => {
                          navigate("/admin");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Dashboard Admin
                      </div>
                      <div
                        onClick={() => {
                          navigate("/admin/utenti");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Gestione utenti
                      </div>
                      <div
                        onClick={() => {
                          navigate("/admin/professionisti");
                          closeDropdown();
                        }}
                        className={dropdownItemClass}
                        role="menuitem"
                      >
                        Gestione professionisti
                      </div>
                    </>
                  )}

                  <div
                    onClick={handleLogout}
                    className="px-6 py-3 text-left text-red-600 dark:text-red-400 text-base hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold transition-colors cursor-pointer"
                    role="menuitem"
                  >
                    Logout
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={openLoginModal}
            className="btn btn-primary"
          >
            Accedi
          </button>
        )}
      </div>

      {/* Animazioni locali */}
      <style>{`
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-15px); }
        }
        .animate-slide-down { animation: slideDown 250ms ease-out forwards; }
        .animate-slide-up   { animation: slideUp   250ms ease-in forwards; }
      `}</style>
    </header>
  );
}
