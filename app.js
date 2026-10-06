// ===== Analytics =====
    let analyticsCharts = {};

    function renderAnalytics() {
        if (!state.stores || state.stores.length === 0) return;

        // KPI Variables
        let totalStores = state.stores.length;
        let activeStores = 0;
        let totalCOD = 0;
        let totalDue = 0;
        let totalUnrec = 0;
        let unrecCount = 0;
        let totalCap = 0;

        // Chart Data Variables
        let topDues = [];
        let statusCounts = {};
        let capByDay = { 'MONDAY': {sw1:0, sw2:0}, 'TUESDAY': {sw1:0, sw2:0}, 'WEDNESDAY': {sw1:0, sw2:0}, 'THURSDAY': {sw1:0, sw2:0}, 'FRIDAY': {sw1:0, sw2:0}, 'SATURDAY': {sw1:0, sw2:0}, 'SUNDAY': {sw1:0, sw2:0} };
        let cityCounts = {};
        let activationTrend = {};
        let coverageCounts = { '475m': 0, 'Other': 0 };

        let criticalStores = [];

        // Single pass over stores
        state.stores.forEach(s => {
            const cod = parseFloat(s.totalCod || 0);
            const due = parseFloat(s.dueAmount || 0);
            const unrecStr = String(s.unreconciledPercent || '0').replace('%','');
            const unrec = parseFloat(unrecStr || 0);

            totalCOD += cod;
            totalDue += due;

            if (unrec > 0) {
                totalUnrec += unrec;
                unrecCount++;
            }

            // Status
            if (s.status === 'Store Active') activeStores++;
            statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;

            // City
            const city = s.city || 'غير معروف';
            cityCounts[city] = (cityCounts[city] || 0) + 1;

            // Coverage
            if (s.coverage === '475' || s.coverage === '475m') coverageCounts['475m']++;
            else coverageCounts['Other']++;

            // Activation Trend
            if (s.activationDate && s.activationDate !== 'NA') {
                const date = new Date(s.activationDate);
                if (!isNaN(date)) {
                    const monthYear = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
                    activationTrend[monthYear] = (activationTrend[monthYear] || 0) + 1;
                }
            }

            // Top Dues
            if (due > 0 || cod > 0) {
                topDues.push({ name: s.storeName, due: due, cod: cod });
            }

            // Critical Stores
            if (unrec > 40 || due > 4000) {
                criticalStores.push({ name: s.storeName, unrec: unrec, cod: cod, due: due, city: city });
            }

            // Capacity
            if (s.schedule && Array.isArray(s.schedule)) {
                s.schedule.forEach(sch => {
                    if (sch.swStatus === 'ENABLED') {
                        const cap = parseInt(sch.maxCapacity || 0);
                        totalCap += cap;
                        if (capByDay[sch.dayOfWeek]) {
                            if (sch.supplyWindow === 'SW1') capByDay[sch.dayOfWeek].sw1 += cap;
                            else if (sch.supplyWindow === 'SW2') capByDay[sch.dayOfWeek].sw2 += cap;
                        }
                    }
                });
            }
        });

        const avgUnrec = unrecCount > 0 ? (totalUnrec / unrecCount).toFixed(1) : 0;

        // 1. Update KPIs
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setVal('kpi-total-stores', totalStores);
        setVal('kpi-active-stores', activeStores);
        setVal('kpi-total-cod', totalCOD.toLocaleString() + ' EGP');
        setVal('kpi-total-due', totalDue.toLocaleString() + ' EGP');
        setVal('kpi-avg-unrec', avgUnrec + '%');
        setVal('kpi-total-cap', totalCap.toLocaleString());

        // 2. Risk Table
        criticalStores.sort((a,b) => b.unrec - a.unrec);
        const tbody = document.getElementById('risk-table-body');
        if (tbody) {
            tbody.innerHTML = criticalStores.map(c => `
                <tr>
                    <td style="font-weight: 600;">${c.name}</td>
                    <td style="text-align: center; color: var(--danger); font-weight: 700;">${c.unrec}%</td>
                    <td>${c.cod.toLocaleString()} EGP</td>
                    <td style="font-weight: 700;">${c.due.toLocaleString()} EGP</td>
                    <td>${c.city}</td>
                </tr>
            `).join('');
            if (criticalStores.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">لا توجد محلات حرجة</td></tr>';
        }

        if (typeof Chart === 'undefined') return;

        // Chart defaults
        Chart.defaults.color = '#8892b0';
        Chart.defaults.font.family = 'Tajawal, Inter, sans-serif';

        const destroyChart = (key) => { if (analyticsCharts[key]) { analyticsCharts[key].destroy(); } };

        // 3. Top Financial
        destroyChart('finTop');
        topDues.sort((a,b) => b.due - a.due);
        const top10 = topDues.slice(0, 10);
        const ctxFin = document.getElementById('chart-financial-top');
        if (ctxFin) {
            analyticsCharts.finTop = new Chart(ctxFin, {
                type: 'bar',
                data: {
                    labels: top10.map(d => d.name),
                    datasets: [
                        { label: 'المديونية', data: top10.map(d => d.due), backgroundColor: '#ff5252', borderRadius: 4 },
                        { label: 'الكاش', data: top10.map(d => d.cod), backgroundColor: '#ff9900', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
            });
        }

        // 4. Status Dist
        destroyChart('status');
        const ctxStatus = document.getElementById('chart-status-dist');
        if (ctxStatus) {
            analyticsCharts.status = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusCounts),
                    datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#00e676', '#ff5252', '#9c27b0', '#ff9900', '#40c4ff'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'right' } } }
            });
        }

        // 5. Capacity Days
        destroyChart('capDays');
        const ctxCap = document.getElementById('chart-capacity-days');
        const daysLabel = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
        const keys = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        if (ctxCap) {
            analyticsCharts.capDays = new Chart(ctxCap, {
                type: 'line',
                data: {
                    labels: daysLabel,
                    datasets: [
                        { label: 'SW1', data: keys.map(k => capByDay[k].sw1), borderColor: '#00e676', backgroundColor: 'rgba(0, 230, 118, 0.1)', fill: true, tension: 0.4 },
                        { label: 'SW2', data: keys.map(k => capByDay[k].sw2), borderColor: '#40c4ff', backgroundColor: 'rgba(64, 196, 255, 0.1)', fill: true, tension: 0.4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
            });
        }

        // 6. Cities
        destroyChart('cities');
        const sortedCities = Object.entries(cityCounts).sort((a,b) => b[1] - a[1]).slice(0, 8);
        const ctxCity = document.getElementById('chart-cities');
        if (ctxCity) {
            analyticsCharts.cities = new Chart(ctxCity, {
                type: 'bar',
                data: {
                    labels: sortedCities.map(c => c[0]),
                    datasets: [{ label: 'محلات', data: sortedCities.map(c => c[1]), backgroundColor: '#ff5252', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
            });
        }

        // 7. Trend
        destroyChart('trend');
        const sortedMonths = Object.keys(activationTrend).sort();
        const ctxTrend = document.getElementById('chart-activation-trend');
        if (ctxTrend) {
            analyticsCharts.trend = new Chart(ctxTrend, {
                type: 'line',
                data: {
                    labels: sortedMonths,
                    datasets: [{ label: 'مضاف حديثاً', data: sortedMonths.map(m => activationTrend[m]), borderColor: '#ff9900', borderDash: [5, 5], pointBackgroundColor: '#ff9900', fill: false }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // 8. Coverage
        destroyChart('coverage');
        const ctxCov = document.getElementById('chart-coverage');
        if (ctxCov) {
            analyticsCharts.coverage = new Chart(ctxCov, {
                type: 'pie',
                data: {
                    labels: Object.keys(coverageCounts),
                    datasets: [{ data: Object.values(coverageCounts), backgroundColor: ['#00e676', '#40c4ff'], borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });
        }
    }

    // ===== Schedule Page =====
    function renderSchedule() {
        const storeFilter = document.getElementById('schedule-store-filter').value;
        const dayFilter = document.getElementById('schedule-day-filter').value;
        const container = document.getElementById('schedule-grid');

        let stores = state.stores;
        if (storeFilter !== 'all') {
            stores = stores.filter(s => s.storeId === storeFilter);
        }

        const days = dayFilter === 'all' ? dayOrder : [dayFilter];

        container.innerHTML = stores.slice(0, 20).map(store => `
            <div class="schedule-store-card">
                <div class="schedule-store-header">
                    <h4>${store.storeName}</h4>
                    <span class="status-badge ${store.status === 'Store Active' ? 'active' : 'inactive'}">
                        ${store.status === 'Store Active' ? 'نشط' : 'غير نشط'}
                    </span>
                </div>
                <div class="schedule-days-grid">
                    ${days.map(day => {
                        const sw1 = store.schedule.find(s => s.dayOfWeek === day && s.supplyWindow === 'SW1');
                        const sw2 = store.schedule.find(s => s.dayOfWeek === day && s.supplyWindow === 'SW2');
                        const isOperating = store.operatingDays.split(' ')[dayOrder.indexOf(day)] !== '_';
                        return `
                            <div class="schedule-day-cell ${isOperating ? 'operating' : 'off'}">
                                <span class="schedule-day-name">${dayTranslations[day]}</span>
                                <div class="schedule-sw-info">
                                    <div class="sw-item ${sw1 && sw1.swStatus === 'ENABLED' ? 'enabled' : 'disabled'}">
                                        SW1: ${sw1 ? sw1.maxCapacity : '-'}
                                    </div>
                                    <div class="sw-item ${sw2 && sw2.swStatus === 'ENABLED' ? 'enabled' : 'disabled'}">
                                        SW2: ${sw2 ? sw2.maxCapacity : '-'}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    // ===== Utilities =====
    function formatDate(dateStr) {
        if (!dateStr || dateStr === 'NA') return 'غير محدد';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    function formatOperatingDays(daysStr) {
        if (!daysStr) return '';
        const dayNames = ['اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'];
        const days = daysStr.split(' ');
        return days.map((d, i) => {
            if (d === '_') return `<span class="day-pill off">${dayNames[i]}</span>`;
            return `<span class="day-pill on">${dayNames[i]}</span>`;
        }).join('');
    }

    // ===== Modal Helpers =====
    function openModal(id) {
        const modal = document.getElementById(id);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Init detail map if location tab
        if (id === 'store-detail-modal') {
            const store = state.stores.find(s => s.storeId === state.editingStoreId);
            if (store && store.lat && store.lng && !isNaN(store.lat) && !isNaN(store.lng)) {
                setTimeout(() => {
                    if (state.maps.detail) {
                        state.maps.detail.remove();
                    }
                    const map = L.map('detail-map').setView([store.lat, store.lng], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19
                    }).addTo(map);
                    L.marker([store.lat, store.lng]).addTo(map);
                    
                    const radiusValue = parseInt(store.deliveryRadius) || 375;
                    L.circle([store.lat, store.lng], {
                        radius: radiusValue,
                        color: '#ff0000',
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        weight: 2
                    }).addTo(map);
                    
                    state.maps.detail = map;
                }, 300);
            }
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ===== Navigation =====
    function navigateTo(page) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // Init page-specific maps (delay 500ms to allow CSS transitions to finish)
        if (page === 'map') {
            setTimeout(() => initMainMap(), 500);
        }

        // Refresh dashboard map
        if (page === 'dashboard' && state.maps.dashboard) {
            setTimeout(() => state.maps.dashboard.invalidateSize(), 500);
        }
    }

    // ===== Export Data =====
    function exportData() {
        const headers = ['Store ID', 'Store Name', 'Status', 'City', 'State', 'Delivery Radius', 'Geocodes', 'Operating Days', 'Activation Date', 'Station Code', 'Email'];
        const rows = state.filteredStores.map(s => [
            s.storeId, s.storeName, s.status, s.city, s.state, s.deliveryRadius,
            `${s.lat},${s.lng}`, s.operatingDays, s.activationDate, s.stationCode, s.email || ''
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(val => `"${val}"`).join(',') + '\n';
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stores_export_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('تم التصدير', 'success', 'تم تصدير البيانات بنجاح');
    }

    // ===== DateTime =====
    function updateDateTime() {
        const now = new Date();
        document.getElementById('current-date').textContent = now.toLocaleDateString('ar-EG', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });
        document.getElementById('current-time').textContent = now.toLocaleTimeString('ar-EG');
    }

    // ===== Event Listeners =====
    function initEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(item.dataset.page);
                document.getElementById('sidebar').classList.remove('mobile-open');
            });
        });

        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
            document.getElementById('sidebar').classList.remove('mobile-open');
        });

        document.getElementById('mobile-menu-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });

        // Close mobile sidebar when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (sidebar && sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && (!mobileMenuBtn || !mobileMenuBtn.contains(e.target))) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });

        // Search
        document.getElementById('global-search').addEventListener('input', debounce(() => {
            state.currentPage = 1;
            renderStoresTable();
        }, 300));

        // Keyboard shortcut for search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search').focus();
            }
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(m => {
                    m.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        });

        // Filters
        ['filter-status', 'filter-city', 'filter-radius'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                state.currentPage = 1;
                renderStoresTable();
            });
        });

        // Sorting
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.sort;
                if (state.sortColumn === col) {
                    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortColumn = col;
                    state.sortDirection = 'asc';
                }
                
                // Update sort icons
                document.querySelectorAll('.sortable').forEach(t => {
                    t.classList.remove('sort-asc', 'sort-desc');
                });
                th.classList.add(`sort-${state.sortDirection}`);
                
                renderStoresTable();
            });
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                state.currentView = view;
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.getElementById('table-view').classList.toggle('hidden', view !== 'table');
                document.getElementById('grid-view').classList.toggle('hidden', view !== 'grid');
                
                renderStoresTable();
            });
        });

        // Pagination
        document.getElementById('prev-page').addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderStoresTable();
            }
        });

        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(state.filteredStores.length / state.perPage);
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderStoresTable();
            }
        });

        document.getElementById('per-page-select').addEventListener('change', (e) => {
            state.perPage = parseInt(e.target.value);
            state.currentPage = 1;
            renderStoresTable();
        });

        // Add store buttons
        document.getElementById('add-store-btn').addEventListener('click', addNewStore);
        document.getElementById('fab-add').addEventListener('click', addNewStore);

        // Modal close buttons
        document.getElementById('close-detail-modal').addEventListener('click', () => closeModal('store-detail-modal'));
        document.getElementById('close-detail-btn').addEventListener('click', () => closeModal('store-detail-modal'));
        document.getElementById('close-edit-modal').addEventListener('click', () => closeModal('edit-store-modal'));
        document.getElementById('cancel-edit-btn').addEventListener('click', () => closeModal('edit-store-modal'));
        document.getElementById('close-delete-modal').addEventListener('click', () => closeModal('delete-modal'));
        document.getElementById('cancel-delete-btn').addEventListener('click', () => closeModal('delete-modal'));

        // Save & Delete
        document.getElementById('save-store-btn').addEventListener('click', saveStore);
        document.getElementById('confirm-delete-btn').addEventListener('click', deleteStore);

        // Modal tabs
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tabName}`).classList.add('active');
                
                // Refresh map if location tab
                if (tabName === 'location' && state.maps.detail) {
                    setTimeout(() => state.maps.detail.invalidateSize(), 100);
                }
            });
        });

        // Map controls
        document.getElementById('show-all-markers').addEventListener('click', () => {
            state.mapFilter = 'all';
            addMainMapMarkers('all');
            const bounds = state.stores.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
            if (bounds.length) state.maps.main.fitBounds(bounds, { padding: [30, 30] });
        });

        document.getElementById('show-active-only').addEventListener('click', () => {
            state.mapFilter = 'active';
            addMainMapMarkers('active');
        });

        document.getElementById('show-inactive-only').addEventListener('click', () => {
            state.mapFilter = 'inactive';
            addMainMapMarkers('inactive');
        });

        document.getElementById('close-map-sidebar').addEventListener('click', () => {
            document.getElementById('map-sidebar').classList.remove('open');
        });

        // Export
        document.getElementById('export-btn').addEventListener('click', exportData);

        // Reset Data to Default
        const resetBtn = document.getElementById('reset-data-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (confirm('هل أنت متأكد من حذف كافة تعديلاتك وإعادة تعيين البيانات للمحلات الافتراضية؟')) {
                    localStorage.removeItem('ammar_stores');
                    try {
                        await fetch('/api/stores', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify([])
                        });
                    } catch (e) {
                        console.warn('Failed to clear cloud database on reset:', e);
                    }
                    location.reload();
                }
            });
        }

        // Import CSV
        const csvFileInput = document.getElementById('csv-file-input');
        const importBtn = document.getElementById('import-btn');
        if (importBtn && csvFileInput) {
            importBtn.addEventListener('click', () => {
                csvFileInput.click();
            });

            csvFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const csvText = event.target.result;
                        processLoadedData(csvText);
                    };
                    reader.readAsText(file, 'UTF-8');
                }
            });
        }

        // Schedule filters
        document.getElementById('schedule-store-filter').addEventListener('change', renderSchedule);
        document.getElementById('schedule-day-filter').addEventListener('change', renderSchedule);

        // Click outside modal to close
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }

    function debounce(fn, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ===== Public API =====
    window.app = {
        showStoreDetail,
        editStore,
        locateStore,
        confirmDelete,
        goToPage: (page) => {
            state.currentPage = page;
            renderStoresTable();
        }
    };

    // Make navigateTo global
    window.navigateTo = navigateTo;

    // ===== Authentication =====
    const VALID_PASSWORDS = ['ammar1', 'ammar2', 'ammar3', 'ammar4', 'ammar5', 'ammar10', 'ammar11', 'ammar12', 'ammar13', 'ammar14', 'ammar15'];

    function checkAuth() {
        const lockScreen = document.getElementById('login-lock-screen');
        if (lockScreen) {
            lockScreen.style.display = 'none';
        }
        loadData();
    }

    // ===== Losses Section =====
    let lossesStoreChartInstance = null;
    let lossesStatusChartInstance = null;

    function renderLosses() {
        if (!state.lossesData || state.lossesData.length === 0) return;
        
        const data = state.lossesData;
        const totalShipments = data.length;
        
        let totalMissingEGP = 0;
        let totalMissingUSD = 0;
        let deliveredCount = 0;
        let missingCount = 0;
        
        const storeStats = {};
        const statusStats = {
            'Missing/Lost': 0,
            'Delivered/Received': 0
        };

        data.forEach(item => {
            const status = item.status.toLowerCase();
            const isMissing = status.includes('missing') || status.includes('lost');
            
            if (isMissing) {
                totalMissingEGP += item.value;
                totalMissingUSD += item.usd;
                missingCount++;
                statusStats['Missing/Lost']++;
                
                // Track store missing value
                if (!storeStats[item.store]) storeStats[item.store] = 0;
                storeStats[item.store] += item.value;
            } else {
                deliveredCount++;
                statusStats['Delivered/Received']++;
            }
        });

        // Find worst store
        let worstStore = '-';
        let maxLostValue = 0;
        for (const [store, value] of Object.entries(storeStats)) {
            if (value > maxLostValue) {
                maxLostValue = value;
                worstStore = store;
            }
        }

        // Update KPIs
        document.getElementById('losses-total-count').textContent = totalShipments;
        document.getElementById('losses-total-egp').textContent = totalMissingEGP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById('losses-worst-store').textContent = worstStore;
        document.getElementById('losses-delivered-count').textContent = deliveredCount;

        // Render Data Table
        renderLossesTable(data);
        
        // Render Charts using HTML Canvas APIs if you are using manual canvas drawing,
        // or Chart.js if it's available. Assuming manual drawing based on analytics page:
        setTimeout(() => {
            drawLossesStoreChart(storeStats);
            drawLossesStatusChart(statusStats['Missing/Lost'], statusStats['Delivered/Received']);
        }, 100);
    }

    function renderLossesTable(dataList) {
        const tbody = document.getElementById('losses-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = dataList.map(item => {
            const status = item.status.toLowerCase();
            const isMissing = status.includes('missing') || status.includes('lost');
            const statusClass = isMissing ? 'inactive' : 'active';
            
            return `
                <tr>
                    <td style="font-family: var(--font-en); font-weight: 600;">${item.tracking_id}</td>
                    <td>${item.date}</td>
                    <td>${item.store}</td>
                    <td style="color: ${isMissing ? '#ff5252' : '#00e676'}; font-weight: bold;">${item.value.toFixed(2)}</td>
                    <td style="color: var(--text-muted);">${item.usd.toFixed(2)}</td>
                    <td>${item.method}</td>
                    <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                </tr>
            `;
        }).join('');
    }

    // Add search listener for Losses
    const lossesSearchInput = document.getElementById('losses-search');
    if (lossesSearchInput) {
        lossesSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredData = state.lossesData.filter(item => 
                item.tracking_id.toLowerCase().includes(query) ||
                item.store.toLowerCase().includes(query)
            );
            renderLossesTable(filteredData);
        });
    }

    // Chart logic
    function drawLossesStoreChart(storeStats) {
        const canvas = document.getElementById('losses-store-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Sort stores by loss value
        const entries = Object.entries(storeStats).sort((a, b) => b[1] - a[1]).slice(0, 8); // Top 8
        if (entries.length === 0) return;
        
        const labels = entries.map(e => e[0]);
        const values = entries.map(e => e[1]);
        const maxVal = Math.max(...values);
        
        const padding = 40;
        const width = canvas.width;
        const height = canvas.height;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const barWidth = Math.max((chartWidth / values.length) - 10, 20);
        
        // Draw bars
        values.forEach((val, i) => {
            const barH = (val / maxVal) * chartHeight;
            const x = padding + i * (chartWidth / values.length) + (chartWidth / values.length - barWidth) / 2;
            const y = height - padding - barH;
            
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, '#ff5252');
            grad.addColorStop(1, '#ff1744');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
            ctx.fill();
            
            // Value
            ctx.fillStyle = '#e8eaf6';
            ctx.font = 'bold 15px Tajawal';
            ctx.textAlign = 'center';
            ctx.fillText(val.toFixed(0), x + barWidth / 2, y - 8);
            
            // Label (truncate)
            ctx.save();
            ctx.translate(x + barWidth / 2, height - padding + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#8892b0';
            ctx.font = '13px Tajawal';
            let label = labels[i];
            if (label.length > 10) label = label.substring(0, 10) + '...';
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });
    }

    function drawLossesStatusChart(missing, delivered) {
        const canvas = document.getElementById('losses-status-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const total = missing + delivered;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 90;
        const innerRadius = 60;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (total === 0) return;
        
        // Missing arc
        const missingAngle = (missing / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + missingAngle);
        ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + missingAngle, -Math.PI/2, true);
        ctx.closePath();
        const grad1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad1.addColorStop(0, '#ff5252');
        grad1.addColorStop(1, '#d50000');
        ctx.fillStyle = grad1;
        ctx.fill();
        
        // Delivered arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2 + missingAngle, -Math.PI/2 + Math.PI * 2);
        ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + Math.PI * 2, -Math.PI/2 + missingAngle, true);
        ctx.closePath();
        const grad2 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad2.addColorStop(0, '#00e676');
        grad2.addColorStop(1, '#00c853');
        ctx.fillStyle = grad2;
        ctx.fill();
        
        // Update center text
        document.getElementById('losses-chart-center-value').textContent = missing;
        
        // Update legend
        document.getElementById('losses-chart-legend').innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: linear-gradient(135deg, #ff5252, #d50000)"></span>
                <span>مفقود (${missing})</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: linear-gradient(135deg, #00e676, #00c853)"></span>
                <span>مستلم (${delivered})</span>
            </div>
        `;
    }

    // ===== RTS Section =====
    function initRTS() {
        // Load scanned IDs from localStorage
        const savedScanned = localStorage.getItem('ammar_rts_scanned');
        if (savedScanned) {
            try {
                state.rtsScannedIds = new Set(JSON.parse(savedScanned));
            } catch (e) {
                state.rtsScannedIds = new Set();
            }
        } else {
            state.rtsScannedIds = new Set();
        }

        const csvInput = document.getElementById('rts-csv-input');
        if (csvInput) {
            csvInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    parseRTSCSV(event.target.result);
                };
                reader.readAsText(file);
            });
        }

        const scannerInput = document.getElementById('rts-scanner-input');
        if (scannerInput) {
            scannerInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const barcode = scannerInput.value.trim();
                    if (barcode) {
                        processRTSScan(barcode);
                    }
                    scannerInput.value = '';
                }
            });
            // Auto focus when entering the page
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    if (item.dataset.page === 'rts') {
                        setTimeout(() => scannerInput.focus(), 100);
                        renderRTS(); // Re-render in case localstorage updated
                    }
                });
            });
        }

        const finishBtn = document.getElementById('rts-finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', generateRTSReport);
        }
        
        renderRTS();
    }

    function parseRTSCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = parseCSVLine(lines[0]);
        state.rtsItems = [];
        
        const trackingIdx = headers.indexOf('Tracking ID');
        const storeIdx = headers.indexOf('DSP Name');
        
        if (trackingIdx === -1 || storeIdx === -1) {
            showToast('الملف غير متوافق', 'error', 'يجب أن يحتوي الملف المرفوع على Tracking ID و DSP Name');
            return;
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = parseCSVLine(line);
            if (values.length >= headers.length) {
                const trackingId = values[trackingIdx] ? values[trackingIdx].trim() : '';
                const storeName = values[storeIdx] ? values[storeIdx].trim() : '';
                if (trackingId) {
                    state.rtsItems.push({
                        tracking_id: trackingId,
                        store: storeName
                    });
                }
            }
        }
        
        showToast('تم رفع الملف بنجاح', 'success', `تم تحميل ${state.rtsItems.length} شحنة مرتجعة`);
        renderRTS();
    }

    function processRTSScan(barcode) {
        const scannerInput = document.getElementById('rts-scanner-input');
        if (!state.rtsItems || state.rtsItems.length === 0) {
            showToast('تنبيه', 'warning', 'يرجى رفع ملف الـ CSV الخاص بالمرتجعات أولاً قبل البدء في المسح.');
            scannerInput.classList.remove('scan-success', 'scan-error');
            void scannerInput.offsetWidth;
            scannerInput.classList.add('scan-error');
            return;
        }
        
        // Find if barcode exists in expected RTS items
        const itemExists = state.rtsItems.some(i => i.tracking_id.toUpperCase() === barcode.toUpperCase());
        
        if (itemExists) {
            if (!state.rtsScannedIds.has(barcode.toUpperCase())) {
                state.rtsScannedIds.add(barcode.toUpperCase());
                localStorage.setItem('ammar_rts_scanned', JSON.stringify(Array.from(state.rtsScannedIds)));
                
                scannerInput.classList.remove('scan-success', 'scan-error');
                void scannerInput.offsetWidth; // trigger reflow
                scannerInput.classList.add('scan-success');
                renderRTS();
            } else {
                showToast('تنبيه', 'warning', 'تم تسجيل استرجاع هذه الشحنة مسبقاً!');
                scannerInput.classList.remove('scan-success', 'scan-error');
                void scannerInput.offsetWidth;
                scannerInput.classList.add('scan-error');
            }
        } else {
            showToast('خطأ', 'error', 'هذا التتبع غير موجود في ملف المرتجعات المرفوع!');
            scannerInput.classList.remove('scan-success', 'scan-error');
            void scannerInput.offsetWidth;
            scannerInput.classList.add('scan-error');
        }
    }

    function renderRTS() {
        if (!state.rtsItems) return;
        
        const total = state.rtsItems.length;
        const scanned = state.rtsScannedIds.size;
        const pending = total - scanned;
        
        const elTotal = document.getElementById('rts-total-count');
        const elScanned = document.getElementById('rts-scanned-count');
        const elPending = document.getElementById('rts-pending-count');
        
        if (elTotal) elTotal.textContent = total;
        if (elScanned) elScanned.textContent = scanned;
        if (elPending) elPending.textContent = pending;
        
        const pendingTbody = document.getElementById('rts-pending-body');
        const scannedTbody = document.getElementById('rts-scanned-body');
        
        if (!pendingTbody || !scannedTbody) return;
        
        let pendingHtml = '';
        let scannedHtml = '';
        
        state.rtsItems.forEach(item => {
            const tr = `
                <tr>
                    <td style="font-family: var(--font-en); font-weight: 600;">${item.tracking_id}</td>
                    <td>${item.store}</td>
                </tr>
            `;
            if (state.rtsScannedIds.has(item.tracking_id.toUpperCase())) {
                scannedHtml += tr;
            } else {
                pendingHtml += tr;
            }
        });
        
        pendingTbody.innerHTML = pendingHtml || '<tr><td colspan="2" style="text-align:center; padding: 15px; color: var(--text-muted);">لا يوجد شحنات متبقية</td></tr>';
        scannedTbody.innerHTML = scannedHtml || '<tr><td colspan="2" style="text-align:center; padding: 15px; color: var(--text-muted);">لم يتم مسح أي شحنة بعد</td></tr>';
    }

    function generateRTSReport() {
        if (!state.rtsItems || state.rtsItems.length === 0) {
            showToast('تنبيه', 'warning', 'يجب رفع ملف المرتجعات أولاً قبل إنهائها.');
            return;
        }
        
        const missingItems = state.rtsItems.filter(i => !state.rtsScannedIds.has(i.tracking_id.toUpperCase()));
        
        if (missingItems.length === 0) {
            alert('🎉 عمل ممتاز! تم استرجاع جميع الشحنات الموجودة في الملف بنجاح ولا توجد أية نواقص.');
            if (confirm('هل تريد مسح السجل والبدء بملف جديد غداً؟')) {
                state.rtsScannedIds.clear();
                state.rtsItems = [];
                localStorage.removeItem('ammar_rts_scanned');
                document.getElementById('rts-csv-input').value = ""; // Clear file input
                renderRTS();
            }
            return;
        }
        
        // Group by store
        const grouped = {};
        missingItems.forEach(i => {
            if (!grouped[i.store]) grouped[i.store] = [];
            grouped[i.store].push(i.tracking_id);
        });
        
        let reportText = "=== 📑 تقرير المرتجعات المفقودة ===\n\n";
        for (const [store, ids] of Object.entries(grouped)) {
            reportText += `🛒 محل: ${store} (${ids.length} شحنات)\n`;
            ids.forEach(id => reportText += `   - ${id}\n`);
            reportText += "\n";
        }
        
        alert("⚠️ تنبيه: توجد شحنات لم يتم استرجاعها!\n\n" + reportText.substring(0, 400) + (reportText.length > 400 ? '\n...\n(باقي التقرير تجده في الـ Console)' : ''));
        console.log(reportText); // Log full report to console for copy-pasting
        showToast('تم إصدار التقرير', 'info', 'تم طباعة التقرير بالكامل في الـ Console لنسخه');
        
        if (confirm('هل تريد مسح البيانات السابقة للبدء بملف جديد غداً؟ (تأكد من نسخ التقرير قبل الموافقة)')) {
            state.rtsScannedIds.clear();
            state.rtsItems = [];
            localStorage.removeItem('ammar_rts_scanned');
            document.getElementById('rts-csv-input').value = "";
            renderRTS();
        }
    }

    // ===== Notifications Logic =====
    function initNotifications() {
        const notifBtn = document.getElementById('notification-btn');
        const notifDropdown = document.getElementById('notifications-dropdown');
        const badge = document.getElementById('notification-badge');
        const list = document.getElementById('notifications-list');
        const markReadBtn = document.getElementById('mark-read-btn');

        if (!notifBtn || !notifDropdown) return;

        const dummyNotifications = [
            { icon: 'fa-store', color: 'var(--success)', text: 'تم إضافة محل جديد بنجاح إلى نطاق سموحة.', time: 'منذ 5 دقائق' },
            { icon: 'fa-box-open', color: 'var(--info)', text: 'زيادة ملحوظة في الشحنات لمحل "طلعت المصري".', time: 'منذ 12 دقيقة' },
            { icon: 'fa-exclamation-circle', color: 'var(--warning)', text: 'يرجى مراجعة مديونيات بعض المحلات في منطقة الإسكندرية.', time: 'منذ ساعة' },
            { icon: 'fa-chart-line', color: 'var(--primary)', text: 'ارتفاع معدل التغطية بنسبة 5% هذا الأسبوع.', time: 'منذ ساعتين' },
            { icon: 'fa-user-check', color: 'var(--success)', text: 'تم تحديث أرقام هواتف 12 محل جديد.', time: 'منذ 3 ساعات' },
            { icon: 'fa-map-marker-alt', color: 'var(--warning)', text: 'بعض المحلات قريبة جداً من حدود التغطية (475م).', time: 'منذ يوم' },
            { icon: 'fa-sync', color: 'var(--info)', text: 'اكتملت مزامنة البيانات مع الخوادم بنجاح.', time: 'منذ يومين' }
        ];

        // Shuffle and pick 3-4
        const shuffled = dummyNotifications.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.floor(Math.random() * 2) + 3);

        if (badge) {
            badge.textContent = selected.length;
            badge.style.display = selected.length > 0 ? 'flex' : 'none';
        }

        if (list) {
            list.innerHTML = selected.map(n => `
                <div style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); display: flex; align-items: flex-start; gap: 10px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
                    <div style="background: ${n.color}22; color: ${n.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.85rem;">
                        <i class="fas ${n.icon}"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.4; margin-bottom: 4px;">${n.text}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);"><i class="far fa-clock"></i> ${n.time}</div>
                    </div>
                </div>
            `).join('');

            if (selected.length === 0) {
                list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">لا توجد إشعارات جديدة</div>';
            }
        }

        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
                notifDropdown.style.display = 'none';
            }
        });

        if (markReadBtn) {
            markReadBtn.addEventListener('click', () => {
                if (badge) badge.style.display = 'none';
                if (list) list.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">لا توجد إشعارات جديدة</div>';
            });
        }
    }

    // ===== Init =====
    function init() {
        initRTS();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        initEventListeners();
        initNotifications();
        checkAuth();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

