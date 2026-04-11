import { escapeHtml, formatDate, formatNumber } from "../../../shared/utils/format.js";

export const mediaMeta = {
  title: "Media",
  description: "Live backend uploads for cover images, PDF and ebook files linked to books."
};

const IMAGE_TYPES = new Set(["JPG", "JPEG", "PNG", "WEBP"]);

function renderAssetPreview(asset) {
  if (!asset?.fileUrl) {
    return '<div class="empty-state">No preview available for this asset.</div>';
  }

  if (IMAGE_TYPES.has(asset.assetType)) {
    return `
      <div class="media-preview-frame">
        <img src="${escapeHtml(asset.fileUrl)}" alt="${escapeHtml(asset.fileName)}" class="media-preview-image">
      </div>
    `;
  }

  if (asset.assetType === "PDF") {
    return `
      <div class="media-preview-frame">
        <iframe src="${escapeHtml(asset.fileUrl)}" title="${escapeHtml(asset.fileName)}" class="media-preview-embed"></iframe>
      </div>
    `;
  }

  return '<div class="empty-state">Preview is not available for this file type. Use the open link below.</div>';
}

function getDefaultFormValue() {
  return {
    bookId: "",
    primary: false
  };
}

export function createMediaPageState() {
  return {
    selectedId: null,
    filterBookId: "",
    form: getDefaultFormValue(),
    message: ""
  };
}

export function renderMediaPage(store, pageState) {
  const allAssets = store.getMedia();
  const books = store.getBookOptions();
  const assets = allAssets.filter((asset) => !pageState.filterBookId || String(asset.bookId) === String(pageState.filterBookId));
  const selectedAsset = assets.find((asset) => asset.id === pageState.selectedId) || assets[0] || null;
  const primaryCount = allAssets.filter((asset) => asset.primary).length;
  const pdfCount = allAssets.filter((asset) => asset.assetType === "PDF").length;
  const imageCount = allAssets.filter((asset) => ["JPG", "JPEG", "PNG", "WEBP"].includes(asset.assetType)).length;

  return `
    <div class="section-head">
      <div>
        <p class="eyebrow">Media library</p>
        <h2>Upload and manage live catalog files from the backend</h2>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="media-reset">Clear form</button>
      </div>
    </div>

    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">All assets</p><h3 class="card-title">${formatNumber(allAssets.length)}</h3><p class="subtle">Files stored in the backend media table.</p></div>
      <div class="chip-card"><p class="eyebrow">Primary files</p><h3 class="card-title">${formatNumber(primaryCount)}</h3><p class="subtle">Assets flagged as primary for a book.</p></div>
      <div class="chip-card"><p class="eyebrow">Images / PDFs</p><h3 class="card-title">${formatNumber(imageCount)} / ${formatNumber(pdfCount)}</h3><p class="subtle">Quick visibility into media types.</p></div>
    </div>

    <div class="grid-2 workspace-grid">
      <div class="stack">
        <div class="table-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Asset list</p>
              <h3 class="card-title">${formatNumber(assets.length)} files</h3>
            </div>
          </div>
          <div class="field">
            <label for="media-filter-book">Filter by book</label>
            <select id="media-filter-book">
              <option value="">All books</option>
              ${books
                .map(
                  (book) => `<option value="${book.id}" ${String(pageState.filterBookId) === String(book.id) ? "selected" : ""}>${escapeHtml(book.title)}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="table-wrap table-spacing">
            <table class="table">
              <thead><tr><th>File</th><th>Type</th><th>Book</th><th>Primary</th><th>Actions</th></tr></thead>
              <tbody>
                ${assets.length
                  ? assets
                      .map(
                        (asset) => `
                          <tr class="${selectedAsset?.id === asset.id ? "row-selected" : ""}">
                            <td>
                              <strong>${escapeHtml(asset.fileName)}</strong>
                              <p class="mini">${formatDate(asset.createdAt)}</p>
                            </td>
                            <td>${escapeHtml(asset.assetType)}</td>
                            <td>${escapeHtml(asset.bookTitle || "-")}</td>
                            <td><span class="status info">${asset.primary ? "Primary" : "No"}</span></td>
                            <td>
                              <div class="actions">
                                <button class="action-link" type="button" data-action="media-select" data-id="${asset.id}">View</button>
                                <button class="action-link danger" type="button" data-action="media-delete" data-id="${asset.id}">Delete</button>
                              </div>
                            </td>
                          </tr>
                        `
                      )
                      .join("")
                  : '<tr><td colspan="5" class="table-empty">No media asset matches the current filter.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Upload form</p>
              <h3 class="card-title">Upload new file</h3>
            </div>
          </div>
          <form id="media-form" class="form-grid">
            <div class="field span-2">
              <label>Book</label>
              <select name="bookId" required>
                <option value="">Select a book</option>
                ${books
                  .map(
                    (book) => `<option value="${book.id}" ${String(pageState.form.bookId) === String(book.id) ? "selected" : ""}>${escapeHtml(book.title)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="field span-2">
              <label>File</label>
              <input name="file" type="file" required>
            </div>
            <label class="checkbox-field span-2">
              <input type="checkbox" name="primary" ${pageState.form.primary ? "checked" : ""}>
              Mark as primary asset for the selected book
            </label>
            <p class="form-message span-2">${escapeHtml(pageState.message || "")}</p>
            <div class="actions span-2">
              <button class="btn primary" type="submit">Upload file</button>
            </div>
          </form>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Asset detail</p>
            <h3 class="card-title">${selectedAsset ? escapeHtml(selectedAsset.fileName) : "No asset selected"}</h3>
          </div>
        </div>
        ${selectedAsset
          ? `
            <div class="resource-preview">
              <span class="pill">${escapeHtml(selectedAsset.assetType)}</span>
              <h3>${escapeHtml(selectedAsset.fileName)}</h3>
              <p class="subtle">${escapeHtml(selectedAsset.bookTitle || "No linked book")}</p>
            </div>
            <div class="detail-grid detail-stack">
              <div class="detail-item"><p class="eyebrow">Book</p><strong>${escapeHtml(selectedAsset.bookTitle || "-")}</strong></div>
              <div class="detail-item"><p class="eyebrow">Primary</p><strong>${selectedAsset.primary ? "Yes" : "No"}</strong></div>
              <div class="detail-item"><p class="eyebrow">Type</p><strong>${escapeHtml(selectedAsset.assetType)}</strong></div>
              <div class="detail-item"><p class="eyebrow">Created</p><strong>${formatDate(selectedAsset.createdAt)}</strong></div>
            </div>
            <div class="stack detail-stack">
              ${renderAssetPreview(selectedAsset)}
              <div class="chip-card">
                <h4>File access</h4>
                <p class="subtle"><a href="${escapeHtml(selectedAsset.fileUrl)}" target="_blank" rel="noreferrer">Open backend file</a></p>
              </div>
            </div>
          `
          : '<p class="subtle section-copy">Select an uploaded asset to inspect its metadata and open the file.</p>'}
      </div>
    </div>
  `;
}

export function bindMediaPage({ root, store, setPageState }) {
  const filterBook = root.querySelector("#media-filter-book");
  const form = root.querySelector("#media-form");

  filterBook?.addEventListener("change", (event) => {
    setPageState({
      filterBookId: event.target.value
    });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[name="file"]');
    const file = fileInput?.files?.[0];

    if (!file) {
      setPageState({
        message: "Please choose a file to upload."
      });
      return;
    }

    try {
      const savedAsset = await store.uploadMedia({
        bookId: Number(formData.get("bookId") || 0),
        file,
        primary: formData.get("primary") === "on"
      });

      setPageState(
        {
          selectedId: savedAsset?.id || null,
          form: getDefaultFormValue(),
          message: "File uploaded successfully."
        },
        { reload: true }
      );
    } catch (error) {
      setPageState({
        message: error.message || "Unable to upload file."
      });
    }
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);

      if (action === "media-reset") {
        setPageState({
          form: getDefaultFormValue(),
          message: ""
        });
      }

      if (action === "media-select") {
        setPageState({
          selectedId: id,
          message: ""
        });
      }

      if (action === "media-delete") {
        const shouldDelete = window.confirm(`Delete media asset #${id}?`);

        if (!shouldDelete) {
          return;
        }

        try {
          await store.removeMedia(id);
          setPageState(
            {
              selectedId: null,
              message: "Media asset deleted successfully."
            },
            { reload: true }
          );
        } catch (error) {
          setPageState({
            message: error.message || "Unable to delete media asset."
          });
        }
      }
    });
  });
}
