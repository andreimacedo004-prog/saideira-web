import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * O react-router nao volta a rolagem para o topo ao trocar de tela.
 * Sem isto, quem termina o check-in la embaixo cai no feed ja rolado.
 */
export default function RolarParaOTopo() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
