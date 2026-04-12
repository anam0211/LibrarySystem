function setActiveMode(root, mode) {
  root.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
    button.setAttribute("aria-selected", String(button.dataset.authMode === mode));
  });

  root.querySelectorAll("[data-auth-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.authPanel !== mode;
  });
}

function clearAuthMessages(root) {
  root.querySelectorAll("[data-auth-message]").forEach((node) => {
    node.textContent = "";
  });
}

function fillDemoCredentials(root, { mode, email = "", password = "", fullName = "", phone = "" }) {
  setActiveMode(root, mode);
  clearAuthMessages(root);

  const loginEmailInput = root.querySelector("#login-email");
  const loginPasswordInput = root.querySelector("#login-password");
  const registerFullNameInput = root.querySelector("#register-full-name");
  const registerEmailInput = root.querySelector("#register-email");
  const registerPhoneInput = root.querySelector("#register-phone");
  const registerPasswordInput = root.querySelector("#register-password");
  const registerConfirmPasswordInput = root.querySelector("#register-confirm-password");

  if (loginEmailInput) {
    loginEmailInput.value = email;
  }
  if (loginPasswordInput) {
    loginPasswordInput.value = password;
  }
  if (registerFullNameInput) {
    registerFullNameInput.value = fullName;
  }
  if (registerEmailInput) {
    registerEmailInput.value = email;
  }
  if (registerPhoneInput) {
    registerPhoneInput.value = phone;
  }
  if (registerPasswordInput) {
    registerPasswordInput.value = password;
  }
  if (registerConfirmPasswordInput) {
    registerConfirmPasswordInput.value = password;
  }
}

export function renderLoginPage() {
  return `
    <div class="auth-stage">
      <section class="auth-card auth-card-main">
        <div class="auth-card-header">
          <div class="stack">
            <p class="eyebrow">Xác thực người dùng</p>
            <h2>Mở thư viện số bằng một luồng đăng nhập rõ ràng và gọn gàng</h2>
            <p class="subtle auth-card-copy">
              Quản trị viên và thủ thư dùng tài khoản có sẵn để vào dashboard. Độc giả mới có thể đăng ký ngay tại đây
              rồi chuyển sang khu người dùng sau khi đăng nhập.
            </p>
          </div>

          <div class="auth-security-pill">
            <strong>Truy cập an toàn</strong>
            <span>JWT, phân vai trò và điều hướng theo quyền.</span>
          </div>
        </div>

        <div class="auth-mode-switch" role="tablist" aria-label="Chọn chế độ xác thực">
          <button class="auth-mode-btn active" type="button" data-auth-mode="login" aria-selected="true">Đăng nhập</button>
          <button class="auth-mode-btn" type="button" data-auth-mode="register" aria-selected="false">Đăng ký</button>
        </div>

        <form id="login-form" class="form-grid auth-form auth-form-grid" data-auth-panel="login">
          <div class="field span-2">
            <label for="login-email">Email</label>
            <input id="login-email" name="email" type="email" autocomplete="username" placeholder="admin@library.com" required>
          </div>

          <div class="field span-2">
            <label for="login-password">Mật khẩu</label>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required>
          </div>

          <div class="auth-inline-note span-2">
            <span>Dùng tài khoản đã có trong database để vào dashboard tương ứng với vai trò.</span>
          </div>

          <p class="form-message span-2 auth-message" id="login-message" data-auth-message></p>

          <div class="span-2 actions auth-submit-row">
            <button class="btn primary" type="submit">Đăng nhập vào hệ thống</button>
          </div>
        </form>

        <form id="register-form" class="form-grid auth-form auth-form-grid" data-auth-panel="register" hidden>
          <div class="field span-2">
            <label for="register-full-name">Họ tên</label>
            <input id="register-full-name" name="fullName" type="text" autocomplete="name" placeholder="Nguyễn Văn A" required>
          </div>

          <div class="field">
            <label for="register-email">Email</label>
            <input id="register-email" name="email" type="email" autocomplete="email" placeholder="reader@library.com" required>
          </div>

          <div class="field">
            <label for="register-phone">Số điện thoại</label>
            <input id="register-phone" name="phone" type="tel" autocomplete="tel" placeholder="Không bắt buộc">
          </div>

          <div class="field">
            <label for="register-password">Mật khẩu</label>
            <input id="register-password" name="password" type="password" autocomplete="new-password" minlength="6" placeholder="Tối thiểu 6 ký tự" required>
          </div>

          <div class="field">
            <label for="register-confirm-password">Xác nhận mật khẩu</label>
            <input id="register-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="6" placeholder="Nhập lại mật khẩu" required>
          </div>

          <div class="auth-inline-note span-2">
            <span>Tài khoản mới sẽ được tạo với vai trò độc giả để dùng khu vực tra cứu và hồ sơ cá nhân.</span>
          </div>

          <p class="form-message span-2 auth-message" id="register-message" data-auth-message></p>

          <div class="span-2 actions auth-submit-row">
            <button class="btn primary" type="submit">Tạo tài khoản mới</button>
          </div>
        </form>
      </section>

      <aside class="auth-side-stack">
        <div class="auth-card auth-demo-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Tài khoản mẫu</p>
              <h3 class="card-title">Điền nhanh để test hệ thống</h3>
            </div>
          </div>

          <div class="auth-demo-grid">
            <button
              class="auth-demo-btn"
              type="button"
              data-auth-demo
              data-auth-demo-mode="login"
              data-auth-demo-email="admin@library.com"
              data-auth-demo-password="123456"
            >
              <strong>Admin</strong>
              <span>admin@library.com</span>
            </button>

            <button
              class="auth-demo-btn"
              type="button"
              data-auth-demo
              data-auth-demo-mode="login"
              data-auth-demo-email="librarian@library.com"
              data-auth-demo-password="123456"
            >
              <strong>Thủ thư</strong>
              <span>librarian@library.com</span>
            </button>

            <button
              class="auth-demo-btn"
              type="button"
              data-auth-demo
              data-auth-demo-mode="login"
              data-auth-demo-email="reader1@library.com"
              data-auth-demo-password="123456"
            >
              <strong>Độc giả</strong>
              <span>reader1@library.com</span>
            </button>
          </div>
        </div>

        <div class="auth-card auth-role-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Luồng truy cập</p>
              <h3 class="card-title">Mỗi vai trò vào đúng không gian làm việc</h3>
            </div>
          </div>

          <div class="auth-role-list">
            <article class="auth-role-item">
              <strong>Admin</strong>
              <p class="subtle">Quản lý tài khoản và theo dõi báo cáo tổng quan.</p>
            </article>
            <article class="auth-role-item">
              <strong>Thủ thư</strong>
              <p class="subtle">Làm việc với catalog sách, tác giả, danh mục và nhà xuất bản.</p>
            </article>
            <article class="auth-role-item">
              <strong>Độc giả</strong>
              <p class="subtle">Tra cứu sách, xem hồ sơ cá nhân và khu vực người dùng.</p>
            </article>
          </div>
        </div>
      </aside>
    </div>
  `;
}

export function bindLoginPage({ root, store, onLoginSuccess }) {
  const loginForm = root.querySelector("#login-form");
  const registerForm = root.querySelector("#register-form");
  const loginMessage = root.querySelector("#login-message");
  const registerMessage = root.querySelector("#register-message");
  const loginEmailInput = root.querySelector("#login-email");

  root.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveMode(root, button.dataset.authMode);
      clearAuthMessages(root);
    });
  });

  root.querySelectorAll("[data-auth-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      fillDemoCredentials(root, {
        mode: button.dataset.authDemoMode || "login",
        email: button.dataset.authDemoEmail || "",
        password: button.dataset.authDemoPassword || "",
        fullName: button.dataset.authDemoFullName || "",
        phone: button.dataset.authDemoPhone || ""
      });
    });
  });

  root.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      clearAuthMessages(root);
    });
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    try {
      await store.login({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || "")
      });

      if (loginMessage) {
        loginMessage.textContent = "";
      }

      await onLoginSuccess();
    } catch (error) {
      if (loginMessage) {
        loginMessage.textContent = error.message || "Không thể đăng nhập.";
      }
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      if (registerMessage) {
        registerMessage.textContent = "Mật khẩu xác nhận chưa khớp.";
      }
      return;
    }

    try {
      const message = await store.register({
        fullName: String(formData.get("fullName") || ""),
        email: String(formData.get("email") || ""),
        password,
        phone: String(formData.get("phone") || "")
      });

      registerForm.reset();
      if (loginEmailInput) {
        loginEmailInput.value = String(formData.get("email") || "");
      }
      if (registerMessage) {
        registerMessage.textContent = "";
      }
      if (loginMessage) {
        loginMessage.textContent = message || "Đăng ký thành công. Hãy đăng nhập để tiếp tục.";
      }

      setActiveMode(root, "login");
    } catch (error) {
      if (registerMessage) {
        registerMessage.textContent = error.message || "Không thể đăng ký tài khoản.";
      }
    }
  });
}
