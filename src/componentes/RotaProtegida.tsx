import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAutenticacao } from "../auth/AuthContext";

/**
 * Envolve as rotas que exigem login.
 *
 * O `state` guarda de onde a pessoa veio. E isso que faz o link de convite
 * funcionar para quem ainda nao tem conta: abre /convite/abc, cai no
 * cadastro e, depois de criar a conta, volta direto para o convite.
 */
export default function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAutenticacao();
  const local = useLocation();

  if (carregando) return <div className="carregando">Abrindo a geladeira…</div>;

  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  }

  return <>{children}</>;
}
