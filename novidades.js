
(() => {
  "use strict";

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const scriptUrl = document.currentScript.src;
  const siteRoot = new URL(".", scriptUrl);

  const siteUrl = path => new URL(path, siteRoot).href;

  const newsContainer = document.querySelector("#news-list");
  const emptyMessage = document.querySelector("#news-empty");


  // ==========================================
  // SEGURANÇA E FORMATAÇÃO
  // ==========================================

  // Impede que textos cadastrados sejam interpretados como HTML.
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }


  // Interpreta datas no formato AAAA-MM-DD.
  function parseLocalDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return null;
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }


  // Formata a data para o português brasileiro.
  function formatDate(value) {
    const date = parseLocalDate(value);

    if (!date) return "Data não informada";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long"
    }).format(date);
  }


  // Aceita somente imagens da pasta /media/.
  function getNewsImage(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const imageUrl = new URL(
        value.replace(/^\/+/, ""),
        siteRoot
      );

      if (
        imageUrl.origin !== siteRoot.origin ||
        !imageUrl.pathname.startsWith(
          new URL("media/", siteRoot).pathname
        )
      ) {
        return "";
      }

      return imageUrl.href;

    } catch {
      return "";
    }
  }


  // ==========================================
  // CATEGORIAS
  // ==========================================

  const categoryNames = {
    comunicado: "Comunicado",
    atualizacao: "Atualização",
    projeto: "Projeto",
    produto: "Produto",
    aviso: "Aviso",
    geral: "Geral"
  };


  // ==========================================
  // CRIAÇÃO DOS CARTÕES
  // ==========================================

  function createNewsCard(news) {

    const imageUrl = getNewsImage(news.image);

    const image = imageUrl
      ? `
        <img
          class="event-card-image"
          src="${escapeHTML(imageUrl)}"
          alt=""
          loading="lazy"
          decoding="async"
        >
      `
      : "";

    const validSlug =
      typeof news.slug === "string" &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(news.slug);

    const detailsButton = validSlug
      ? `
        <a
          class="btn btn-secondary event-details"
          href="novidade.html?slug=${encodeURIComponent(news.slug)}"
        >
          Ler publicação →
        </a>
      `
      : "";

    const category =
      categoryNames[news.category] || "Novidade";

    return `
      <article class="message-card event-card">

        ${image}

        <span class="tag">
          ${escapeHTML(category)}
        </span>

        <h3>${escapeHTML(news.title)}</h3>

        <p>${escapeHTML(news.summary || "")}</p>

        <div class="event-meta">
          <span>
            📅 ${escapeHTML(formatDate(news.date))}
          </span>
        </div>

        ${detailsButton}

      </article>
    `;
  }


  // ==========================================
  // CARREGAMENTO DAS PUBLICAÇÕES
  // ==========================================

  async function loadNews() {

    if (!newsContainer) {
      console.warn("Área de novidades não encontrada.");
      return;
    }

    try {

      const response = await fetch(
        siteUrl("content/news.json"),
        { cache: "no-cache" }
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar as novidades.");
      }

      const news = await response.json();

      if (!Array.isArray(news)) {
        throw new Error("O arquivo de novidades possui formato inválido.");
      }


      // Somente publicações com informações válidas.
      const publishedNews = news.filter(item => {

        return (
          item &&
          item.status === "publicado" &&
          typeof item.title === "string" &&
          item.title.trim() !== "" &&
          parseLocalDate(item.date) !== null
        );

      });


      // Ordena da publicação mais recente para a mais antiga.
      publishedNews.sort((a, b) =>
        b.date.localeCompare(a.date)
      );


      // Cria os cartões.
      newsContainer.innerHTML = publishedNews
        .map(createNewsCard)
        .join("");


      // Controla a mensagem de lista vazia.
      if (emptyMessage) {
        emptyMessage.hidden = publishedNews.length > 0;
      }


      // Remove o texto de carregamento quando não há publicações.
      if (publishedNews.length === 0) {
        newsContainer.replaceChildren();
      }

    } catch (error) {

      console.error("Erro ao carregar novidades:", error);

      newsContainer.innerHTML = `
        <p class="notice">
          Não foi possível carregar as novidades.
          Tente novamente mais tarde.
        </p>
      `;

      if (emptyMessage) {
        emptyMessage.hidden = true;
      }

    }

  }


  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  loadNews();

})();
    
