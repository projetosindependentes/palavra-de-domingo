
(() => {
  "use strict";

  // TEMA CLARO E ESCURO
  const root = document.documentElement;
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
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });

  // MENU PARA CELULARES
  const menuButton = document.querySelector(
    "#menu-toggle, [data-menu-toggle]"
  );
  const navigation = document.querySelector(".nav");

  menuButton?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("open");

    menuButton.setAttribute("aria-expanded", String(Boolean(isOpen)));
    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu"
    );
  });

  navigation?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  // PESQUISA E FILTROS DA BIBLIOTECA
  const searchInput = document.querySelector("#message-search");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const messageCards = document.querySelectorAll(".message-card");
  const emptyState = document.querySelector(".empty-state");

  let activeFilter = "all";

  function filterMessages() {
    const searchTerm = searchInput?.value
      .trim()
      .toLocaleLowerCase("pt-BR") || "";

    let visibleCount = 0;

    messageCards.forEach(card => {
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

  // SALVAR REFLEXÕES NO PRÓPRIO DISPOSITIVO
  document.querySelectorAll("[data-reflection-id]").forEach(textarea => {
    const id = textarea.dataset.reflectionId;
    if (!id) return;

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

    saveStatus.textContent = "Suas anotações ficam salvas neste dispositivo.";

    textarea.addEventListener("input", () => {
      localStorage.setItem(storageKey, textarea.value);
      saveStatus.textContent = "Reflexão salva neste dispositivo ✓";
    });
  });

  // COMPARTILHAR MENSAGENS
  document.querySelectorAll("[data-share]").forEach(button => {
    button.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: button.dataset.share || "Confira esta mensagem no Palavra de Domingo.",
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

})();
  
