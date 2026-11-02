
(() => {
  "use strict";

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const scriptUrl = document.currentScript.src;
  const siteRoot = new URL(".", scriptUrl);

  const siteUrl = path => new URL(path, siteRoot).href;

  const main = document.querySelector("#event-page");
  const errorMessage = document.querySelector("#event-error");

  const titleElement = document.querySelector("#event-title");
  const descriptionElement = document.querySelector("#event-description");
  const bodyElement = document.querySelector("#event-body");

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


  // Valida datas no formato AAAA-MM-DD.
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


  // Formata datas para o português brasileiro.
  function formatDate(value) {
    const date = parseLocalDate(value);

    if (!date) return "Data a confirmar";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long"
    }).format(date);
  }


  // Aceita apenas imagens da pasta /media/.
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


  // Valida links externos HTTP ou HTTPS.
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


  // O Instagram precisa apontar para o domínio oficial.
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
  // SANITIZAÇÃO DO CONTEÚDO RICH-TEXT
  // ==========================================

  function sanitizeEventHTML(html = "") {
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


        // Tratamento especial para imagens.
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


        // Valida os links do conteúdo.
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

  function renderCover(event) {
    const imageUrl = getMediaUrl(event.image);

    const wrapper = document.querySelector(
      "#event-cover-wrap"
    );

    const image = document.querySelector("#event-cover");

    if (!imageUrl || !wrapper || !image) {
      return;
    }

    image.src = imageUrl;
    image.alt = typeof event.imageAlt === "string"
  ? event.imageAlt.trim()
  : `Capa do evento ${event.title}`;
    image.loading = "eager";
    image.decoding = "async";

    wrapper.hidden = false;

    image.addEventListener("error", () => {
      wrapper.hidden = true;
    }, { once: true });
  }


  // ==========================================
  // GALERIA DE IMAGENS
  // ==========================================

  function renderGallery(gallery) {
  
function renderGallery(gallery) {
  const section = document.querySelector(
    "#event-gallery-section"
  );

  const container = document.querySelector(
    "#event-gallery"
  );

  if (!section || !container) return;

  if (!Array.isArray(gallery)) {
    return;
  }

  const images = gallery
    .map((item, index) => {
      // Compatibilidade com o formato antigo:
      // gallery: ["/media/foto.jpg"]
      if (typeof item === "string") {
        return {
          url: getMediaUrl(item),
          alt: `Imagem ${index + 1} da galeria do evento`
        };
      }

      // Novo formato:
      // { image: "/media/foto.jpg", imageAlt: "Descrição" }
      if (item && typeof item === "object") {
        return {
          url: getMediaUrl(item.image),
          alt: typeof item.imageAlt === "string"
            ? item.imageAlt.trim()
            : ""
        };
      }

      return null;
    })
    .filter(item => item && item.url);

  if (images.length === 0) {
    return;
  }

  container.innerHTML = images.map(item => `
    <img
      src="${escapeHTML(item.url)}"
      alt="${escapeHTML(item.alt)}"
      loading="lazy"
      decoding="async"
    >
  `).join("");

  section.hidden = false;
}



  // ==========================================
  // BOTÕES EXTERNOS
  // ==========================================

  function renderActions(event) {
    const registration = document.querySelector(
      "#event-registration"
    );

    const instagram = document.querySelector(
      "#event-instagram"
    );

    const actions = document.querySelector(
      "#event-actions"
    );

    const registrationUrl = getExternalUrl(
      event.registrationUrl
    );

    const instagramUrl = getInstagramUrl(
      event.instagramUrl
    );

    if (registration && registrationUrl) {
      registration.href = registrationUrl;
      registration.hidden = false;
    }

    if (instagram && instagramUrl) {
      instagram.href = instagramUrl;
      instagram.hidden = false;
    }

    if (actions && (registrationUrl || instagramUrl)) {
      actions.hidden = false;
    }
  }


  // ==========================================
  // EXIBIÇÃO DO EVENTO
  // ==========================================

  function renderEvent(event) {

    document.title =
      `${event.title} | Palavra de Domingo`;

    const metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (metaDescription) {
      metaDescription.content =
        event.description ||
        `Confira os detalhes de ${event.title}.`;
    }

    setText("event-title", event.title);
    setText("event-description", event.description);
    setText("event-sidebar-description", event.description);

    const formattedDate = formatDate(event.date);

    setText("event-date", `📅 ${formattedDate}`);
    setText("event-time", `🕒 ${event.time}`, "🕒 Horário a confirmar");
    setText("event-location", `📍 ${event.location}`, "📍 Local a confirmar");

    setText("event-sidebar-date", `📅 ${formattedDate}`);
    setText("event-sidebar-time", `🕒 ${event.time}`, "🕒 Horário a confirmar");
    setText("event-sidebar-location", `📍 ${event.location}`, "📍 Local a confirmar");

    // O conteúdo rico é sanitizado antes de ser exibido.
    bodyElement.innerHTML = sanitizeEventHTML(
      event.body || "<p>As informações completas deste evento serão disponibilizadas em breve.</p>"
    );

    renderCover(event);
    renderGallery(event.gallery);
    renderActions(event);
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

    document.title = "Evento não encontrado | Palavra de Domingo";
  }


  // ==========================================
  // CARREGAMENTO DO EVENTO
  // ==========================================

  async function loadEvent() {

    try {

      const params = new URLSearchParams(
        window.location.search
      );

      const slug = params.get("slug");

      // Valida o identificador recebido no endereço.
      if (
        !slug ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ) {
        showError();
        return;
      }


      const response = await fetch(
        siteUrl("content/events.json"),
        { cache: "no-cache" }
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar os eventos.");
      }

      const events = await response.json();

      if (!Array.isArray(events)) {
        throw new Error("O arquivo de eventos possui formato inválido.");
      }


      // Procura apenas eventos publicados.
      const event = events.find(item =>
        item &&
        item.slug === slug &&
        item.status === "publicado" &&
        typeof item.title === "string" &&
        item.title.trim() !== "" &&
        parseLocalDate(item.date) !== null
      );


      // Rascunhos, cancelados e inexistentes não são exibidos.
      if (!event) {
        showError();
        return;
      }

      renderEvent(event);

    } catch (error) {

      console.error("Erro ao carregar evento:", error);
      showError();

    }

  }


  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  loadEvent();

})();
        
