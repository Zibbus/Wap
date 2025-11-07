import { useEffect, useRef } from "react";

export function usePageTitle(suffix?: string) {
  const prev = useRef<string>(typeof document !== "undefined" ? document.title : "");
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = suffix ? `MyFit | ${suffix}` : "MyFit";
    return () => { document.title = prev.current || "MyFit"; };
  }, [suffix]);
}
