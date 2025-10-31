import React, { useRef, useState, useEffect } from "react";

type FadeInSectionProps = { children: React.ReactNode; className?: string };

export default function FadeInSection({ children, className }: FadeInSectionProps) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setVisible(entry.isIntersecting));
    }, { threshold: 0.12 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
