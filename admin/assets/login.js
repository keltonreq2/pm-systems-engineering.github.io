const form = document.querySelector("#login-form");
const status = document.querySelector("#login-status");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Connexion…";
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: form.username.value, password: form.password.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Connexion impossible.");
    form.password.value = "";
    window.location.replace("/admin/");
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
});
