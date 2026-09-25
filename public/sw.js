/*
 * Service worker do Saideira.
 *
 * Faz duas coisas, e so:
 *  1. Deixa o app "instalavel" (o Chrome exige um service worker).
 *  2. Abre o app mesmo sem internet, mostrando a ultima versao que carregou.
 *
 * A API e as fotos NAO passam por aqui: feed e ranking sempre vem frescos
 * do servidor. Cache de dados de rede social so gera "por que meu check-in
 * sumiu?".
 *
 * Ao mudar este arquivo, troque a VERSAO: o navegador instala o novo,
 * e o evento activate apaga o cache antigo.
 */
const VERSAO = "saideira-v1";
const ESSENCIAIS = ["/", "/manifest.webmanifest", "/favicon.svg", "/icone-192.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ESSENCIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);

  // So o proprio app. API (outro dominio), Cloudinary e fontes seguem direto.
  if (pedido.method !== "GET" || url.origin !== self.location.origin) return;

  // Navegacao (abrir o app, trocar de tela): tenta a rede; sem rede, usa o
  // index.html guardado — o React Router cuida da rota.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put("/", copia));
          return resposta;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // /assets/* tem hash no nome (index-3f9a.js): nunca muda, pode vir do cache.
  if (url.pathname.startsWith("/assets/")) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardado) =>
          guardado ||
          fetch(pedido).then((resposta) => {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put(pedido, copia));
            return resposta;
          }),
      ),
    );
  }
});
