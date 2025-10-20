import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ✅ Usa scroll immediato, non smooth, per evitare conflitti con "Chi siamo"
    window.scrollTo({ top: 0, behavior: "auto" });

    // In caso di browser che mantengono lo scroll "smooth", forziamo dopo un breve timeout
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 50);
  }, [pathname]);

  return null;
}