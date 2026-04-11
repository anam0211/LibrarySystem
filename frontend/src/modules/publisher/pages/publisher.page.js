import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const publishersMeta = {
  title: "Nhà xuất bản",
  description: "Quản lý danh sách nhà xuất bản thật đang liên kết trực tiếp với catalog sách."
};

function getDefaultFormValue() {
  return {
    id: "",
    name: ""
  };
}

export function createPublishersPageState() {
  return {
    selectedId: null,
    form: getDefaultFormValue(),
    query: "",
    message: "",
    scrollTarget: ""
  };
}

export function renderPublishersPage(store, pageState) {
  const publishers = store
    .getPublishers()
    .filter((publisher) => !pageState.query || publisher.name.toLowerCase().includes(pageState.query.toLowerCase()));
  const selectedPublisher = publishers.find((publisher) => publisher.id === pageState.selectedId) || publishers[0] || null;
  const relatedBooks = selectedPublisher
    ? store.getBookOptions().filter((book) => book.publisherId === selectedPublisher.id).slice(0, 6)
    : [];

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Nhà xuất bản</p>
        <h2>Quản lý đơn vị phát hành gắn với từng đầu sách</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="publishers-clear-search">Xóa tìm kiếm</button>
        <button class="btn primary" type="button" data-action="publishers-new">Tạo nhà xuất bản</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Tổng NXB</p><h3 class="card-title">${formatNumber(publishers.length)}</h3><p class="subtle">Số bản ghi đang có từ backend.</p></div>
      <div class="chip-card"><p class="eyebrow">Sách liên kết</p><h3 class="card-title">${formatNumber(publishers.reduce((total, publisher) => total + publisher.bookCount, 0))}</h3><p class="subtle">Tổng đầu sách đã gắn nhà xuất bản.</p></div>
      <div class="chip-card"><p class="eyebrow">Danh sách xem nhanh</p><h3 class="card-title">${formatNumber(relatedBooks.length)}</h3><p class="subtle">Số đầu sách đang hiển thị cho nhà xuất bản được chọn.</p></div>
    </div>

    <div class="grid-2 workspace-grid">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Danh sách NXB</p>
            <h3 class="card-title">Tìm và quản lý nhà xuất bản</h3>
          </div>
        </div>
        <div class="field">
          <label for="publishers-query">Tìm theo tên</label>
          <input id="publishers-query" type="text" value="${escapeHtml(pageState.query)}" placeholder="Nhập tên nhà xuất bản">
        </div>
        <div class="table-wrap table-spacing">
          <table class="table">
            <thead><tr><th>Nhà xuất bản</th><th>Sách</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
            <tbody>
              ${publishers.length
                ? publishers
                    .map(
                      (publisher) => `
                        <tr class="${selectedPublisher?.id === publisher.id ? "row-selected" : ""}">
                          <td><strong>${escapeHtml(publisher.name)}</strong></td>
                          <td>${formatNumber(publisher.bookCount)}</td>
                          <td>${formatDate(publisher.createdAt)}</td>
                          <td>
                            <div class="actions">
                              <button class="action-link" type="button" data-action="publishers-select" data-id="${publisher.id}">Xem</button>
                              <button class="action-link" type="button" data-action="publishers-edit" data-id="${publisher.id}">Sửa</button>
                              <button class="action-link danger" type="button" data-action="publishers-delete" data-id="${publisher.id}">Xóa</button>
                            </div>
                          </td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="4" class="table-empty">Không có nhà xuất bản phù hợp.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết NXB</p>
            <h3 class="card-title">${selectedPublisher ? escapeHtml(selectedPublisher.name) : "Chưa chọn nhà xuất bản"}</h3>
          </div>
        </div>
        ${selectedPublisher
          ? `
            <div class="detail-grid">
              <div class="detail-item"><p class="eyebrow">Số đầu sách</p><strong>${formatNumber(selectedPublisher.bookCount)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Ngày tạo</p><strong>${formatDate(selectedPublisher.createdAt)}</strong></div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Sách liên quan</h4>
                <p class="subtle">${escapeHtml(relatedBooks.map((book) => book.title).join(", ") || "Chưa có sách liên kết.")}</p>
              </div>
              <div class="chip-card">
                <h4>Ghi chú sử dụng</h4>
                <p class="subtle">Thông tin nhà xuất bản đang được giữ gọn để dễ đồng bộ với hợp đồng dữ liệu của catalog.</p>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chọn một nhà xuất bản để xem dữ liệu liên quan.</p>'}
      </div>
    </div>

    <div id="publishers-form-section" class="table-card full-width-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Form nhà xuất bản</p>
          <h3 class="card-title">${pageState.form.id ? "Cập nhật nhà xuất bản" : "Tạo nhà xuất bản mới"}</h3>
        </div>
      </div>
      <form id="publishers-form" class="form-grid form-grid-full">
        <input type="hidden" name="id" value="${pageState.form.id}">
        <div class="field span-2">
          <label>Tên nhà xuất bản</label>
          <input name="name" type="text" value="${escapeHtml(pageState.form.name)}" placeholder="Ví dụ: NXB Trẻ" required>
        </div>
        <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
        <div class="actions span-2">
          <button class="btn primary" type="submit">${pageState.form.id ? "Lưu nhà xuất bản" : "Tạo nhà xuất bản"}</button>
          <button class="btn secondary" type="button" data-action="publishers-cancel">Xóa nội dung</button>
        </div>
      </form>
    </div>
  `;
}

export function bindPublishersPage({ root, store, pageState, setPageState }) {
  const searchInput = root.querySelector("#publishers-query");
  const form = root.querySelector("#publishers-form");
  const formSection = root.querySelector("#publishers-form-section");

  if (pageState?.scrollTarget === "publishers-form-section" && formSection) {
    window.requestAnimationFrame(() => {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      pageState.scrollTarget = "";
    });
  }

  searchInput?.addEventListener("input", (event) => {
    setPageState({
      query: event.target.value
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const savedPublisher = await store.savePublisher({
        id: String(formData.get("id") || ""),
        name: String(formData.get("name") || "")
      });

      setPageState(
        {
          selectedId: savedPublisher?.id || null,
          form: getDefaultFormValue(),
          message: formData.get("id") ? "Cập nhật nhà xuất bản thành công." : "Tạo nhà xuất bản thành công."
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Không thể lưu nhà xuất bản."
      });
    }
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === "publishers-clear-search") {
        setPageState({ query: "" });
      }

      if (action === "publishers-new" || action === "publishers-cancel") {
        setPageState({
          form: getDefaultFormValue(),
          message: "",
          scrollTarget: "publishers-form-section"
        });
      }

      if (action === "publishers-select") {
        setPageState({
          selectedId: id,
          message: ""
        });
      }

      if (action === "publishers-edit") {
        const publisher = store.getPublisherById(id);

        if (!publisher) {
          return;
        }

        setPageState({
          selectedId: id,
          form: {
            id: String(publisher.id),
            name: publisher.name
          },
          message: "",
          scrollTarget: "publishers-form-section"
        });
      }

      if (action === "publishers-delete") {
        const shouldDelete = window.confirm(`Xóa nhà xuất bản #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removePublisher(id);
          setPageState(
            {
              selectedId: null,
              form: getDefaultFormValue(),
              message: "Xóa nhà xuất bản thành công."
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa nhà xuất bản."
          });
        }
      }
    });
  });
}
