// client/src/hooks/useLoginModal.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type LoginModalContextType = {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  // opzionale: utile se vuoi controllare manualmente
  setIsOpen?: (v: boolean) => void;
};

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = () => setIsOpen(true);
  const closeLoginModal = () => setIsOpen(false);

  // Bridge globale + evento custom per aprire il modal da qualunque punto
  useEffect(() => {
    (window as any).openLoginModal = () => setIsOpen(true);
    (window as any).closeLoginModal = () => setIsOpen(false);

    const onOpen = () => setIsOpen(true);
    window.addEventListener("myfit:login:open", onOpen);

    return () => {
      delete (window as any).openLoginModal;
      delete (window as any).closeLoginModal;
      window.removeEventListener("myfit:login:open", onOpen);
    };
  }, []);

  return (
    <LoginModalContext.Provider
      value={{ isOpen, openLoginModal, closeLoginModal, setIsOpen }}
    >
      {children}
      {/* Se hai un componente grafico del modal, montalo qui: */}
      {/* <LoginModal open={isOpen} onClose={closeLoginModal} /> */}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) throw new Error("useLoginModal deve essere usato dentro LoginModalProvider");
  return context;
}
