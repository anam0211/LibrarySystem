export const usersMeta = {
  title: "Auth & Users",
  description: "Frontend scaffold for JWT login, RBAC, reader profiles and account management."
};

const sampleUsers = [
  { name: "Nguyen Lan", role: "Reader", status: "Active", loans: 4 },
  { name: "Tran Binh", role: "Librarian", status: "Active", loans: 0 },
  { name: "Pham Huong", role: "Reader", status: "Locked", loans: 2 }
];

export function renderUsersPage() {
  return `
    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Auth</p><h3 class="card-title">JWT + refresh token</h3><p class="subtle">UI sections ready for real auth endpoints.</p></div>
      <div class="chip-card"><p class="eyebrow">RBAC</p><h3 class="card-title">Admin / Librarian / Reader</h3><p class="subtle">Permission-based navigation is already grouped in the shell.</p></div>
      <div class="chip-card"><p class="eyebrow">Profiles</p><h3 class="card-title">Reader profile flow</h3><p class="subtle">Prepared for account status and borrowing history.</p></div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Ready-to-connect screens</p>
            <h3 class="card-title">Auth and user management scope</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Login and register</strong><p class="subtle">Form layout is separated from the shell, so swapping mock login with JWT is straightforward.</p></div>
          <div class="list-item"><strong>Role assignment</strong><p class="subtle">Keep role options and permission badges close to the account table for admin workflows.</p></div>
          <div class="list-item"><strong>Account status</strong><p class="subtle">Reserve backend fields for active, locked and suspended states.</p></div>
          <div class="list-item"><strong>Reader history</strong><p class="subtle">This page expects a related borrowing summary panel once transaction APIs exist.</p></div>
        </div>
      </div>

      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Sample list</p>
            <h3 class="card-title">Target management table</h3>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Open loans</th></tr></thead>
            <tbody>
              ${sampleUsers
                .map(
                  (user) => `
                    <tr>
                      <td><strong>${user.name}</strong></td>
                      <td>${user.role}</td>
                      <td><span class="status info">${user.status}</span></td>
                      <td>${user.loans}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
