
(() => {
  "use strict";

  // ==========================================
  // CONFIGURAÇÃO
  // ==========================================

  const scriptUrl = document.currentScript.src;
  const siteRoot = new URL(".", scriptUrl);

  const siteUrl = path => new URL(path, siteRoot).href;

  const upcomingContainer = document.querySelector("#upcoming-events");
  const pastContainer = document.querySelector("#past-events");

  const upcomingEmpty = document.querySelector("#upcoming-empty");
  const pastEmpty = document.querySelector("#past-empty");


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


  // Interpreta datas no formato AAAA-MM-DD
  // usando o calendário local, sem problemas de fuso horário.
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


  // Apresenta a data em português.
  function formatDate(value) {
    const date = parseLocalDate(value);

    if (!date) return "Data a confirmar";

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long"
    }).format(date);
  }


  // Aceita somente imagens da pasta /media/.
  function getEventImage(value) {
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


  // Aceita somente links HTTP ou HTTPS.
  function getRegistrationUrl(value) {
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


  // ==========================================
  // CRIAÇÃO DOS CARTÕES
  // ==========================================

  
function createEventCard(event, isPast = false) {

  const imageUrl = getEventImage(event.image);

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

  const registrationUrl = getRegistrationUrl(
    event.registrationUrl
  );

  const registrationButton = registrationUrl && !isPast
    ? `
      <a
        class="btn btn-primary event-registration"
        href="${escapeHTML(registrationUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Inscreva-se ↗
      </a>
    `
    : "";

  // Cria o endereço da página individual.
  // O slug precisa seguir o padrão letras minúsculas e hífens.
  const validSlug =
    typeof event.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.slug);

  const detailsButton = validSlug
    ? `
      <a
        class="btn btn-secondary event-details"
        href="evento.html?slug=${encodeURIComponent(event.slug)}"
      >
        Ver detalhes →
      </a>
    `
    : "";

  const metadata = [
    `
      <span>
        📅 ${escapeHTML(formatDate(event.date))}
      </span>
    `,

    event.time
      ? `
        <span>
          🕒 ${escapeHTML(event.time)}
        </span>
      `
      : "",

    event.location
      ? `
        <span>
          📍 ${escapeHTML(event.location)}
        </span>
      `
      : ""

  ].filter(Boolean).join("");

  return `
    <article class="message-card event-card">

      ${image}

      <span class="tag">
        ${isPast ? "Evento realizado" : "Próximo evento"}
      </span>

      <h3>${escapeHTML(event.title)}</h3>

      <p>${escapeHTML(event.description || "")}</p>

      <div class="event-meta">
        ${metadata}
      </div>

      ${detailsButton}

      ${registrationButton}

    </article>
  `;
}

  // ==========================================
  // CARREGAMENTO DOS EVENTOS
  // ==========================================

  async function loadEvents() {

    if (!upcomingContainer || !pastContainer) {
      console.warn("Áreas de eventos não encontradas.");
      return;
    }

    try {

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


      // Data atual no calendário local.
      const today = new Date();

      today.setHours(0, 0, 0, 0);


      // Somente eventos publicados e com dados válidos.
      const publishedEvents = events.filter(event => {

        return (
          event &&
          event.status === "publicado" &&
          typeof event.title === "string" &&
          event.title.trim() !== "" &&
          parseLocalDate(event.date) !== null
        );

      });


      // Próximos eventos: hoje ou datas futuras.
      const upcomingEvents = publishedEvents
        .filter(event => {
          return parseLocalDate(event.date) >= today;
        })
        .sort((a, b) => a.date.localeCompare(b.date));


      // Histórico: eventos com data anterior a hoje.
      const pastEvents = publishedEvents
        .filter(event => {
          return parseLocalDate(event.date) < today;
        })
        .sort((a, b) => b.date.localeCompare(a.date));


      // Apresenta os cartões.
      upcomingContainer.innerHTML = upcomingEvents
        .map(event => createEventCard(event))
        .join("");

      pastContainer.innerHTML = pastEvents
        .map(event => createEventCard(event, true))
        .join("");


      // Controla as mensagens de listas vazias.
      if (upcomingEmpty) {
        upcomingEmpty.hidden = upcomingEvents.length > 0;
      }

      if (pastEmpty) {
        pastEmpty.hidden = pastEvents.length > 0;
      }


      // Remove os textos de carregamento.
      if (upcomingEvents.length === 0) {
        upcomingContainer.replaceChildren();
      }

      if (pastEvents.length === 0) {
        pastContainer.replaceChildren();
      }

    } catch (error) {

      console.error("Erro ao carregar eventos:", error);

      upcomingContainer.innerHTML = `
        <p class="notice" role="alert">
          Não foi possível carregar os próximos eventos.
          Tente novamente mais tarde.
        </p>
      `;

      pastContainer.innerHTML = `
        <p class="notice">
          Não foi possível carregar o histórico de eventos.
        </p>
      `;

    }

  }


  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  loadEvents();

})();
                      
