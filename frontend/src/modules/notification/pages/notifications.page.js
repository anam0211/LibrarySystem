export const notificationsMeta = {
  title: "Notifications",
  description: "Frontend scaffold for due-date reminders, overdue notices and delivery logs."
};

const sampleJobs = [
  { job: "Due tomorrow reminder", schedule: "Daily 08:00", target: "Borrowing due in 24h" },
  { job: "Overdue alert", schedule: "Daily 09:00", target: "Borrowing overdue" },
  { job: "Failed delivery retry", schedule: "Every 30 min", target: "Mail queue retry" }
];

export function renderNotificationsPage() {
  return `
    <div class="grid-3">
      <div class="chip-card"><p class="eyebrow">Scheduler</p><h3 class="card-title">Cron and queue ready</h3><p class="subtle">Use backend jobs to drive reminder timing.</p></div>
      <div class="chip-card"><p class="eyebrow">Templates</p><h3 class="card-title">Email notice variants</h3><p class="subtle">Prepare separate copy for due soon, overdue and account issues.</p></div>
      <div class="chip-card"><p class="eyebrow">Audit</p><h3 class="card-title">Delivery log panel</h3><p class="subtle">Useful for demoing reliability and traceability.</p></div>
    </div>

    <div class="grid-2">
      <div class="table-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Scheduled jobs</p>
            <h3 class="card-title">Reminder engine outline</h3>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>Job</th><th>Schedule</th><th>Target</th></tr></thead>
            <tbody>
              ${sampleJobs
                .map(
                  (job) => `
                    <tr>
                      <td><strong>${job.job}</strong></td>
                      <td>${job.schedule}</td>
                      <td>${job.target}</td>
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
            <p class="eyebrow">Next backend hooks</p>
            <h3 class="card-title">Expected API and service pieces</h3>
          </div>
        </div>
        <div class="stack">
          <div class="list-item"><strong>Mail trigger endpoint</strong><p class="subtle">Optional for manual resend and admin troubleshooting.</p></div>
          <div class="list-item"><strong>Notification history</strong><p class="subtle">Expose recipient, channel, template and delivery result.</p></div>
          <div class="list-item"><strong>Scheduler status</strong><p class="subtle">Useful for dashboard health visibility during demo.</p></div>
        </div>
      </div>
    </div>
  `;
}
