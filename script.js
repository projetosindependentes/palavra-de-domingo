
(() => {
  "use strict";

  // ==================================================
  // CONFIGURAÇÃO GERAL
  // ==================================================

  const root = document.documentElement;
  const scriptUrl = document.currentScript.src;
  const siteRoot = new URL(".", scriptUrl);

  const siteUrl = (path) => new URL(path, siteRoot).href;

  const categoryNames = {
    vida: "Vida cristã",
    fe: "Fé e prática",
    identidade: "Identidade"
  };

  let messages = [];
  let siteConfig = {};

  // ==================================================
  // FUNÇÕES AUXILIARES
  // ==================================================

  function escapeHTML(value = "") {
    
function sanitizeMessageHTML(html = "") {
  const template = document.createElement("template");
  template.innerHTML = String(html);

  const allowedTags = new Set([
    "P", "H2", "H3", "UL", "OL", "LI",
    "BLOCKQUOTE", "STRONG", "B", "EM", "I",
    "A", "BR", "HR"
  ]);

  const allowedAttributes = {
    A: ["href", "title"]
  };

  function cleanNode(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      if (!allowedTags.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        return;
      }

      [...child.attributes].forEach(attribute => {
        const allowed = allowedAttributes[child.tagName] || [];

        if (!allowed.includes(attribute.name.toLowerCase())) {
          child.removeAttribute(attribute.name);
        }
      });

      if (child.tagName === "A") {
        const href = child.getAttribute("href");

        try {
          const url = new URL(href, window.location.origin);

          if (!["http:", "https:"].includes(url.protocol)) {
            child.removeAttribute("href");
          } else {
            child.setAttribute("rel", "noopener noreferrer");
          }
        } catch {
          child.removeAttribute("href");
        }
      }

      cleanNode(child);
    });
  }

  cleanNode(template.content);

  return template.innerHTML;
}
    
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function messageUrl(message) {
    const existingPages = {
      permanecer: "mensagens/permanecer.html",
      fe: "mensagens/fe.html",
      proposito: "mensagens/proposito.html"
    };

    if (existingPages[message.slug]) {
      return siteUrl(existingPages[message.slug]);
    }

    return siteUrl(
      `mensagem.html?slug=${encodeURIComponent(message.slug)}`
    );
  }

  async function loadJSON(path) {
    const response = await fetch(siteUrl(path), {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Não foi possível carregar ${path}`);
    }

    return response.json();
  }

  // ==================================================
  // TEMA CLARO E ESCURO
  // ==================================================

  const themeButton = document.querySelector(
    "#theme-toggle, [data-theme-toggle]"
  );

  function applyTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem("pdd-theme", theme);

    if (themeButton) {
      themeButton.setAttribute(
        "aria-label",
        theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
      );

      themeButton.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  const savedTheme = localStorage.getItem("pdd-theme");

  applyTheme(savedTheme === "dark" ? "dark" : "light");

  themeButton?.addEventListener("click", () => {
    applyTheme(
      root.dataset.theme === "dark" ? "light" : "dark"
    );
  });

  // ==================================================
  // MENU PARA CELULARES
  // ==================================================

  const menuButton = document.querySelector(
  "#menu-toggle, [data-menu-toggle]"
);

const navigation = document.querySelector("#main-navigation, .nav");

menuButton?.addEventListener("click", () => {
  const isOpen = navigation?.classList.toggle("open") ?? false;

  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Fechar menu" : "Abrir menu"
  );

  menuButton.textContent = isOpen ? "×" : "☰";
});

navigation?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");

    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Abrir menu");

    if (menuButton) {
      menuButton.textContent = "☰";
    }
  });
});

  // ==================================================
  // CONFIGURAÇÕES EDITÁVEIS DO SITE
  // ==================================================

  function applySiteConfig(config) {
    siteConfig = config;

    document.title = document.title.replace(
      "Palavra de Domingo",
      config.siteName || "Palavra de Domingo"
    );

    document.querySelectorAll(".brand-name").forEach(brand => {
      const subtitle = brand.querySelector("small");

      brand.firstChild.nodeValue =
        config.siteName || "Palavra de Domingo";

      if (subtitle && config.tagline) {
        subtitle.textContent = config.tagline;
      }
    });

    // Página inicial
    const pageName = window.location.pathname.split("/").pop();
const isHomePage = pageName === "" || pageName === "index.html";
const homeHero = isHomePage ? document.querySelector(".hero") : null;
    if (homeHero) {
      const eyebrow = homeHero.querySelector(".eyebrow");
      const title = homeHero.querySelector("h1");
      const description = homeHero.querySelector("p");

      if (eyebrow && config.homeEyebrow) {
        eyebrow.textContent = config.homeEyebrow;
      }

      if (title && config.homeTitle) {
        title.textContent = config.homeTitle;
      }

      if (description && config.homeDescription) {
        description.textContent = config.homeDescription;
      }
    }
    
    // Título e descrição da seção em destaque
    const featuredCard = document.querySelector(".featured-card");
    const featuredSection = featuredCard?.closest(".section");

    if (featuredSection) {
      const sectionTitle = featuredSection.querySelector(".section-head h2");
      const sectionDescription = featuredSection.querySelector(".section-head p");

      if (sectionTitle && config.featuredTitle) {
        sectionTitle.textContent = config.featuredTitle;
      }

      if (sectionDescription && config.featuredDescription) {
        sectionDescription.textContent = config.featuredDescription;
      }
        }
    
        // Imagem de capa configurada pelo CMS
    if (homeHero && config.homeImage) {
      const imagePath = String(config.homeImage).replace(/^\/+/, "");

      homeHero.classList.add("has-background-image");

      homeHero.style.backgroundImage =
        `linear-gradient(rgba(16, 43, 73, 0.78), rgba(16, 43, 73, 0.65)), url("${siteUrl(imagePath)}")`;
    }
    
    // Rodapés
    document.querySelectorAll(".site-footer").forEach(footer => {
      const heading = footer.querySelector(".footer-grid h3");

      if (heading && config.siteName) {
        heading.textContent = config.siteName;
      }

      const notice = footer.querySelector(".footer-bottom");

      if (notice && config.projectNotice) {
        notice.textContent =
          `© ${new Date().getFullYear()} ${config.siteName}. ${config.projectNotice}`;
      }
    });
    // Redes sociais configuradas pelo CMS
    document.querySelectorAll(".site-footer").forEach(footer => {
      const oldSocial = footer.querySelector(".footer-social");

      if (oldSocial) oldSocial.remove();

      const socialLinks = [
        { name: "Instagram", url: config.instagramUrl },
        { name: "Facebook", url: config.facebookUrl },
        { name: "YouTube", url: config.youtubeUrl },
        { name: "WhatsApp", url: config.whatsappUrl }
      ];

      const validLinks = socialLinks.filter(item => {
        if (!item.url) return false;

        try {
          const url = new URL(item.url);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      });

      if (validLinks.length > 0) {
        const section = document.createElement("div");
        section.className = "footer-social";

        const heading = document.createElement("h3");
        heading.textContent = "Redes sociais";

        section.appendChild(heading);

        validLinks.forEach(item => {
          const link = document.createElement("a");

          link.href = item.url;
          link.textContent = item.name;
          link.target = "_blank";
          link.rel = "noopener noreferrer";

          section.appendChild(link);
        });

        footer.querySelector(".footer-grid")?.appendChild(section);
      }
    });
    // Informações da página Sobre
    if (document.querySelector(".content-panel")) {
      const aboutHeading = [...document.querySelectorAll(".content-panel h2")]
        .find(element => element.textContent.includes("Uma palavra para continuar"));

      if (aboutHeading && config.aboutTitle) {
        aboutHeading.textContent = config.aboutTitle;
      }

      const aboutDescription = [...document.querySelectorAll(".content-panel p")]
        .find(element => element.textContent.includes("O Palavra de Domingo nasceu"));

      if (aboutDescription && config.aboutDescription) {
        aboutDescription.textContent = config.aboutDescription;
      }

      const proposal = [...document.querySelectorAll(".content-panel p")]
        .find(element => element.textContent.includes("Este projeto independente busca"));

      if (proposal && config.aboutProposal) {
        proposal.textContent = config.aboutProposal;
      }
    }
    // Imagem da igreja configurada pelo CMS
    const churchImage = document.querySelector("#church-image");
    const churchImageWrap = document.querySelector("#church-image-wrap");

    if (churchImage && churchImageWrap && config.churchImage) {
      const imagePath = String(config.churchImage).replace(/^\/+/, "");

      churchImage.src = siteUrl(imagePath);
      churchImageWrap.hidden = false;
    }
    // Informações da página da igreja
    const churchHeading = [...document.querySelectorAll("h2")]
      .find(element => element.textContent.trim() === "IEQ Resgate");

    if (churchHeading && config.churchName) {
      churchHeading.textContent = config.churchName;
    }

    const address = [...document.querySelectorAll(".info-item p")]
      .find(element => element.textContent.includes("Passagem Iracema"));

    if (address && config.churchAddress) {
      address.textContent = config.churchAddress;
    }

    const mapLink = [...document.querySelectorAll("a")]
      .find(element => element.textContent.includes("Abrir localização"));

    if (mapLink && config.churchMapUrl) {
      mapLink.href = config.churchMapUrl;
    }

    const service = [...document.querySelectorAll(".info-item p")]
      .find(element => element.textContent.includes("Domingo, às 18h30"));

    if (service && config.youthService) {
      service.textContent = config.youthService;
    }

    // Cores personalizadas
    const validColor = value =>
      typeof value === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(value);

    if (validColor(config.primaryColor)) {
      root.style.setProperty("--brand-primary", config.primaryColor);
    }

    if (validColor(config.secondaryColor)) {
      root.style.setProperty("--brand-secondary", config.secondaryColor);
    }

    if (validColor(config.accentColor)) {
      root.style.setProperty("--brand-accent", config.accentColor);
    }
  }

  // ==================================================
  // CARTÕES DAS MENSAGENS
  // ==================================================

    // Verifica se uma mensagem está liberada para publicação
  function isPublished(message) {
  return message.status === "publicado";
  }
  
  function createMessageCard(message) {
    const category = categoryNames[message.category] || "Reflexão";

    return `
      <a class="message-card"
         href="${escapeHTML(messageUrl(message))}"
         data-category="${escapeHTML(message.category)}">

        <span class="tag">${escapeHTML(category)}</span>

        <h3>${escapeHTML(message.title)}</h3>

        <p>${escapeHTML(message.excerpt)}</p>

        <div class="card-meta">
          <span>${escapeHTML(message.reference)}</span>
          <span>Ler mensagem →</span>
        </div>

      </a>
    `;
  }

  function renderMessageLists() {
    const publishedMessages = messages.filter(isPublished);

    // Biblioteca
    const library = document.querySelector("#message-list");

    if (library) {
      library.innerHTML = publishedMessages
        .map(createMessageCard)
        .join("");

      setupFilters();
    }

    // Página inicial
    const homeGrid = document.querySelector(
      "main > .section .message-grid:not(#message-list)"
    );

    if (homeGrid) {
      const featured = publishedMessages.find(
  message =>
    message.featured === true &&
    message.demonstration !== true
);

      const otherMessages = publishedMessages
        .filter(message => !featured || message.slug !== featured.slug)
        .slice(0, 3);

      homeGrid.innerHTML = otherMessages
        .map(createMessageCard)
        .join("");
    }
  }
    
  // ==================================================
  // CARREGAR MENSAGEM INDIVIDUAL
  // ==================================================

  function renderDynamicMessage() {
    const page = document.querySelector("[data-dynamic-message]");

    if (!page) return;

    const slug = new URLSearchParams(window.location.search).get("slug");

    const message = messages.find(item =>
      item.slug === slug && isPublished(item)
    );

    const title = document.querySelector("#message-title");
    const category = document.querySelector("#message-category");
    const excerpt = document.querySelector("#message-excerpt");
    const reference = document.querySelector("#message-reference");
    const status = document.querySelector("#message-status");
    const lead = document.querySelector("#message-lead");
    const body = document.querySelector("#message-body");
    const prompt = document.querySelector("#reflection-prompt");
    const asideReference = document.querySelector("#aside-reference");
    const notice = document.querySelector("#demonstration-notice");

    if (!message) {
      if (title) title.textContent = "Mensagem não encontrada";
      if (category) category.textContent = "Indisponível";
      if (excerpt) excerpt.textContent =
        "Esta mensagem não está disponível ou ainda não foi publicada.";

      if (body) body.replaceChildren();

      return;
    }

    const categoryName =
      categoryNames[message.category] || "Reflexão";

    document.title = `${message.title} | Palavra de Domingo`;

    if (title) title.textContent = message.title;
    if (category) category.textContent = categoryName;
    if (excerpt) excerpt.textContent = message.excerpt || "";
    if (reference) reference.textContent = `📖 ${message.reference || ""}`;
    if (status) status.textContent = "Mensagem";
    if (lead) lead.textContent = message.excerpt || "";
    if (prompt) {
      prompt.textContent =
        message.reflectionPrompt ||
        "Reserve um momento para escrever suas próprias percepções e aprendizados.";
    }

    if (asideReference) {
      asideReference.textContent =
        message.reference || "Consulte sua Bíblia.";
    }

    if (body) {
      body.innerHTML = sanitizeMessageHTML(message.body || "");
    }

    if (notice) {
      notice.hidden = message.demonstration !== true;
    }

    const textarea = document.querySelector("#personal-reflection");

    if (textarea) {
      textarea.dataset.reflectionId = message.slug;
    }

    setupReflections();

    const toc = document.querySelector("#message-toc");

    if (toc && body) {
      const headings = body.querySelectorAll("h2");

      toc.replaceChildren();

      const startLink = document.createElement("a");
      startLink.href = "#top";
      startLink.textContent = "Início";
      toc.appendChild(startLink);

      headings.forEach((heading, index) => {
        const id = `section-${index + 1}`;

        heading.id = id;

        const link = document.createElement("a");
        link.href = `#${id}`;
        link.textContent = heading.textContent;

        toc.appendChild(link);
      });
    }
  }
    
    // Mensagem em destaque
    renderFeaturedMessage(publishedMessages);
  }

  function renderFeaturedMessage(publishedMessages) {
    const card = document.querySelector(".featured-card");

    if (!card) return;

    const featured = publishedMessages.find(
  message =>
    message.featured === true &&
    message.demonstration !== true
);

    if (!featured) {
      card.hidden = true;
      return;
    }

    card.hidden = false;

    const category = categoryNames[featured.category] || "Reflexão";

    const tag = card.querySelector(".tag");
    const title = card.querySelector("h3");
    const description = card.querySelector(".featured-copy > p");
    const reference = card.querySelector(".featured-copy strong");
    const link = card.querySelector(".featured-copy .btn");

    if (tag) tag.textContent = category;
    if (title) title.textContent = featured.title;
    if (description) description.textContent = featured.excerpt;
    if (reference) reference.textContent = featured.reference;

    if (link) {
      link.href = messageUrl(featured);
    }
  }

  // ==================================================
  // PESQUISA E FILTROS DA BIBLIOTECA
  // ==================================================

  function setupFilters() {
    const searchInput = document.querySelector("#message-search");
    const filterButtons = document.querySelectorAll("[data-filter]");
    const emptyState = document.querySelector(".empty-state");

    let activeFilter = "all";

    function filterMessages() {
      const searchTerm = searchInput?.value
        .trim()
        .toLocaleLowerCase("pt-BR") || "";

      const cards = document.querySelectorAll("#message-list .message-card");

      let visibleCount = 0;

      cards.forEach(card => {
        const category = card.dataset.category || "all";

        const content = card.textContent.toLocaleLowerCase("pt-BR");

        const matchesSearch = content.includes(searchTerm);

        const matchesFilter =
          activeFilter === "all" || category === activeFilter;

        const visible = matchesSearch && matchesFilter;

        card.classList.toggle("hidden", !visible);

        if (visible) visibleCount++;
      });

      if (emptyState) {
        emptyState.classList.toggle("hidden", visibleCount > 0);
      }
    }

    searchInput?.addEventListener("input", filterMessages);

    filterButtons.forEach(button => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";

        filterButtons.forEach(item => {
          const active = item === button;

          item.classList.toggle("active", active);

          item.setAttribute("aria-pressed", String(active));
        });

        filterMessages();
      });
    });
  }


  // ==================================================
  // SALVAR REFLEXÕES NO DISPOSITIVO
  // ==================================================

  function setupReflections() {
    document.querySelectorAll("[data-reflection-id]").forEach(textarea => {
      const id = textarea.dataset.reflectionId;

      if (!id || textarea.dataset.reflectionReady === "true") return;

      const storageKey = `pdd-reflection-${id}`;

      const savedText = localStorage.getItem(storageKey);

      if (savedText !== null) {
        textarea.value = savedText;
      }

      let saveStatus = textarea.parentElement?.querySelector(".saved-note");

      if (!saveStatus) {
        saveStatus = document.createElement("p");
        saveStatus.className = "saved-note";
        textarea.insertAdjacentElement("afterend", saveStatus);
      }

      saveStatus.textContent =
        "Suas anotações ficam salvas neste dispositivo.";

      textarea.addEventListener("input", () => {
        localStorage.setItem(storageKey, textarea.value);

        saveStatus.textContent =
          "Reflexão salva neste dispositivo ✓";
      });

      textarea.dataset.reflectionReady = "true";
    });
  }

  function setupDynamicReflection() {
    const textarea = document.querySelector(
      "#personal-reflection[data-reflection-id]"
    );

    if (!textarea) return;

    const slug = new URLSearchParams(window.location.search).get("slug");

    if (!slug) return;

    textarea.dataset.reflectionId = slug;

    setupReflections();
  }

  setupReflections();
  setupDynamicReflection();

  // ==================================================
  // COMPARTILHAR MENSAGENS
  // ==================================================

  document.querySelectorAll("[data-share]").forEach(button => {
    button.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: button.dataset.share ||
          "Confira esta mensagem no Palavra de Domingo.",
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(shareData.url);
          button.textContent = "Link copiado!";
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Não foi possível compartilhar:", error);
        }
      }
    });
  });

  // ==================================================
  // INICIALIZAÇÃO DOS CONTEÚDOS
  // ==================================================

  async function initializeContent() {
    try {
      const [config, messageData] = await Promise.all([
        loadJSON("content/site.json"),
        loadJSON("content/messages.json")
      ]);

      siteConfig = config;
      messages = Array.isArray(messageData) ? messageData : [];

      applySiteConfig(config);
      renderMessageLists();
      renderDynamicMessage();

      console.info("Palavra de Domingo: conteúdos carregados.");
    } catch (error) {
      console.error("Erro ao carregar os conteúdos do site:", error);
    }
  }

  initializeContent();

})();
                               
