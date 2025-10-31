import { useAuth } from "../../hooks/useAuth";
import { useLoginModal } from "../../hooks/useLoginModal";
import Header from "./Header/Header";
import Footer from "../Layouts/footer/Footer";
import LoginModal from "../Layouts/loginModal/LoginModal";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const { isLoading } = useAuth();
  const { isOpen } = useLoginModal();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-gray-600 dark:bg-gray-900 dark:text-gray-200 text-xl">
        Caricamento...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 to-white text-gray-800 dark:from-gray-950 dark:to-gray-900 dark:text-gray-100 pt-20">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {isOpen && <LoginModal />}
    </div>
  );
}
