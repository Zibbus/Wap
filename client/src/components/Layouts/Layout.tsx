// client/src/components/Layouts/Layout.tsx
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLoginModal } from "../../hooks/useLoginModal";

import Header from "./Header/Header";
import Footer from "../Layouts/footer/Footer";
import LoginModal from "../Layouts/loginModal/LoginModal";
import MyFitBot from "../../components/Chatbot/MyFitBot";

export default function Layout() {
  const { isLoading } = useAuth();
  const { isOpen } = useLoginModal();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-xl text-gray-600 dark:bg-gray-900 dark:text-gray-200">
        Caricamento...
      </div>
    );
  }

return (
    <>
      <div className="from-indigo-50 to-white text-gray-800 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100 flex min-h-screen flex-col pt-20">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        {isOpen && <LoginModal />}
      </div>

      {/* MyFitBot in alto-sinistra, 96px sotto l’header, 20px dal bordo sinistro */}
      <MyFitBot position="top-left" offset={{ top: 96, left: 20 }} />
    </>
  );
}
