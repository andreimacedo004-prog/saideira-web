import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAutenticacao } from "../auth/AuthContext";
import Avatar from "./Avatar";

export default function Layout() {
  const { usuario, sair } = useAutenticacao();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="moldura">
      <header className="cabecalho">
        <Link to="/" className="marca">
          Saideira<span className="marca__ponto">.</span>
        </Link>

        {usuario && (
          <div className="conta">
            <button
              className="conta__botao"
              onClick={() => setMenuAberto((aberto) => !aberto)}
              aria-expanded={menuAberto}
              aria-label="Minha conta"
            >
              <Avatar usuario={usuario} tamanho={34} />
            </button>

            {menuAberto && (
              <div className="conta__menu" role="menu">
                <p className="conta__nome">{usuario.nome}</p>
                <p className="conta__email">{usuario.email}</p>
                <button className="conta__sair" role="menuitem" onClick={sair}>
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="conteudo" onClick={() => setMenuAberto(false)}>
        <Outlet />
      </main>
    </div>
  );
}
