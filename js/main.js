const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (menuButton && primaryNav) {
  const closeMenu = (returnFocus = false) => {
    menuButton.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
    if (returnFocus) menuButton.focus();
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link && !link.hasAttribute("data-language-switch")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMenu(true);
  });
}

document.querySelectorAll("[data-language-switch]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!window.location.hash) return;
    event.preventDefault();
    window.location.assign(`${link.href}${window.location.hash}`);
  });
});

const actionStatus = document.querySelector("#action-status");
const professionalActions = [...document.querySelectorAll("[data-professional-action]")];
const actionsFor = (action) => professionalActions.filter((item) => item.dataset.professionalAction === action);
const pageLanguage = document.documentElement.lang === "en" ? "en" : "fr";
const actionMessages = {
  fr: {
    linkedin: "Le lien LinkedIn n’est pas encore configuré.",
    "cv-fr": "Le CV français n’est pas encore disponible.",
    "cv-en": "Le CV anglais n’est pas encore disponible."
  },
  en: {
    linkedin: "The LinkedIn link has not been configured yet.",
    "cv-fr": "The French CV is not available yet.",
    "cv-en": "The English CV is not available yet."
  }
};

const showActionMessage = (message) => {
  if (!actionStatus) return;
  actionStatus.textContent = message;
  actionStatus.hidden = false;
  window.clearTimeout(showActionMessage.timeout);
  showActionMessage.timeout = window.setTimeout(() => { actionStatus.hidden = true; }, 5000);
};

professionalActions.forEach((link) => {
  link.addEventListener("click", (event) => {
    const action = link.dataset.professionalAction;
    if (!link.dataset.configured) {
      event.preventDefault();
      showActionMessage(actionMessages[pageLanguage][action]);
    }
  });
});

fetch("/api/public-config", { headers: { Accept: "application/json" }, cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error("Public configuration unavailable");
    return response.json();
  })
  .then((config) => {
    if (config.linkedinUrl) {
      for (const link of actionsFor("linkedin")) {
        link.href = config.linkedinUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.dataset.configured = "true";
      }
    }
    const cvFrAvailable = config.cvFrAvailable ?? config.cvAvailable ?? false;
    if (cvFrAvailable) {
      for (const link of actionsFor("cv-fr")) {
        link.href = "/api/cv";
        link.dataset.configured = "true";
      }
    }
    if (config.cvEnAvailable) {
      for (const link of actionsFor("cv-en")) {
        link.href = "/api/cv/en";
        link.dataset.configured = "true";
      }
    }
  })
  .catch(() => professionalActions.forEach((link) => { delete link.dataset.configured; }));
