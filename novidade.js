
(() => {
  "use strict";

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const scriptUrl = document.currentScript.src;
  const siteRoot = new URL(".", scriptUrl);
  const siteUrl = path => new URL(path, siteRoot).href;

  const main = document.querySelector("#news-page");
  const errorMessage = document.querySelector("#news-error");
  const bodyElement = document.querySelector("#news-body");


  // ==========================================
  // SEGURANÇA E VALIDAÇÃO
  // ==========================================

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }


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


  function formatDate(value) {
    const date = parseLocalDate(value);

    if (!date) return "Data não informada";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long"
    }).format(date);
  }


  // Aceita somente imagens da pasta /media/.
  function getMediaUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(
        value.replace(/^\/+/, ""),
        siteRoot
      );

      if (
        url.origin !== siteRoot.origin ||
        !url.pathname.startsWith(
          new URL("media/", siteRoot).pathname
        )
      ) {
        return "";
      }

      return url.href;

    } catch {
      return "";
    }
  }


  // Aceita links HTTP e HTTPS.
  function getExternalUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      return "";
    }

    try {
      const url = new URL(value);

      if (!["https:", "http:"].includes(url.protocol)) {
        return "";
      }

      return url.href;

    } catch {
      return "";
    }
  }


  // Permite apenas domínios oficiais do Instagram.
  function getInstagramUrl(value) {
    const url = getExternalUrl(value);

    if (!url) return "";

    try {
      const parsed = new URL(url);

      const allowedHosts = [
        "instagram.com",
        "www.instagram.com",
        "m.instagram.com"
      ];

      if (!allowedHosts.includes(parsed.hostname)) {
        return "";
      }

      return url;

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
  // SANITIZAÇÃO DO CONTEÚDO
  // ==========================================

  function sanitizeNewsHTML(html = "") {
    const template = document.createElement("template");
    template.innerHTML = String(html);

    const allowedTags = new Set([
      "P", "H2", "H3",
      "UL", "OL", "LI",
      "BLOCKQUOTE",
      "STRONG", "B",
      "EM", "I",
      "A", "IMG",
      "BR", "HR"
    ]);

    const dangerousTags = new Set([
      "SCRIPT", "STYLE",
      "IFRAME", "OBJECT",
      "EMBED", "SVG",
      "MATH"
    ]);

    function cleanNode(parent) {
      [...parent.childNodes].forEach(child => {

        if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
          return;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) {
          return;
        }

        if (dangerousTags.has(child.tagName)) {
          child.remove();
          return;
        }

        cleanNode(child);

        if (!allowedTags.has(child.tagName)) {
          child.replaceWith(...child.childNodes);
          return;
        }


        // Imagens precisam estar na pasta /media/.
        if (child.tagName === "IMG") {
          const imageUrl = getMediaUrl(
            child.getAttribute("src")
          );

          if (!imageUrl) {
            child.remove();
            return;
          }

          child.setAttribute("src", imageUrl);
          child.setAttribute("loading", "lazy");
          child.setAttribute("decoding", "async");

          [...child.attributes].forEach(attribute => {
            if (
              !["src", "alt", "title", "loading", "decoding"]
                .includes(attribute.name.toLowerCase())
            ) {
              child.removeAttribute(attribute.name);
            }
          });

          if (!child.hasAttribute("alt")) {
            child.setAttribute("alt", "");
          }

          return;
        }


        // Remove atributos não autorizados.
        [...child.attributes].forEach(attribute => {

          const allowed =
            child.tagName === "A" &&
            ["href", "title"].includes(
              attribute.name.toLowerCase()
            );

          if (!allowed) {
            child.removeAttribute(attribute.name);
          }

        });


        // Valida links do conteúdo.
        if (child.tagName === "A") {
          const href = child.getAttribute("href");

          try {
            const url = new URL(href, siteRoot);

            if (!["http:", "https:"].includes(url.protocol)) {
              child.removeAttribute("href");
            } else {
              child.setAttribute("rel", "noopener noreferrer");
            }

          } catch {
            child.removeAttribute("href");
          }
        }

      });
    }

    cleanNode(template.content);

    return template.innerHTML;
  }


  // ==========================================
  // ATUALIZAÇÃO DOS ELEMENTOS
  // ==========================================

  function setText(id, value, fallback = "") {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = value || fallback;
  }


  // ==========================================
  // IMAGEM DE CAPA
  // ==========================================

  function renderCover(news) {
    const imageUrl = getMediaUrl(news.image);

    const wrapper = document.querySelector("#news-cover-wrap");
    const image = document.querySelector("#news-cover");

    if (!imageUrl || !wrapper || !image) {
      return;
    }

    image.src = imageUrl;
    image.alt = `Capa da publicação ${news.title}`;
    image.loading = "eager";
    image.decoding = "async";

    wrapper.hidden = false;

    image.addEventListener("error", () => {
      wrapper.hidden = true;
    }, { once: true });
  }


  // ==========================================
  // BOTÕES EXTERNOS
  // ==========================================

  function renderActions(news) {
    const externalLink = document.querySelector(
      "#news-external-link"
    );

    const instagram = document.querySelector(
      "#news-instagram"
    );

    const actions = document.querySelector(
      "#news-actions"
    );

    const externalUrl = getExternalUrl(news.linkUrl);
    const instagramUrl = getInstagramUrl(news.instagramUrl);

    if (externalLink && externalUrl) {
      externalLink.href = externalUrl;

      externalLink.textContent =
        news.linkLabel?.trim() || "Acessar link ↗";

      externalLink.hidden = false;
    }

    if (instagram && instagramUrl) {
      instagram.href = instagramUrl;
      instagram.hidden = false;
    }

    if (actions && (externalUrl || instagramUrl)) {
      actions.hidden = false;
    }
  }


  // ==========================================
  // EXIBIÇÃO DA PUBLICAÇÃO
  // ==========================================

  function renderNews(news) {

    document.title =
      `${news.title} | Palavra de Domingo`;

    const metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (metaDescription) {
      metaDescription.content =
        news.summary ||
        `Confira a publicação ${news.title} no Palavra de Domingo.`;
    }

    const category =
      categoryNames[news.category] || "Novidade";

    setText("news-category", category);
    setText("news-title", news.title);
    setText("news-summary", news.summary);
    setText("news-sidebar-summary", news.summary);
    setText("news-sidebar-category", category);

    const formattedDate = formatDate(news.date);

    setText("news-date", `📅 ${formattedDate}`);
    setText("news-sidebar-date", `📅 ${formattedDate}`);

    // O conteúdo é sanitizado antes de ser exibido.
    bodyElement.innerHTML = sanitizeNewsHTML(
      news.body ||
      "<p>O conteúdo completo desta publicação será disponibilizado em breve.</p>"
    );

    renderCover(news);
    renderActions(news);
  }


  // ==========================================
  // ESTADO DE ERRO
  // ==========================================

  function showError() {

    if (main) {
      main.hidden = true;
    }

    if (errorMessage) {
      errorMessage.hidden = false;
    }

    document.title =
      "Publicação não encontrada | Palavra de Domingo";
  }


  // ==========================================
  // CARREGAMENTO DA PUBLICAÇÃO
  // ==========================================

  async function loadNews() {

    try {

      const params = new URLSearchParams(
        window.location.search
      );

      const slug = params.get("slug");

      // Valida o identificador da publicação.
      if (
        !slug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ) {
        showError();
        return;
      }


      const response = await fetch(
        siteUrl("content/news.json"),
        { cache: "no-cache" }
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar as novidades.");
      }

      const newsList = await response.json();

      if (!Array.isArray(newsList)) {
        throw new Error("O arquivo de novidades possui formato inválido.");
      }


      // Procura somente publicações válidas e publicadas.
      const news = newsList.find(item =>
        item &&
        item.slug === slug &&
        item.status === "publicado" &&
        typeof item.title === "string" &&
        item.title.trim() !== "" &&
        parseLocalDate(item.date) !== null
      );


      // Rascunhos e publicações inexistentes não são exibidos.
      if (!news) {
        showError();
        return;
      }

      renderNews(news);

    } catch (error) {

      console.error("Erro ao carregar publicação:", error);
      showError();

    }

  }


  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  loadNews();

})();
          
