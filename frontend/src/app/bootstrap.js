import { initLibraryApp } from "./app.js";

function renderBootstrapError(error) {
  const appRoot = document.getElementById("app");

  if (!appRoot) {
    return;
  }

  const message = error instanceof Error ? error.message : "Không thể khởi động frontend.";
  const details = error instanceof Error && error.stack ? error.stack : String(error || "");

  appRoot.innerHTML = `
    <section class="startup-card">
      <p class="eyebrow">Khởi động thất bại</p>
      <h1>Frontend chưa render được giao diện</h1>
      <p class="subtle">Hãy nhấn <strong>Ctrl + F5</strong> để tải lại cache. Nếu vẫn lỗi, xem chi tiết bên dưới.</p>
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
