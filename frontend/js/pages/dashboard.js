/**
 * @param {string} period -'week' hoặc 'month'
 */
async function loadDashboardStats(period = 'month') {
    // 1. DỮ LIỆU GIẢ LẬP (MOCK DATA)
    // Tương lai: const response = await fetchAPI(`/reports/dashboard?period=${period}`);
    //            const data = await response.json();
    const mockData = {
        'week': {
            views: '12.450', saved: '2.105', topics: '45', resources: '1.024',
            trendHeights: [20, 35, 40, 55, 45, 60, 85, 40, 35, 65, 70, 95]
        },
        'month': {
            views: '48.260', saved: '9.862', topics: '186', resources: '4.326',
            trendHeights: [38, 52, 47, 64, 71, 58, 79, 83, 76, 92, 88, 96]
        }
    };

    const currentData = mockData[period];

    const kpiValues = document.querySelectorAll('.stat-value');
    if (kpiValues.length >= 4) {
        kpiValues[0].innerText = currentData.views;
        kpiValues[1].innerText = currentData.saved;
        kpiValues[2].innerText = currentData.topics;
        kpiValues[3].innerText = currentData.resources;
    }

    const barSpans = document.querySelectorAll('.bar-col span');
    currentData.trendHeights.forEach((height, index) => {
        if (barSpans[index]) {
            barSpans[index].style.transition = 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            barSpans[index].style.height = `${height}%`;
        }
    });
}

function setupPeriodToggle() {
    const buttons = document.querySelectorAll('.section-head .actions button');
    if (buttons.length < 2) return;

    const btnWeek = buttons[0]; 
    const btnMonth = buttons[1]; 

    btnWeek.addEventListener('click', () => {
        btnWeek.className = 'btn primary';
        btnMonth.className = 'btn secondary';
        loadDashboardStats('week');
    });

    btnMonth.addEventListener('click', () => {
        btnMonth.className = 'btn primary';
        btnWeek.className = 'btn secondary';
        loadDashboardStats('month');
    });
}


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setupPeriodToggle();
        loadDashboardStats('month'); 
    }, 100); 
});