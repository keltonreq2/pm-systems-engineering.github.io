const $ = (selector) => document.querySelector(selector);
const pageStatus = $("#page-status");
const settingsForm = $("#settings-form");
const sizeLabel = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} Mo`;

function announce(message, isError = false) {
  pageStatus.textContent = message;
  pageStatus.classList.toggle("is-error", isError);
}

async function request(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const payload = response.headers.get("Content-Type")?.includes("application/json") ? await response.json() : null;
  if (response.status === 401) {
    window.location.replace("/admin/login/");
    throw new Error("Session expirée.");
  }
  if (!response.ok) throw new Error(payload?.error || "La demande a échoué.");
  return payload;
}

async function refresh() {
  try {
    const data = await request("/api/admin/settings");
    $("#linkedin-url").value = data.linkedinUrl;
    $("#linkedin-state").textContent = data.linkedinUrl ? "Configuré" : "À configurer";
    $("#site-public").checked = data.sitePublic;
    $("#visibility-state").textContent = data.sitePublic ? "Public" : "Privé";
    $("#cv-state").textContent = data.cvAvailable ? "Disponible" : "Absent";
    $("#cv-details").textContent = data.cvAvailable ? `CV enregistré · ${sizeLabel(data.cvSize)}` : "Aucun CV PDF n’est enregistré. Le bouton reste visible sur le portfolio.";
    $("#preview-cv").hidden = !data.cvAvailable;
    $("#delete-cv").hidden = !data.cvAvailable;
  } catch (error) {
    announce(error.message, true);
  }
}

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await request("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ linkedinUrl: $("#linkedin-url").value })
    });
    announce("Lien LinkedIn et visibilité enregistrés.");
    await refresh();
  } catch (error) { announce(error.message, true); }
});

$("#visibility-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const isPublic = $("#site-public").checked;
  const prompt = isPublic
    ? "Rendre le portfolio accessible à tous ?"
    : "Passer le portfolio en mode privé ? Les visiteurs verront une page de site privé.";
  if (!window.confirm(prompt)) return;
  try {
    await request("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ linkedinUrl: $("#linkedin-url").value, sitePublic: isPublic })
    });
    announce(isPublic ? "Le portfolio est public." : "Le portfolio est privé.");
    await refresh();
  } catch (error) { announce(error.message, true); }
});

$("#cv-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = $("#cv-file").files[0];
  if (!file) return;
  const data = new FormData();
  data.append("cv", file, file.name);
  try {
    await request("/api/admin/cv", { method: "PUT", body: data });
    $("#cv-file").value = "";
    announce("Le CV PDF a été enregistré.");
    await refresh();
  } catch (error) { announce(error.message, true); }
});

$("#delete-cv").addEventListener("click", async () => {
  if (!window.confirm("Supprimer le CV enregistré ? Le bouton restera visible et affichera son état indisponible.")) return;
  try {
    await request("/api/admin/cv", { method: "DELETE" });
    announce("Le CV a été supprimé.");
    await refresh();
  } catch (error) { announce(error.message, true); }
});

$("#logout-button").addEventListener("click", async () => {
  try {
    await request("/api/admin/logout", { method: "POST", headers: { Accept: "application/json" } });
    window.location.replace("/admin/login/");
  } catch (error) { announce(error.message, true); }
});

refresh();
