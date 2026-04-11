export function renderLoginPage() {
  return `
    <div class="auth-card">
      <p class="eyebrow">Sign in</p>
      <h2>Open the library management workspace</h2>
      <p class="subtle">Use a local demo account while the backend auth module is still pending.</p>

      <form id="login-form" class="form-grid auth-form">
        <div class="field span-2">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" value="admin@bookhub.local" required>
        </div>

        <div class="field span-2">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" value="123456" required>
        </div>

        <div class="span-2 helper-list">
          <div class="list-item">
            <strong>Admin</strong>
            <p class="subtle">admin@bookhub.local / 123456</p>
          </div>
          <div class="list-item">
            <strong>Librarian</strong>
            <p class="subtle">librarian@bookhub.local / 123456</p>
          </div>
        </div>

        <p class="form-message span-2" id="login-message"></p>

        <div class="span-2 actions">
          <button class="btn primary" type="submit">Sign in</button>
        </div>
      </form>
    </div>
  `;
}

export function bindLoginPage({ root, store, onLoginSuccess }) {
  const form = root.querySelector("#login-form");
  const message = root.querySelector("#login-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    try {
      store.login({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      });

      if (message) {
        message.textContent = "";
      }

      await onLoginSuccess();
    } catch (error) {
      if (message) {
        message.textContent = error.message || "Unable to sign in.";
      }
    }
  });
}
