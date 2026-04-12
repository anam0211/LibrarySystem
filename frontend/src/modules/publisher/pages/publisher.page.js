import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";
import { scrollToElement } from "../../../shared/utils/scroll.js";

export const publishersMeta = {
  title: "Nhà xuất bản",
  description: "Quản lý nhà xuất bản và đầu sách liên kết trong catalog."
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
        <h2>Quản lý nhà xuất bản theo khu làm việc riêng</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="publishers-clear-search">Xóa tìm kiếm</button>
        <button class="btn primary" type="button" data-action="publishers-new">Tạo nhà xuất bản</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Tổng NXB</p><h3 class="card-title">${formatNumber(publishers.length)}</h3><p class="subtle">Số bản ghi hiện có.</p></div>
      <div class="chip-card"><p class="eyebrow">Sách liên kết</p><h3 class="card-title">${formatNumber(publishers.reduce((total, publisher) => total + publisher.bookCount, 0))}</h3><p class="subtle">Tổng số đầu sách đã gắn.</p></div>
      <div class="chip-card"><p class="eyebrow">Xem nhanh</p><h3 class="card-title">${formatNumber(relatedBooks.length)}</h3><p class="subtle">Sách của nhà xuất bản đang chọn.</p></div>
    </div>

    <div class="entity-admin-stack">
      <details class="table-card accordion-card" open>
        <summary class="accordion-summary">
          <div>
            <p class="eyebrow">Danh sách nhà xuất bản</p>
            <h3 class="card-title">Chọn một dòng để xem chi tiết</h3>
          </div>
          <span class="accordion-icon" aria-hidden="true"></span>
        </summary>
        <div class="accordion-content">
        <div class="field">
          <label for="publishers-query">Tìm theo tên</label>
          <input id="publishers-query" type="text" value="${escapeHtml(pageState.query)}" placeholder="Nhập tên nhà xuất bản">
        </div>
        <div class="table-wrap table-spacing">
          <table class="table">
            <thead>
              <tr>
                <th>Nhà xuất bản</th>
                <th>Sách</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              ${publishers.length
                ? publishers
                    .map(
                      (publisher) => `
                        <tr
                          class="record-row ${selectedPublisher?.id === publisher.id ? "row-selected" : ""}"
                          data-action="publishers-select"
                          data-id="${publisher.id}"
                          tabindex="0"
                        >
                          <td><strong>${escapeHtml(publisher.name)}</strong></td>
                          <td>${formatNumber(publisher.bookCount)}</td>
                          <td>${formatDate(publisher.createdAt)}</td>
                        </tr>
                      `
                    )
                    .join("")
                : '<tr><td colspan="3" class="table-empty">Không có nhà xuất bản phù hợp.</td></tr>'}
            </tbody>
          </table>
        </div>
        </div>
      </details>

      <div id="publishers-detail-section" class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết nhà xuất bản</p>
            <h3 class="card-title">${selectedPublisher ? escapeHtml(selectedPublisher.name) : "Chưa chọn nhà xuất bản"}</h3>
          </div>
          <div class="actions">
            <button class="btn secondary" type="button" data-action="publishers-edit" data-id="${selectedPublisher?.id || ""}" ${selectedPublisher ? "" : "disabled"}>Sửa</button>
            <button class="action-link danger" type="button" data-action="publishers-delete" data-id="${selectedPublisher?.id || ""}" ${selectedPublisher ? "" : "disabled"}>Xóa</button>
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
            </div>
          `
          : '<p class="subtle section-copy">Chọn một nhà xuất bản để xem chi tiết và thao tác.</p>'}
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
  const detailSection = root.querySelector("#publishers-detail-section");

  if (pageState.scrollTarget) {
    window.requestAnimationFrame(() => {
      if (pageState.scrollTarget === "publishers-form-section") {
        scrollToElement(formSection);
      }

      if (pageState.scrollTarget === "publishers-detail-section") {
        scrollToElement(detailSection, { extraOffset: 12 });
      }

      pageState.scrollTarget = "";
    });
  }

  searchInput?.addEventListener("input", (event) => {
    setPageState({
      query: event.target.value
    });
  });

  root.querySelectorAll('[data-action="publishers-select"]').forEach((row) => {
    row.addEventListener("click", () => {
      setPageState({
        selectedId: Number(row.dataset.id),
        message: "",
        scrollTarget: "publishers-detail-section"
      });
    });

    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        row.click();
      }
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
          message: formData.get("id") ? "Cập nhật nhà xuất bản thành công." : "Tạo nhà xuất bản thành công.",
          scrollTarget: "publishers-form-section"
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Không thể lưu nhà xuất bản.",
        scrollTarget: "publishers-form-section"
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
              message: "Xóa nhà xuất bản thành công.",
              scrollTarget: "publishers-detail-section"
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa nhà xuất bản.",
            scrollTarget: "publishers-detail-section"
          });
        }
      }
    });
  });
}
