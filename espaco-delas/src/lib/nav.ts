import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** Navega para a home e rola até uma seção (compatível com HashRouter). */
export function useScrollToSection() {
  const nav = useNavigate();
  const loc = useLocation();
  return useCallback(
    (id: string) => {
      const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (loc.pathname === "/") go();
      else nav("/", { state: { scrollTo: id } });
    },
    [loc.pathname, nav],
  );
}
