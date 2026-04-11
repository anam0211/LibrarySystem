export const operationsMeta = {
  title: "Operations Report",
  description: "Frontend scaffold for borrowing metrics, overdue counts and top readers."
};

export function renderOperationsPage() {
  return `
    <div class="stats-grid">
      <div class="stat-card"><p class="eyebrow">Top readers</p><div class="stat-value">3</div><p class="mini">Ready for API-driven ranking cards.</p></div>
      <div class="stat-card"><p class="eyebrow">Borrowing trend</p><div class="stat-value">12w</div><p class="mini">Reserve this block for timeline analytics.</p></div>
      <div class="stat-card"><p class="eyebrow">Overdue slips</p><div class="stat-value">0</div><p class="mini">Connect to overdue transaction count.</p></div>
      <div class="stat-card"><p class="eyebrow">Returned today</p><div class="stat-value">0</div><p class="mini">Good candidate for a daily KPI card.</p></div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Operational dashboard plan</p>
            <h3 class="card-title">Widgets to wire next</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Most active readers</strong><p class="subtle">Rank by number of borrow transactions in a chosen date range.</p></div>
          <div class="list-item"><strong>Borrowing by period</strong><p class="subtle">Line or bar chart for daily, weekly or monthly borrowing volume.</p></div>
          <div class="list-item"><strong>Overdue monitoring</strong><p class="subtle">Highlight open overdue slips and their severity.</p></div>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Demo value</p>
            <h3 class="card-title">Why this page matters</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Fast presentation</strong><p class="subtle">Operations KPIs are easy to explain in the final demo and report.</p></div>
          <div class="list-item"><strong>Role-driven UX</strong><p class="subtle">Librarians can land here for daily monitoring after authentication is connected.</p></div>
          <div class="list-item"><strong>Future export</strong><p class="subtle">The layout leaves room for Excel or PDF export actions later.</p></div>
        </div>
      </div>
    </div>
  `;
}
