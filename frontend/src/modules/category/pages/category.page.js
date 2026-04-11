import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const categoriesMeta = {
  title: "Danh mục",
  description: "Quản lý danh mục cha, danh mục con và dữ liệu phân loại thật từ backend."
};

function getDefaultFormValue() {
  return {
    id: "",
    name: "",
    parentId: ""
  };
}

export function createCategoriesPageState() {
  return {
    selectedId: null,
    form: getDefaultFormValue(),
    message: "",
    scrollTarget: ""
  };
}

export function renderCategoriesPage(store, pageState) {
  const categories = store.getCategories();
  const selectedCategory = categories.find((category) => category.id === pageState.selectedId) || categories[0] || null;
  const rootCategories = categories.filter((category) => !category.parentId);
  const relatedBooks = selectedCategory
    ? store.getBookOptions().filter((book) => (book.categories || []).some((category) => category.id === selectedCategory.id)).slice(0, 5)
    : [];

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Cây danh mục</p>
        <h2>Quản lý nhóm cha và nhóm con của catalog sách</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="categories-reset">Làm mới form</button>
        <button class="btn primary" type="button" data-action="categories-new">Tạo danh mục</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Tổng danh mục</p><h3 class="card-title">${formatNumber(categories.length)}</h3><p class="subtle">Số nhóm đang có trong taxonomy thật.</p></div>
      <div class="chip-card"><p class="eyebrow">Danh mục cha</p><h3 class="card-title">${formatNumber(rootCategories.length)}</h3><p class="subtle">Dùng cho điều hướng cấp cao của catalog.</p></div>
      <div class="chip-card"><p class="eyebrow">Danh mục con</p><h3 class="card-title">${formatNumber(categories.length - rootCategories.length)}</h3><p class="subtle">Dùng cho lọc, drill-down và phân nhóm chi tiết.</p></div>
    </div>

    <div class="grid-2 workspace-grid">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Sơ đồ danh mục</p>
            <h3 class="card-title">Chọn một danh mục để xem chi tiết</h3>
          </div>
        </div>
        <div class="catalog-grid">
          ${categories
            .map(
              (category) => `
                <div class="catalog-card ${selectedCategory?.id === category.id ? "is-selected" : ""}" data-action="categories-select" data-id="${category.id}">
                  <p class="eyebrow">${category.parentId ? `Nhóm con của ${escapeHtml(category.parentName || "-")}` : "Danh mục gốc"}</p>
                  <h4>${escapeHtml(category.name)}</h4>
                  <p class="subtle">${formatNumber(category.bookCount)} đầu sách / ${formatNumber(category.childCount)} nhóm con</p>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi tiết danh mục</p>
            <h3 class="card-title">${selectedCategory ? escapeHtml(selectedCategory.name) : "Chưa chọn danh mục"}</h3>
          </div>
        </div>
        ${selectedCategory
          ? `
            <div class="detail-grid">
              <div class="detail-item"><p class="eyebrow">Danh mục cha</p><strong>${escapeHtml(selectedCategory.parentName || "Không có")}</strong></div>
              <div class="detail-item"><p class="eyebrow">Ngày tạo</p><strong>${formatDate(selectedCategory.createdAt)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Nhóm con</p><strong>${formatNumber(selectedCategory.childCount)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Sách liên kết</p><strong>${formatNumber(selectedCategory.bookCount)}</strong></div>
            </div>
            <div class="stack detail-stack">
              <div class="chip-card">
                <h4>Gợi ý sử dụng</h4>
                <p class="subtle">${selectedCategory.parentId ? "Phù hợp cho bộ lọc chi tiết, breadcrumb hoặc danh sách drill-down." : "Phù hợp làm nhóm điều hướng cấp cao trên trang chủ và các landing section."}</p>
              </div>
              <div class="chip-card">
                <h4>Sách liên quan</h4>
                <p class="subtle">${escapeHtml(relatedBooks.map((book) => book.title).join(", ") || "Chưa có sách liên kết.")}</p>
              </div>
              <div class="actions">
                <button class="action-link" type="button" data-action="categories-edit" data-id="${selectedCategory.id}">Sửa</button>
                <button class="action-link danger" type="button" data-action="categories-delete" data-id="${selectedCategory.id}">Xóa</button>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Chọn một danh mục để xem thông tin phân loại chi tiết.</p>'}
      </div>
    </div>

    <div id="categories-form-section" class="table-card full-width-section">
      <div class="section-head">
        <div>
          <p class="eyebrow">Form danh mục</p>
          <h3 class="card-title">${pageState.form.id ? "Cập nhật danh mục" : "Tạo danh mục mới"}</h3>
        </div>
      </div>
      <form id="categories-form" class="form-grid form-grid-full">
        <input type="hidden" name="id" value="${pageState.form.id}">
        <div class="field span-2">
          <label>Tên danh mục</label>
          <input name="name" type="text" value="${escapeHtml(pageState.form.name)}" placeholder="Ví dụ: Khoa học máy tính" required>
        </div>
        <div class="field span-2">
          <label>Danh mục cha</label>
          <select name="parentId">
            <option value="">Không có danh mục cha</option>
            ${rootCategories
              .filter((category) => String(category.id) !== String(pageState.form.id))
              .map(
                (category) => `<option value="${category.id}" ${String(pageState.form.parentId) === String(category.id) ? "selected" : ""}>${escapeHtml(category.name)}</option>`
              )
              .join("")}
          </select>
        </div>
        <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
        <div class="actions span-2">
          <button class="btn primary" type="submit">${pageState.form.id ? "Lưu danh mục" : "Tạo danh mục"}</button>
          <button class="btn secondary" type="button" data-action="categories-cancel">Xóa nội dung</button>
        </div>
      </form>
    </div>
  `;
}

export function bindCategoriesPage({ root, store, pageState, setPageState }) {
  const form = root.querySelector("#categories-form");
  const formSection = root.querySelector("#categories-form-section");

  if (pageState?.scrollTarget === "categories-form-section" && formSection) {
    window.requestAnimationFrame(() => {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      pageState.scrollTarget = "";
    });
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    try {
      const savedCategory = await store.saveCategory({
        id: String(formData.get("id") || ""),
        name: String(formData.get("name") || ""),
        parentId: String(formData.get("parentId") || "")
      });

      setPageState(
        {
          selectedId: savedCategory?.id || null,
          form: getDefaultFormValue(),
          message: formData.get("id") ? "Cập nhật danh mục thành công." : "Tạo danh mục thành công."
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Không thể lưu danh mục."
      });
    }
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === "categories-reset" || action === "categories-new" || action === "categories-cancel") {
        setPageState({
          form: getDefaultFormValue(),
          message: "",
          scrollTarget: "categories-form-section"
        });
      }

      if (action === "categories-select") {
        setPageState({
          selectedId: id,
          message: ""
        });
      }

      if (action === "categories-edit") {
        const category = store.getCategoryById(id);

        if (!category) {
          return;
        }

        setPageState({
          selectedId: id,
          form: {
            id: String(category.id),
            name: category.name,
            parentId: category.parentId ? String(category.parentId) : ""
          },
          message: "",
          scrollTarget: "categories-form-section"
        });
      }

      if (action === "categories-delete") {
        const shouldDelete = window.confirm(`Xóa danh mục #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeCategory(id);
          setPageState(
            {
              selectedId: null,
              form: getDefaultFormValue(),
              message: "Xóa danh mục thành công."
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Không thể xóa danh mục."
          });
        }
      }
    });
  });
}
