import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAutenticacao } from "../auth/AuthContext";
import { mensagemDeErro } from "../api/client";

type Modo = "entrar" | "cadastrar";

export default function Entrar() {
  const autenticacao = useAutenticacao();
  const local = useLocation();
  const destino = (local.state as { de?: string } | null)?.de ?? "/";
  const veioDeConvite = destino.startsWith("/convite/");

  // Quem chega por link de convite provavelmente ainda nao tem conta
  const [modo, setModo] = useState<Modo>(veioDeConvite ? "cadastrar" : "entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [maiorDeIdade, setMaiorDeIdade] = useState(false);

  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cadastrando = modo === "cadastrar";

  // Ja logado (ou acabou de logar): segue para onde a pessoa queria ir
  if (autenticacao.usuario) {
    return <Navigate to={destino} replace />;
  }

  function trocarModo() {
    setModo(cadastrando ? "entrar" : "cadastrar");
    setErro(null);
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (cadastrando && !maiorDeIdade) {
      setErro("O Saideira é só para maiores de 18 anos.");
      return;
    }

    setEnviando(true);
    try {
      if (cadastrando) {
        await autenticacao.cadastrar({ email, senha, nome, maiorDeIdade });
      } else {
        await autenticacao.entrar(email, senha);
      }
      // Sem navigate aqui: com o usuario no contexto, o <Navigate> acima assume.
    } catch (problema) {
      setErro(mensagemDeErro(problema));
      setEnviando(false);
    }
  }

  return (
    <div className="entrada">
      <section className="entrada__vitrine">
        <p className="marca marca--grande">
          Saideira<span className="marca__ponto">.</span>
        </p>
        <p className="vitrine__frase">Todo rolê com a galera vale ponto.</p>

        <ul className="vitrine__regras">
          <li>
            <span className="vitrine__pontos">+10</span> por rolê
          </li>
          <li>
            <span className="vitrine__pontos">+5</span> por cerveja nova
          </li>
          <li>
            <span className="vitrine__pontos">+3</span> por amigo marcado
          </li>
          <li>
            <span className="vitrine__pontos">+5</span> por lugar novo
          </li>
        </ul>
      </section>

      <form className="formulario" onSubmit={aoEnviar} noValidate>
        <h1 className="formulario__titulo">{cadastrando ? "Criar conta" : "Entrar"}</h1>
        <p className="formulario__apoio">
          {veioDeConvite
            ? "Te chamaram pra um grupo. Crie a conta (ou entre) e já cai lá dentro."
            : cadastrando
              ? "Leva menos de um minuto."
              : "Bora pro próximo rolê."}
        </p>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        {cadastrando && (
          <label className="campo">
            <span className="campo__rotulo">Como a galera te chama</span>
            <input
              className="campo__entrada"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="nickname"
              maxLength={60}
              required
            />
          </label>
        )}

        <label className="campo">
          <span className="campo__rotulo">E-mail</span>
          <input
            className="campo__entrada"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="campo">
          <span className="campo__rotulo">Senha</span>
          <input
            className="campo__entrada"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={cadastrando ? "new-password" : "current-password"}
            required
          />
          {cadastrando && <span className="campo__ajuda">Mínimo de 8 caracteres.</span>}
        </label>

        {cadastrando && (
          <label className="caixa">
            <input type="checkbox" checked={maiorDeIdade} onChange={(e) => setMaiorDeIdade(e.target.checked)} />
            <span>Tenho 18 anos ou mais</span>
          </label>
        )}

        <button className="botao botao--largo" type="submit" disabled={enviando}>
          {enviando ? "Aguarde…" : cadastrando ? "Criar conta" : "Entrar"}
        </button>

        <p className="alternar">
          {cadastrando ? "Já tem conta? " : "Ainda não tem conta? "}
          <button type="button" onClick={trocarModo}>
            {cadastrando ? "Entrar" : "Criar agora"}
          </button>
        </p>
      </form>
    </div>
  );
}
