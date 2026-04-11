export const circulationMeta = {
  title: "Circulation",
  description: "Frontend scaffold for borrow, return, overdue and lost-book workflows."
};

const sampleTransactions = [
  { reader: "Le Minh", book: "Clean Architecture", status: "Borrowing", dueDate: "2026-04-10" },
  { reader: "Hoang Mai", book: "Spring in Action", status: "Overdue", dueDate: "2026-03-30" },
  { reader: "Tran Thu", book: "DDD Distilled", status: "Returned", dueDate: "2026-04-01" }
];

export function renderCirculationPage() {
  return `
    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Borrow rules</p><h3 class="card-title">Stock, account and penalty checks</h3><p class="subtle">Backend validation should feed these warnings and action states.</p></div>
      <div class="chip-card"><p class="eyebrow">Transaction states</p><h3 class="card-title">Borrowing, Returned, Overdue, Lost</h3><p class="subtle">Prepared for status badges and timeline updates.</p></div>
      <div class="chip-card"><p class="eyebrow">Data safety</p><h3 class="card-title">Transactional consistency</h3><p class="subtle">Frontend assumes borrow/return endpoints are transactional.</p></div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Borrowing queue</p>
            <h3 class="card-title">Target operator screen</h3>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Reader</th><th>Book</th><th>Status</th><th>Due date</th></tr></thead>
            <tbody>
              ${sampleTransactions
                .map(
                  (item) => `
                    <tr>
                      <td><strong>${item.reader}</strong></td>
                      <td>${item.book}</td>
                      <td><span class="status info">${item.status}</span></td>
                      <td>${item.dueDate}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Backend checklist</p>
            <h3 class="card-title">What this page expects next</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Create loan slip</strong><p class="subtle">Endpoint should atomically reserve stock and create a borrowing record.</p></div>
          <div class="list-item"><strong>Return processing</strong><p class="subtle">Need status transition plus stock recovery in one backend transaction.</p></div>
          <div class="list-item"><strong>Concurrency guard</strong><p class="subtle">Last-copy borrowing should be protected at the service/database layer.</p></div>
        </div>
      </div>
    </div>
  `;
}
