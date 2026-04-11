import { escapeHtml } from "../utils/format.js";

export const navigationSections = [
  {
    title: "Catalog, Search & Analytics",
    items: [
      { id: "dashboard", label: "Dashboard", description: "Tổng quan số liệu catalog" },
      { id: "books", label: "Sách", description: "CRUD sách và upload file ngay trong form" },
      { id: "authors", label: "Tác giả", description: "Quản lý tác giả liên kết với sách" },
      { id: "categories", label: "Danh mục", description: "Nhóm cha và nhóm con của catalog" },
      { id: "publishers", label: "Nhà xuất bản", description: "Đơn vị xuất bản cho từng đầu sách" },
      { id: "search", label: "Tìm kiếm", description: "Tra cứu nâng cao cho catalog sách" }
    ]
  },
  {
    title: "Operations & Users",
    items: [
      { id: "users", label: "Người dùng", description: "Khung Auth, RBAC và hồ sơ độc giả" },
      { id: "circulation", label: "Mượn trả", description: "Khung nghiệp vụ mượn và trả sách" },
      { id: "notifications", label: "Thông báo", description: "Khung nhắc hạn và lịch gửi" },
      { id: "operations", label: "Báo cáo vận hành", description: "Khung dashboard vận hành" }
    ]
  }
];

const publicNavigationItems = [
  { id: "reader", label: "Tài khoản" }
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

function renderPublicNavigation(activePage) {
  return publicNavigationItems
    .map(
      (item) => `
        <button class="public-nav-btn ${item.id === activePage ? "active" : ""}" type="button" data-page="${item.id}">
          ${escapeHtml(item.label)}
        </button>
      `
    )
    .join("");
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

export function renderLoginShell() {
  return `
    <div class="auth-shell">
      <section class="auth-panel">
        <div class="auth-brand">
          <span class="auth-logo">BH</span>
          <div>
            <p class="eyebrow">BookHub Console</p>
            <h1>Không gian quản trị thư viện</h1>
            <p class="subtle">Nhóm catalog đã nối API thật. Nhóm vận hành vẫn giữ sẵn khung để nối backend ở bước tiếp theo.</p>
          </div>
        </div>
        <div id="auth-root"></div>
      </section>

      <aside class="auth-highlight">
        <div class="highlight-card">
          <p class="eyebrow">Cấu trúc workspace</p>
          <h2>Một frontend cho hai nhóm chức năng của hệ thống thư viện.</h2>
          <ul class="auth-notes">
            <li>Catalog, tìm kiếm, media và dashboard đang bám theo API thật của backend.</li>
            <li>Users, circulation, notifications và operations đã có sẵn khung giao diện để nối tiếp.</li>
            <li>Mỗi page tách riêng khỏi shell nên thay thế module sau này sẽ không làm vỡ layout.</li>
            <li>Data layer tập trung giúp việc nối API ổn định và dễ bảo trì hơn.</li>
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
            <p>Workspace quản trị thư viện</p>
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

        <div class="sidebar-note">
          <p class="eyebrow">Trạng thái triển khai</p>
          <h3>Catalog đã dùng backend thật. Khối vận hành sẵn sàng để nối tiếp.</h3>
          <p class="subtle">Cách tách này giúp bạn demo được ngay hôm nay nhưng vẫn giữ chỗ trống rõ ràng cho sprint backend kế tiếp.</p>
        </div>
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
                placeholder="Tìm sách, ISBN, tác giả hoặc danh mục"
              >
              <button class="btn secondary" type="submit">Tìm</button>
            </form>
            <button class="btn secondary" type="button" data-page="search">Mở tìm kiếm</button>
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
  categoryLinks = [],
  authorLinks = [],
  activeCategoryId = "",
  activeAuthorId = "",
  toolbarContent = ""
}) {
  return `
    <div class="public-shell">
      <header class="public-topbar">
        <div class="public-navbar">
          <div class="brand public-brand public-brand-plain">
            <div>
              <h1>BOOKHUB</h1>
              <p class="subtle">Library</p>
            </div>
          </div>

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
            ${renderPublicNavigation(activePage)}
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
            <button class="public-icon-btn" type="button" data-page="reader" aria-label="Tài khoản">Tài khoản</button>
            <button class="public-cta-btn" type="button" data-page="${isAuthenticated ? "dashboard" : "login"}">
              ${isAuthenticated ? "Admin" : "Đăng nhập"}
            </button>
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
        <div class="public-footer-brand">
          <strong>BookHub Library</strong>
          <p class="subtle">Không gian công khai của thư viện với bộ lọc, tìm kiếm, sách mới và khu vực người dùng.</p>
        </div>
        <div class="public-footer-links">
          <button class="action-link" type="button" data-page="home">Trang chủ</button>
          <button class="action-link" type="button" data-page="reader">Người dùng</button>
          <button class="action-link" type="button" data-page="${isAuthenticated ? "dashboard" : "login"}">${isAuthenticated ? "Admin" : "Đăng nhập"}</button>
        </div>
      </footer>
    </div>
  `;
}
