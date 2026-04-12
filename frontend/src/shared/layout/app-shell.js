import { escapeHtml } from "../utils/format.js";

export const navigationSections = [
  {
    title: "Catalog",
    items: [
      { id: "dashboard", label: "Dashboard", description: "Số liệu catalog" },
      { id: "books", label: "Sách", description: "Quản lý đầu sách" },
      { id: "authors", label: "Tác giả", description: "Danh sách tác giả" },
      { id: "categories", label: "Danh mục", description: "Nhóm phân loại" },
      { id: "publishers", label: "Nhà xuất bản", description: "Đơn vị phát hành" },
      { id: "search", label: "Tìm kiếm", description: "Tra cứu dữ liệu" }
    ]
  },
  {
    title: "Hệ thống",
    items: [
      { id: "users", label: "Tài khoản", description: "Người dùng, vai trò" },
      { id: "operations", label: "Báo cáo", description: "Số liệu vận hành" }
    ]
  }
];

function getAvatarLabel(name) {
  const letters = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return letters || "BH";
}

function renderHoverMenu({
  label,
  items,
  activeId = "",
  itemAttr,
  filterTarget,
  filterPlaceholder,
  emptyLabel
}) {
  const showFilter = items.length > 8;

  return `
    <div class="public-hover-menu">
      <button class="public-nav-btn ${activeId ? "active" : ""}" type="button">${escapeHtml(label)}</button>
      <div class="public-hover-panel">
        ${showFilter
          ? `
            <div class="field public-hover-search-wrap">
              <input
                class="public-hover-search"
                type="search"
                placeholder="${escapeHtml(filterPlaceholder)}"
                data-dropdown-filter-target="${filterTarget}"
              >
            </div>
          `
          : ""}
        <div class="public-hover-list" data-dropdown-list="${filterTarget}">
          ${items.length
            ? items
                .map(
                  (item) => `
                    <button
                      class="public-hover-link ${String(activeId) === String(item.id) ? "active" : ""}"
                      type="button"
                      data-page="home"
                      ${itemAttr}="${item.id}"
                      data-dropdown-value="${escapeHtml(String(item.name || "").toLowerCase())}"
                    >
                      ${escapeHtml(item.name)}
                    </button>
                  `
                )
                .join("")
            : `<div class="public-hover-empty">${escapeHtml(emptyLabel)}</div>`}
        </div>
        ${items.length
          ? `<div class="public-hover-empty" data-dropdown-empty="${filterTarget}" hidden>Không có mục phù hợp.</div>`
          : ""}
      </div>
    </div>
  `;
}

function renderNavigation(activePage) {
  return navigationSections
    .map(
      (section) => `
        <div class="nav-section">
          <p class="nav-section-label">${escapeHtml(section.title)}</p>
          <div class="nav">
            ${section.items
              .map(
                (item) => `
                  <button class="nav-btn ${item.id === activePage ? "active" : ""}" type="button" data-page="${item.id}">
                    <span class="nav-btn-title">${escapeHtml(item.label)}</span>
                    <span class="nav-btn-note">${escapeHtml(item.description)}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function renderUserDropdown(isAuthenticated, session) {
  if (!isAuthenticated || !session) {
    return `<button class="public-cta-btn" type="button" data-page="login">Đăng nhập</button>`;
  }

  const avatarLabel = getAvatarLabel(session.name || session.email || "U");
  const shortName = (session.name || session.email || "Tài khoản").split(" ").pop();

  return `
    <div class="public-user-menu">
      <button class="public-user-btn" type="button" aria-label="Tài khoản" aria-haspopup="true" aria-expanded="false">
        <span class="public-user-avatar">${escapeHtml(avatarLabel)}</span>
        <span class="public-user-name">${escapeHtml(shortName)}</span>
        <span class="public-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="public-user-panel" role="menu">
        <div class="public-user-info">
          <strong>${escapeHtml(session.name || "Người dùng")}</strong>
          <p class="mini">${escapeHtml(session.email || "")}</p>
        </div>
        <hr class="public-user-divider">
        <button class="public-user-link" type="button" data-page="reader" role="menuitem">Trang cá nhân</button>
        <button class="public-user-link" type="button" data-page="reader" role="menuitem">Lịch sử mượn</button>
        <button class="public-user-link danger" type="button" data-action="public-logout" role="menuitem">Đăng xuất</button>
      </div>
    </div>
  `;
}

export function renderLoginShell() {
  return `
    <div class="auth-shell">
      <section class="auth-panel">
        <div class="auth-brand">
          <span class="auth-logo">BH</span>
          <div class="auth-brand-copy">
            <p class="eyebrow">BookHub Library</p>
            <h1>Đăng nhập và đăng ký theo đúng luồng của hệ thống thư viện</h1>
            <p class="subtle">
              Một màn xác thực gọn, rõ vai trò và đủ đẹp để làm điểm chạm đầu tiên cho người dùng.
            </p>
          </div>
        </div>
        <div id="auth-root"></div>
      </section>

      <aside class="auth-highlight">
        <div class="highlight-card">
          <p class="eyebrow">Trải nghiệm xác thực</p>
          <h2>Không gian đăng nhập nên vừa rõ nghiệp vụ vừa đủ “ra sản phẩm” để demo tự tin hơn.</h2>

          <div class="auth-highlight-metrics">
            <div class="auth-highlight-metric">
              <strong>3 vai trò</strong>
              <span>Admin, Thủ thư, Độc giả</span>
            </div>
            <div class="auth-highlight-metric">
              <strong>1 luồng</strong>
              <span>Đăng nhập xong điều hướng theo quyền</span>
            </div>
          </div>

          <ul class="auth-notes">
            <li>Quản trị viên và thủ thư dùng tài khoản đã seed sẵn trong database.</li>
            <li>Đăng ký mới tạo tài khoản độc giả và có thể dùng ngay sau khi xác thực.</li>
            <li>Các API auth vẫn giữ nguyên, nên phần giao diện mới không phá backend hiện tại.</li>
          </ul>
        </div>
      </aside>
    </div>
  `;
}

export function renderAppShell({
  session,
  activePage,
  pageTitle,
  pageDescription,
  pageContent,
  quickSearchQuery = ""
}) {
  return `
    <div class="workspace-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="logo">BH</div>
          <div>
            <h1>BookHub Console</h1>
            <p>Bảng điều khiển thư viện</p>
          </div>
        </div>

        <div class="profile">
          <div class="avatar">${getAvatarLabel(session.name)}</div>
          <div>
            <p><strong>${escapeHtml(session.name)}</strong></p>
            <small>${escapeHtml(session.role)} / ${escapeHtml(session.email)}</small>
          </div>
        </div>

        ${renderNavigation(activePage)}
      </aside>

      <main class="content">
        <header class="topbar">
          <div class="topbar-left">
            <div class="breadcrumb">
              <span>BookHub</span>
              <span class="breadcrumb-sep">/</span>
              <span>Console</span>
              <span class="breadcrumb-sep">/</span>
              <span class="breadcrumb-current">${escapeHtml(pageTitle)}</span>
            </div>
            <div class="page-summary">
              <h2 class="card-title">${escapeHtml(pageTitle)}</h2>
              <p>${escapeHtml(pageDescription)}</p>
            </div>
          </div>

          <div class="topbar-right">
            <form id="quick-search-form" class="quick-search">
              <input
                id="quick-search-input"
                name="query"
                type="text"
                value="${escapeHtml(quickSearchQuery)}"
                placeholder="Tìm sách, tác giả, ISBN hoặc thể loại"
              >
              <button class="btn secondary" type="submit">Tìm</button>
            </form>
            <button class="btn primary" type="button" data-action="logout">Đăng xuất</button>
          </div>
        </header>

        <section class="page active">
          ${pageContent}
        </section>
      </main>
    </div>
  `;
}

export function renderPublicShell({
  activePage,
  pageContent,
  isAuthenticated = false,
  session = null,
  categoryLinks = [],
  authorLinks = [],
  activeCategoryId = "",
  activeAuthorId = "",
  toolbarContent = ""
}) {
  const currentYear = new Date().getFullYear();

  return `
    <div class="public-shell">
      <header class="public-topbar">
        <div class="public-navbar">
          <button class="brand public-brand public-brand-plain" type="button" data-page="home" aria-label="Về trang chủ">
            <div>
              <h1>BOOKHUB</h1>
              <p class="subtle">Library</p>
            </div>
          </button>

          <nav class="public-nav public-nav-main">
            <button class="public-nav-btn ${activePage === "home" ? "active" : ""}" type="button" data-page="home">Trang chủ</button>
            ${renderHoverMenu({
              label: "Danh mục",
              items: categoryLinks,
              activeId: activeCategoryId,
              itemAttr: "data-category-id",
              filterTarget: "category-links",
              filterPlaceholder: "Lọc danh mục...",
              emptyLabel: "Chưa có danh mục."
            })}
            ${renderHoverMenu({
              label: "Tác giả",
              items: authorLinks,
              activeId: activeAuthorId,
              itemAttr: "data-author-id",
              filterTarget: "author-links",
              filterPlaceholder: "Lọc tác giả...",
              emptyLabel: "Chưa có tác giả."
            })}
          </nav>

          <div class="public-nav-tools">
            <button
              class="public-icon-btn"
              type="button"
              ${activePage === "home" ? 'data-action="home-toggle-search-toolbar"' : 'data-page="home"'}
              aria-label="Tìm kiếm"
            >
              <span class="public-search-icon" aria-hidden="true"></span>
              <span class="sr-only">Tìm kiếm</span>
            </button>
            ${renderUserDropdown(isAuthenticated, session)}
          </div>
        </div>

        ${toolbarContent}
      </header>

      <main class="public-content">
        <section class="page active">
          ${pageContent}
        </section>
      </main>

      <footer class="public-footer">
        <div class="public-footer-grid">
          <div class="public-footer-brand">
            <strong class="public-footer-logo">BOOKHUB</strong>
            <p class="public-footer-copy">Tra cứu sách trực tuyến của thư viện.</p>

            <div class="public-footer-socials">
              <span class="public-footer-social">f</span>
              <span class="public-footer-social">yt</span>
              <span class="public-footer-social">z</span>
            </div>
          </div>

          <div class="public-footer-column">
            <h3 class="public-footer-title">Điều hướng</h3>
            <div class="public-footer-list">
              <button class="public-footer-nav" type="button" data-page="home">Trang chủ</button>
              <button class="public-footer-nav" type="button" data-page="reader">Tài khoản</button>
              <button class="public-footer-nav" type="button" data-page="${isAuthenticated ? "reader" : "login"}">${isAuthenticated ? "Trang cá nhân" : "Đăng nhập"}</button>
            </div>
          </div>

          <div class="public-footer-column">
            <h3 class="public-footer-title">Liên hệ</h3>
            <div class="public-footer-list">
              <span class="public-footer-item">BookHub Library</span>
              <span class="public-footer-item">Email: support@bookhub.local</span>
            </div>
          </div>

          <div class="public-footer-column public-footer-news">
            <h3 class="public-footer-title">Nhận cập nhật</h3>
            <div class="public-footer-subscribe">
              <input type="email" placeholder="Email của bạn" aria-label="Email của bạn">
              <button class="public-footer-subscribe-btn" type="button">Đăng ký</button>
            </div>
          </div>
        </div>

        <div class="public-footer-bottom">
          <p>© ${currentYear} BookHub Library</p>
          <p>Tra cứu sách trực tuyến</p>
        </div>
      </footer>
    </div>
  `;
}
