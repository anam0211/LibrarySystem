import { initLibraryApp } from "./app.js";

function renderBootstrapError(error) {
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    return;
  }

  const message = error instanceof Error ? error.message : "Khong the khoi dong frontend.";
  const details = error instanceof Error && error.stack ? error.stack : String(error || "");

  appRoot.innerHTML = `
    <section class="startup-card">
      <p class="eyebrow">Khoi dong that bai</p>
      <h1>Frontend chua render duoc giao dien</h1>
      <p class="subtle">Hay nhan <strong>Ctrl + F5</strong> de tai lai cache. Neu van loi, xem chi tiet ben duoi.</p>
      <div class="startup-error">
        <strong>${message}</strong>
        <pre>${details}</pre>
      </div>
    </section>
  `;
}

try {
  initLibraryApp();
} catch (error) {
  console.error(error);
  renderBootstrapError(error);
}
