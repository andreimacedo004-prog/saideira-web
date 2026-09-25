# Saideira — Web (PWA)

Front do Saideira: **React 19 + TypeScript + Vite**, no mesmo desenho do elofit-web. É um PWA: abre no navegador do celular e dá para **instalar na tela inicial** (Android: "Instalar app"; iPhone: Compartilhar → "Adicionar à Tela de Início"), sem loja.

## Rodando

```bash
npm install
cp .env.example .env.local   # ajuste se precisar
npm run dev                  # http://localhost:5173
```

O backend precisa estar rodando em `http://localhost:8280`. O CORS dele já libera `http://localhost:5173` por padrão.

Outros comandos: `npm run build` (checa os tipos e gera `dist/`), `npm run lint`, `npm run preview` (serve o build).

## Telas

| Rota | O que é |
|---|---|
| `/entrar` | Login e cadastro (com a confirmação de 18+) |
| `/` | Desafios de todos os seus grupos (os ativos primeiro), seus grupos, criar grupo ou entrar com código |
| `/grupos/:id` | Membros, botão **Chamar a galera** (abre o compartilhar do celular com o link) e desafios do grupo |
| `/convite/:codigo` | Onde cai quem abre o link de convite. Sem conta, passa pelo cadastro e volta para cá |
| `/desafios/:id` | Abas **Feed** (cards com foto, pontos, reações e comentários), **Ranking** (com "Como pontuar") e **Meu resumo** (seus litros e suas cervejas, só você vê, mais o total da galera) |
| `/desafios/:id/checkin` | Foto, tipo de rolê, lugar, amigos, cervejas com formato e quantidade, legenda e "esqueci de registrar na hora". Formato e quantidade não valem ponto nem aparecem no feed: vão só para o **Meu resumo** (`GET /api/desafios/:id/retrospectiva`) |

## Estrutura

```
src/
├── api/            → uma função por endpoint; só o client.ts chama fetch
├── auth/           → AuthContext (token, login, cadastro, sessão expirada)
├── componentes/    → CartaoCheckIn, Comentarios, Ranking, SeletorDeCervejas, Avatar, Layout...
├── ganchos/        → useRequisicao (carregando / erro / dados)
├── paginas/        → uma por rota
├── fotos.ts        → compressão e upload no Cloudinary
├── tempo.ts        → datas ("há 2 h", "faltam 12 dias")
├── rotulos.ts      → emojis e nomes dos tipos de rolê e das reações
└── tipos.ts        → espelho dos DTOs do backend
public/
├── manifest.webmanifest, ícones → o que torna o app instalável
└── sw.js           → service worker: abre o app sem internet (a API nunca vai para o cache)
```

Diferença para o elofit-web: o `useRequisicao` recebe uma **chave** (ex.: o id do desafio) em vez de uma lista de dependências. O eslint do React 19 recusa o `useCallback(fn, deps)` com `deps` vindo de fora, e o elofit-web deve estar acusando o mesmo erro no `npm run lint`.

## Fotos (Cloudinary)

O backend não recebe arquivo. O app reduz a foto no próprio celular (~300 KB), sobe direto para o Cloudinary e manda só o link para a API.

Sem configurar, o app funciona normal, só sem foto. Para ligar:

1. Crie uma conta grátis em cloudinary.com e copie o **Cloud name** do painel.
2. Em **Settings → Upload → Upload presets**, clique em **Add upload preset**:
   - **Signing mode: Unsigned**
   - nome, por exemplo, `saideira`
   - vale limitar os formatos a `jpg, png, webp` e o tamanho máximo do arquivo
3. No `.env.local`:
   ```
   VITE_CLOUDINARY_CLOUD=seu-cloud-name
   VITE_CLOUDINARY_PRESET=saideira
   ```
4. Reinicie o `npm run dev`. Variáveis `VITE_*` só são lidas quando o Vite sobe.

Um preset *unsigned* deixa qualquer pessoa que souber o nome dele subir imagem na sua conta. Para um app entre amigos isso é aceitável, e os limites de formato e tamanho seguram o abuso.

## Testando no celular antes de publicar

Com o celular no mesmo Wi-Fi:

1. `npm run dev -- --host`: o Vite mostra um endereço tipo `http://192.168.0.10:5173`.
2. No `.env.local`, use `VITE_API_URL=http://192.168.0.10:8280`, com o IP do seu PC.
3. No backend, adicione esse endereço ao CORS: `APP_CORS_ORIGENS=http://localhost:5173,http://192.168.0.10:5173`.

Assim a câmera e o fluxo inteiro funcionam, mas o app **não fica instalável**: service worker exige HTTPS, e isso só vai existir depois de publicar.

## Publicando (Railway, igual ao elofit-web)

**Serviço do front** (a partir deste repositório). O Railway roda `npm run build` e depois `npm start`, que usa o `vite preview` na porta que ele mandar. Variáveis:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | `https://<seu-backend>.up.railway.app` |
| `VITE_CLOUDINARY_CLOUD` | seu cloud name |
| `VITE_CLOUDINARY_PRESET` | `saideira` |

As `VITE_*` entram no build. Mudou alguma, precisa de **redeploy**.

**No serviço do backend**, aponte para o front:

| Variável | Valor |
|---|---|
| `APP_CORS_ORIGENS` | `https://<seu-front>.up.railway.app` |
| `CONVITE_BASE_URL` | `https://<seu-front>.up.railway.app/convite/` |

Sem o `CONVITE_BASE_URL`, o botão "Chamar a galera" gera link para `localhost`.

## Próximos passos

- [ ] Tela de perfil (foto e nome), que o backend já aceita em `PUT /api/usuarios/eu/perfil`
- [ ] Saideira Wrapped no fim do desafio
- [ ] Notificação quando alguém reagir ou comentar (Web Push)
- [ ] Puxar para atualizar o feed
