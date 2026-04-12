import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const usersMeta = {
  title: "Tài khoản",
  description: "Quản lý tài khoản, vai trò và trạng thái người dùng từ backend."
};

export function createUsersPageState() {
  return {
    query: "",
    status: "",
    selectedId: null,
    message: ""
  };
}

function getStatusLabel(status) {
  return status === "SUSPENDED" ? "Tạm khóa" : "Hoạt động";
}

function getRoleLabel(role) {
  if (role === "ADMIN") {
    return "Admin";
  }
  if (role === "LIBRARIAN") {
    return "Thủ thư";
  }
  return "Độc giả";
}

export function renderUsersPage(store, pageState) {
  const users = store.getUsers()
    .filter((user) => {
      if (pageState.status && user.status !== pageState.status) {
        return false;
      }

      if (!pageState.query) {
        return true;
      }

      const keyword = pageState.query.toLowerCase();
      return user.fullName.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword);
    });
  const currentUser = store.getCurrentUser();
  const selectedUser = users.find((user) => user.id === pageState.selectedId) || users[0] || null;

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Tài khoản</p>
        <h2>Quản lý người dùng</h2>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card">
        <p class="eyebrow">Tổng tài khoản</p>
        <h3 class="card-title">${formatNumber(users.length)}</h3>
        <p class="subtle">Số lượng đang hiển thị theo bộ lọc hiện tại.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Đang hoạt động</p>
        <h3 class="card-title">${formatNumber(users.filter((user) => user.status === "ACTIVE").length)}</h3>
        <p class="subtle">Tài khoản chưa bị tạm khóa.</p>
      </div>
      <div class="chip-card">
        <p class="eyebrow">Người đang đăng nhập</p>
        <h3 class="card-title">${escapeHtml(currentUser?.name || "-")}</h3>
        <p class="subtle">${escapeHtml(currentUser?.role || "Chưa xác định")}</p>
      </div>
    </div>

    <div class="grid-2 workspace-grid">
      <details class="table-card accordion-card" open>
        <summary class="accordion-summary">
          <div>
            <p class="eyebrow">Danh sách tài khoản</p>
            <h3 class="card-title">Lọc và thao tác trên người dùng</h3>
          </div>
          <span class="accordion-icon" aria-hidden="true"></span>
        </summary>
        <div class="accordion-content">

        <div class="form-grid">
          <div class="field">
            <label for="users-query">Tìm kiếm</label>
            <input id="users-query" type="text" value="${escapeHtml(pageState.query)}" placeholder="Họ tên hoặc email">
          </div>
          <div class="field">
            <label for="users-status">Trạng thái</label>
            <select id="users-status">
              <option value="" ${pageState.status === "" ? "selected" : ""}>Tất cả</option>
              <option value="ACTIVE" ${pageState.status === "ACTIVE" ? "selected" : ""}>Hoạt động</option>
              <option value="SUSPENDED" ${pageState.status === "SUSPENDED" ? "selected" : ""}>Tạm khóa</option>
            </select>
          </div>
        </div>

        <div class="table-wrap table-spacing">
          <table class="table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${users.length
                ? users.map((user) => `
                    <tr class="${selectedUser?.id === user.id ? "row-selected" : ""}">
                      <td><strong>${escapeHtml(user.fullName)}</strong></td>
                      <td>${escapeHtml(user.email)}</td>
                      <td>${escapeHtml(getRoleLabel(user.role))}</td>
                      <td><span class="status ${user.status === "SUSPENDED" ? "warning" : "success"}">${escapeHtml(getStatusLabel(user.status))}</span></td>
                      <td>
                        <div class="actions">
                          <button class="action-link" type="button" data-action="users-select" data-id="${user.id}">Xem</button>
                          <button class="action-link" type="button" data-action="users-suspend" data-id="${user.id}" ${user.status === "SUSPENDED" ? "disabled" : ""}>Tạm khóa</button>
                          <button class="action-link danger" type="button" data-action="users-delete" data-id="${user.id}">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  `).join("")
                : '<tr><td colspan="5" class="table-empty">Không có tài khoản phù hợp.</td></tr>'}
            </tbody>
          </table>
        </div>
        </div>
      </details>

      <div id="users-detail-section" class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết tài khoản</p>
            <h3 class="card-title">${escapeHtml(selectedUser?.fullName || "Chưa chọn tài khoản")}</h3>
          </div>
        </div>

        ${selectedUser
          ? `
            <div class="detail-grid">
              <div class="detail-item"><p class="eyebrow">Email</p><strong>${escapeHtml(selectedUser.email)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Vai trò</p><strong>${escapeHtml(getRoleLabel(selectedUser.role))}</strong></div>
              <div class="detail-item"><p class="eyebrow">Trạng thái</p><strong>${escapeHtml(getStatusLabel(selectedUser.status))}</strong></div>
              <div class="detail-item"><p class="eyebrow">Ngày tạo</p><strong>${escapeHtml(formatDate(selectedUser.createdAt))}</strong></div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Thông tin bổ sung</h4>
                <p class="subtle">Số điện thoại: ${escapeHtml(selectedUser.phone || "Chưa cập nhật")}</p>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chọn một tài khoản để xem thông tin.</p>'}

        <p class="form-message">${escapeHtml(pageState.message || "")}</p>
      </div>
    </div>
  `;
}

export function bindUsersPage({ root, store, pageState, setPageState }) {
  const detailSection = root.querySelector("#users-detail-section");

  root.querySelector("#users-query")?.addEventListener("input", (event) => {
    setPageState({
      query: event.target.value
    });
  });

  root.querySelector("#users-status")?.addEventListener("change", (event) => {
    setPageState({
      status: event.target.value
    });
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id || 0);

      if (action === "users-select") {
        setPageState({
          selectedId: id,
          message: ""
        });
        window.requestAnimationFrame(() => {
          detailSection?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }

      try {
        if (action === "users-suspend") {
          await store.suspendUser(id);
          setPageState({
            selectedId: id,
            message: "Tạm khóa tài khoản thành công."
          }, { reload: true });
          return;
        }

        if (action === "users-delete") {
          await store.removeUser(id);
          setPageState({
            selectedId: null,
            message: "Xóa tài khoản thành công."
          }, { reload: true });
        }
      } catch (error) {
        setPageState({
          selectedId: id,
          message: error.message || "Không thể xử lý tài khoản này."
        });
      }
    });
  });
}
