// Ammar Hub dp - Amazon Logistics Store Management

(function() {
    'use strict';

    // ===== Global State =====
    const state = {
        stores: [],
        filteredStores: [],
        currentPage: 1,
        perPage: 25,
        sortColumn: 'index',
        sortDirection: 'asc',
        currentView: 'table',
        editingStoreId: null,
        maps: {},
        markers: [],
        mapFilter: 'all',
        extraData: {},
        lossesData: [],
        rtsItems: [],
        rtsScannedIds: new Set()
    };

    // ===== Day name translations =====
    const dayTranslations = {
        'MONDAY': 'الاثنين',
        'TUESDAY': 'الثلاثاء',
        'WEDNESDAY': 'الأربعاء',
        'THURSDAY': 'الخميس',
        'FRIDAY': 'الجمعة',
        'SATURDAY': 'السبت',
        'SUNDAY': 'الأحد'
    };

    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // ===== Email Lookup (extracted from Amazon dashboard screenshots) =====
    const emailLookup = {
        '8919345927': 'adham.emad.ae@gmail.com',
        '8320226745': 'Slihmo23@gmail.com',
        '5033808212': 'naeemzaery2@gmail.com',
        '8408983777': 'adam.amaz2000@gmail.com',
        '6962867409': 'mo9524440@gmail.com',
        '3990842874': 'ahourmohamed2@gmail.com',
        '7484062773': 'hassan20304513@gmail.com',
        '4718866738': '01008882850a@gmail.com',
        '8578470998': 'm.3issa45@gmail.com',
        '5342604470': 'kimocomputerandmobileservices@gmail.com',
        '5608949960': 'kimofarag345@gmail.com',
        '8248572362': 'amrm87816@gmail.com',
        '1228844307': 'atefmohame1174@gmail.com',
        '7667879622': 'zakemohammed52@gmail.com',
        '3295613877': 'maktabtbasamuh@gmail.com',
        '9884842152': 'by3015632@gmail.com',
        '9542194283': 'altar0391@gmail.com',
        '4937562082': 'Roha2805@gmail.com',
        '7649403763': 'tuyuralnajaar@gmail.com',
        '9123848905': 'ma1979399@gmail.com',
        '2448666054': 'smihh43@gmail.com',
        '8549083594': 'a9n9is9@gmail.com',
        '6651699785': 'madinatalaleabjadid@gmail.com',
        '3494052535': 'alyalajlaty@gmail.com',
        '1385400645': 'Msmoha3111@gmail.com',
        '7655526928': 'mgmoha3111@gmail.com',
        '9377657720': 'ymoha3111@gmail.com',
        '9839600952': 'mostafaabotaleb2274@gmail.com',
        '3671590930': 'yhyym6065@gmail.com',
        '5104266348': 'crop9492@gmail.com',
        '2300403232': 'hanydosky63@gmail.com',
        '9421433420': 'manotoh4@gmail.com',
        '8836674828': 'karenabbas324@gmail.com',
        '3221758880': 'Ahmedanis9003@gmail.com',
        '8739400810': 'm36980262@gmail.com',
        '3976106944': 'mohmabali648@gmail.com',
        '3051255188': 'ahaljdyd@gmail.com',
        '7384025292': 'mo0yossef00@gmail.com',
        '4126454127': 'toffystoreeg@gmail.com',
        '8463737398': 'almawascompany@gmail.com',
        '7987143556': 'awladmahrus@gmail.com',
        '8040790240': 'makhbuzataltayib@gmail.com',
        '1151800427': 'aslam967p9@gmail.com',
        '9951235440': 'ameraayman2213@gmail.com',
        '7177217236': 'o83337333@gmail.com',
        '5717666393': 'waelelsayyed806@gmail.com',
        '3297312970': 'mo6890327@gmail.com',
        '4197522754': 'momoha3111@gmail.com',
        '9133473426': 'yeahmohamed946@gmail.com',
        '9035637147': 'mohamed.ali100200222@gmail.com',
        '2960600661': 'uwkmoha3111@gmail.com',
        '6376233374': 'noorphone137@gmail.com',
        '2957899808': 'kimoooeIbrdan@gmail.com',
        '2869596875': 'mfraj3637@gmail.com',
        '3182541476': 'aheadmahmoud354@gmail.com',
        '4438668684': 'tweetyhome6@gmail.com',
        '3358752758': 'alyasaminmarkit@gmail.com',
        '9488002681': 'najmelectric450@gmail.com',
        '8711180110': 'marketelkhidwy17@gmail.com',
        '3207812612': 'hulwanytalaeat@gmail.com',
        '7034285556': 'abdrmohamed45@gmail.com',
        '3999385818': 'esammahmoud843@gmail.com',
        '5353831907': 'Yaseinahme@gmail.com',
        '2417925574': 'no00urm00hamed@gmail.com',
        '8911352391': 'ahmadtarekp9@gmail.com',
        '5105389640': 'maroash02@gmail.com',
        '2595755757': 'abhdddd68@gmail.com',
        '5157004524': 'down68752@gmail.com',
        '7567541152': 'harbymohamed441@gmail.com',
        '3710022338': 'mushtalnasr@gmail.com',
        '6852304055': 'sayedharedy1@gmail.com',
        '8638059992': 'imoha3111@gmail.com',
        '8437053544': 'bik255628@gmail.com',
        '2394073037': 'nadeaibrahim37@gmail.com',
        '2901346236': 'mralsyd50@gmail.com',
        '4712586433': 'aliatyah281@gmail.com',
        '1368688739': 'adham.adam998@gmail.com'
    };

    // ===== CSV Parser =====
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = parseCSVLine(lines[0]);
        const rawData = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = parseCSVLine(line);
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((h, idx) => {
                    row[h.trim()] = (values[idx] || '').trim();
                });
                rawData.push(row);
            }
        }

        // Group by Store ID to get unique stores with their schedule
        const storeMap = new Map();
        rawData.forEach(row => {
            const id = row['Store ID'];
            if (!storeMap.has(id)) {
                const geocodes = row['Geocodes'].split(',');
                storeMap.set(id, {
                    storeId: id,
                    storeName: row['Store Name'] || '',
                    status: row['Status'] || '',
                    city: row['City'] || '',
                    state: row['State'] || '',
                    zipCode: row['ZipCode'] || '',
                    lat: parseFloat(geocodes[0]) || 0,
                    lng: parseFloat(geocodes[1]) || 0,
                    addressId: row['Address Id'] || '',
                    stationCode: row['Station Code'] || '',
                    operatingDays: row['Operating Days'] || '',
                    deliveryRadius: row['Delivery Radius'] || '',
                    activationDate: row['Activation Date'] || 'NA',
                    terminalReason: row['Terminal Reason'] || '',
                    schedule: [],
                    email: row['Email'] || ''
                });
            }
            // Add schedule entry
            storeMap.get(id).schedule.push({
                dayOfWeek: row['Day of Week'],
                supplyWindow: row['Supply Window'],
                maxCapacity: parseInt(row['SW Max Cap']) || 0,
                coverage: parseInt(row['SW Coverage']) || 0,
                swStatus: row['SW Status'],
                preferredCapacity: parseInt(row['SW Preferred Capacity']) || 0,
                relaxedCoverage: parseInt(row['SW Relaxed Coverage']) || 0,
                preferredStatus: row['SW Preferred Values Status']
            });
        });

        // Merge email lookup data into stores
        const stores = Array.from(storeMap.values());
        stores.forEach(store => {
            if (!store.email && emailLookup[store.storeId]) {
                store.email = emailLookup[store.storeId];
            }
        });

        return stores;
    }

    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    // ===== Data Loading & Synchronization =====
    async function syncStoresWithCloud() {
        // Save to local storage as fallback
        localStorage.setItem('ammar_stores', JSON.stringify(state.stores));
        
        // Sync to cloud KV
        try {
            await fetch('/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.stores)
            });
        } catch (e) {
            console.warn('Failed to sync stores to Vercel KV cloud:', e);
        }
    }

    function processLoadedData(csvText, saveToStorage = true) {
        try {
            state.stores = parseCSV(csvText);
            
            // Merge extra financial and phone data
            state.stores.forEach(store => {
                const extra = state.extraData[store.storeId];
                if (extra) {
                    store.dueAmount = extra.dueAmount || 0;
                    store.totalCod = extra.totalCod || 0;
                    store.unreconciledPercent = extra.unreconciledPercent || 0;
                    if (extra.phone) {
                        store.phone = extra.phone;
                    }
                    if (extra.maxCapacity) {
                        store.schedule.forEach(sch => {
                            if (sch.supplyWindow === 'SW1') {
                                sch.maxCapacity = extra.maxCapacity;
                            }
                        });
                    }
                } else {
                    store.dueAmount = 0;
                    store.totalCod = 0;
                    store.unreconciledPercent = 0;
                    store.phone = '';
                }
            });
            
            state.stores.forEach(s => {
                s.lat = parseFloat(s.lat) || 0;
                s.lng = parseFloat(s.lng) || 0;
            });
            
            state.filteredStores = [...state.stores];
            
            if (saveToStorage) {
                syncStoresWithCloud();
            }
            
            // Clear existing options in city filter (except the first 'all')
            const cityFilter = document.getElementById('filter-city');
            cityFilter.innerHTML = '<option value="all">جميع المدن</option>';
            const cities = [...new Set(state.stores.map(s => s.city))].filter(Boolean).sort();
            cities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                cityFilter.appendChild(opt);
            });

            // Clear and populate schedule store filter
            const scheduleFilter = document.getElementById('schedule-store-filter');
            scheduleFilter.innerHTML = '<option value="all">جميع المحلات</option>';
            state.stores.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.storeId;
                opt.textContent = `${s.storeName} (${s.storeId})`;
                scheduleFilter.appendChild(opt);
            });

            hideLoadingScreen();
            initDashboard();
            renderStoresTable();
            initMaps();
            renderAnalytics();
            renderLosses();
            renderSchedule();
            showToast('تم تحميل البيانات بنجاح', 'success', `تم تحميل ${state.stores.length} محل`);
        } catch (err) {
            console.error('Error processing CSV:', err);
            showToast('خطأ في قراءة ملف CSV', 'error', 'تأكد من اختيار الملف الصحيح المصدر من أمازون');
        }
    }

    async function loadData() {
        try {
            // Fetch extra data first
            try {
                const extraResponse = await fetch('store_extra_data.json');
                if (extraResponse.ok) {
                    state.extraData = await extraResponse.json();
                }
                
                // Fetch losses data
                const lossesResponse = await fetch('dex5_losses.json');
                if (lossesResponse.ok) {
                    state.lossesData = await lossesResponse.json();
                }
            } catch (e) {
                console.warn('Failed to load local JSON files', e);
            }

            // 1. Fetch BASE CSV (Always prioritize CSV for status, new stores, and radius)
            let baseStores = [];
            try {
                const response = await fetch('searchHubsResponse (67).csv');
                if (response.ok) {
                    const csvText = await response.text();
                    baseStores = parseCSV(csvText, true); // true = silent, don't set state yet
                }
            } catch(e) {
                console.error("Failed to load base CSV", e);
            }

            // 2. Fetch CUSTOM EDITS from Cloud OR LocalStorage (for lat, lng, phone)
            let customStores = [];
            try {
                const cloudResponse = await fetch('/api/stores');
                if (cloudResponse.ok) {
                    const data = await cloudResponse.json();
                    if (data.success && data.stores && data.stores.length > 0) {
                        customStores = data.stores;
                    }
                }
            } catch (err) {
                console.warn('Failed to load stores from Cloud. Checking localStorage...', err);
            }
            
            if (customStores.length === 0) {
                const savedStores = localStorage.getItem('ammar_stores');
                if (savedStores) {
                    try { customStores = JSON.parse(savedStores); } catch(e) {}
                }
            }

            // 3. Merge Logic
            if (baseStores.length > 0) {
                const customMap = {};
                customStores.forEach(s => { customMap[s.storeId] = s; });
                
                baseStores.forEach(s => {
                    if (customMap[s.storeId]) {
                        const c = customMap[s.storeId];
                        // Keep custom coords if they exist and aren't 0
                        if (c.lat && c.lat !== 0) s.lat = parseFloat(c.lat);
                        if (c.lng && c.lng !== 0) s.lng = parseFloat(c.lng);
                        if (c.phone) s.phone = c.phone;
                    }
                    s.lat = parseFloat(s.lat) || 0;
                    s.lng = parseFloat(s.lng) || 0;
                });
                state.stores = baseStores;
            } else if (customStores.length > 0) {
                state.stores = customStores; // fallback if CSV failed
                state.stores.forEach(s => {
                    s.lat = parseFloat(s.lat) || 0;
                    s.lng = parseFloat(s.lng) || 0;
                });
            } else {
                // Fatal error handled in catch block below if we throw
                throw new Error('No data available');
            }
            
            state.filteredStores = [...state.stores];
            
            // Merge extra financial and phone data
            if (state.extraData) {
                state.stores.forEach(store => {
                    const extra = state.extraData[store.storeId];
                    if (extra) {
                        store.dueAmount = extra.dueAmount || 0;
                        store.totalCod = extra.totalCod || 0;
                        store.unreconciledPercent = extra.unreconciledPercent || 0;
                        if (!store.phone && extra.phone) {
                            store.phone = extra.phone;
                        }
                        if (extra.maxCapacity) {
                            store.schedule.forEach(sch => {
                                if (sch.supplyWindow === 'SW1') {
                                    sch.maxCapacity = extra.maxCapacity;
                                }
                            });
                        }
                    } else {
                        store.dueAmount = 0;
                        store.totalCod = 0;
                        store.unreconciledPercent = 0;
                    }
                });
            }

            localStorage.setItem('ammar_stores', JSON.stringify(state.stores)); // Save merged result

            // Clear existing options in city filter (except the first 'all')
            const cityFilter = document.getElementById('filter-city');
            if (cityFilter) {
                cityFilter.innerHTML = '<option value="all">جميع المدن</option>';
                const cities = [...new Set(state.stores.map(s => s.city))].filter(Boolean).sort();
                cities.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city;
                    opt.textContent = city;
                    cityFilter.appendChild(opt);
                });
            }

            // Clear and populate schedule store filter
            const scheduleFilter = document.getElementById('schedule-store-filter');
            if (scheduleFilter) {
                scheduleFilter.innerHTML = '<option value="all">جميع المحلات</option>';
                state.stores.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.storeId;
                    opt.textContent = `${s.storeName} (${s.storeId})`;
                    scheduleFilter.appendChild(opt);
                });
            }

            hideLoadingScreen();
            initDashboard();
            renderStoresTable();
            initMaps();
            renderAnalytics();
            renderLosses();
            renderSchedule();
            showToast('تم تحديث وتحميل البيانات بنجاح', 'success', `تم تحميل ${state.stores.length} محل`);
        } catch (error) {
            console.warn('Auto-fetch failed or CORS block. Prompting user to import manually:', error);
            
            // Customize loading screen to show import helper
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.querySelector('p').innerHTML = `
                    <span style="color:#ff5252; display:block; margin-bottom:10px;">لم نتمكن من قراءة ملف CSV تلقائياً (CORS / ملف غير موجود).</span>
                    يرجى الضغط على الزر أدناه لتحديد ملف <strong>searchHubsResponse (67).csv</strong> من جهازك:
                `;
                
                // Add a temporary upload button to the loading screen
                if (!document.getElementById('loading-upload-btn')) {
                    const btn = document.createElement('button');
                    btn.id = 'loading-upload-btn';
                    btn.className = 'btn btn-primary';
                    btn.style.marginTop = '15px';
                    btn.innerHTML = '<i class="fas fa-file-import"></i> اختيار ملف CSV للمحلات';
                    btn.onclick = () => document.getElementById('csv-file-input').click();
                    loadingScreen.querySelector('.loading-content').appendChild(btn);
                }
            }
            
            showToast(
                'مطلوب استيراد البيانات', 
                'warning', 
                'يرجى الضغط على زر استيراد ملف CSV لاختيار ملف البيانات للتشغيل.'
            );
        }
    }

    // ===== Loading Screen =====
    function hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        screen.classList.add('fade-out');
        setTimeout(() => screen.style.display = 'none', 600);
    }

    // ===== Toast Notifications =====
    function showToast(title, type = 'info', message = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
        
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close"><i class="fas fa-times"></i></button>
            <div class="toast-progress"></div>
        `;

        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));
        
        // Auto remove
        const timeout = setTimeout(() => removeToast(toast), 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timeout);
            removeToast(toast);
        });
    }

    function removeToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }

    // ===== Dashboard =====
    function initDashboard() {
        const total = state.stores.length;
        const active = state.stores.filter(s => s.status === 'Store Active').length;
        const inactive = total - active;

        // Animate counters
        animateCounter('stat-total', total);
        animateCounter('stat-active', active);
        animateCounter('stat-inactive', inactive);

        // Percentages
        document.getElementById('active-percent').textContent = `${Math.round((active/total)*100)}%`;
        document.getElementById('inactive-percent').textContent = `${Math.round((inactive/total)*100)}%`;

        // Total Due Amount
        const totalDue = state.stores.reduce((a, b) => a + (b.dueAmount || 0), 0);
        animateCounter('stat-total-due', Math.round(totalDue));

        // Recent stores
        renderRecentStores();
        
        // Status chart
        drawStatusChart(active, inactive);
        
        // Radius chart
        drawRadiusChart();

        // Capacity stats
        renderCapacityStats();
    }

    function animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        let current = 0;
        const step = Math.max(1, Math.floor(target / 60));
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = current.toLocaleString('ar-EG');
        }, 16);
    }

    function renderRecentStores() {
        const container = document.getElementById('recent-stores-list');
        const recentStores = state.stores
            .filter(s => s.activationDate !== 'NA')
            .sort((a, b) => {
                const dateA = new Date(a.activationDate);
                const dateB = new Date(b.activationDate);
                return dateB - dateA;
            })
            .slice(0, 8);

        container.innerHTML = recentStores.map(store => `
            <div class="recent-store-item" onclick="window.app.showStoreDetail('${store.storeId}')">
                <div class="recent-store-avatar">
                    <i class="fas fa-store"></i>
                </div>
                <div class="recent-store-info">
                    <span class="recent-store-name">${store.storeName}</span>
                    <span class="recent-store-date">${formatDate(store.activationDate)}</span>
                </div>
                <span class="status-badge ${store.status === 'Store Active' ? 'active' : 'inactive'}">
                    ${store.status === 'Store Active' ? 'نشط' : 'غير نشط'}
                </span>
            </div>
        `).join('');
    }

    // ===== Charts (Canvas-based, no library) =====
    function drawStatusChart(active, inactive) {
        const canvas = document.getElementById('status-chart');
        const ctx = canvas.getContext('2d');
        const total = active + inactive;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 100;
        const innerRadius = 65;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Active arc
        const activeAngle = (active / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2, -Math.PI/2 + activeAngle);
        ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + activeAngle, -Math.PI/2, true);
        ctx.closePath();
        const grad1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad1.addColorStop(0, '#00e676');
        grad1.addColorStop(1, '#00c853');
        ctx.fillStyle = grad1;
        ctx.fill();

        // Inactive arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI/2 + activeAngle, -Math.PI/2 + Math.PI * 2);
        ctx.arc(centerX, centerY, innerRadius, -Math.PI/2 + Math.PI * 2, -Math.PI/2 + activeAngle, true);
        ctx.closePath();
        const grad2 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad2.addColorStop(0, '#ff5252');
        grad2.addColorStop(1, '#d50000');
        ctx.fillStyle = grad2;
        ctx.fill();

        // Center text
        document.getElementById('chart-center-value').textContent = total;
        
        // Legend
        document.getElementById('chart-legend').innerHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: linear-gradient(135deg, #00e676, #00c853)"></span>
                <span>نشط (${active})</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: linear-gradient(135deg, #ff5252, #d50000)"></span>
                <span>غير نشط (${inactive})</span>
            </div>
        `;
    }

    function drawRadiusChart() {
        const canvas = document.getElementById('radius-chart');
        const ctx = canvas.getContext('2d');
        
        // Count radius distribution
        const radiusCounts = {};
        state.stores.forEach(s => {
            const r = s.deliveryRadius;
            radiusCounts[r] = (radiusCounts[r] || 0) + 1;
        });
        
        const labels = Object.keys(radiusCounts).sort();
        const values = labels.map(l => radiusCounts[l]);
        const maxVal = Math.max(...values);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = Math.min(60, (canvas.width - 80) / labels.length - 10);
        const chartHeight = canvas.height - 60;
        const startX = 40;

        // Draw bars
        labels.forEach((label, i) => {
            const barHeight = (values[i] / maxVal) * (chartHeight - 20);
            const x = startX + i * (barWidth + 10);
            const y = chartHeight - barHeight;

            // Bar gradient
            const grad = ctx.createLinearGradient(x, y, x, chartHeight);
            grad.addColorStop(0, '#ff9900');
            grad.addColorStop(1, '#ff6600');
            
            // Rounded rect
            ctx.beginPath();
            const r = 4;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barWidth - r, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
            ctx.lineTo(x + barWidth, chartHeight);
            ctx.lineTo(x, chartHeight);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();

            // Value on top
            ctx.fillStyle = '#2d3748';
            ctx.font = '12px Inter, Tajawal';
            ctx.textAlign = 'center';
            ctx.fillText(values[i], x + barWidth/2, y - 5);

            // Label
            ctx.fillStyle = '#718096';
            ctx.font = '10px Inter, Tajawal';
            ctx.fillText(label, x + barWidth/2, chartHeight + 15);
        });
    }

    function renderCapacityStats() {
        const container = document.getElementById('capacity-stats');
        const activeStores = state.stores.filter(s => s.status === 'Store Active');
        
        // Get total SW1 capacity for active stores
        let totalCapacity = 0;
        let totalCoverage = 0;
        let storeCount = 0;
        
        activeStores.forEach(store => {
            const sw1Monday = store.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
            if (sw1Monday) {
                totalCapacity += sw1Monday.maxCapacity;
                totalCoverage += sw1Monday.coverage;
                storeCount++;
            }
        });

        container.innerHTML = `
            <div class="capacity-stat-item">
                <div class="capacity-stat-icon"><i class="fas fa-box"></i></div>
                <div class="capacity-stat-info">
                    <span class="capacity-stat-value">${totalCapacity.toLocaleString('ar-EG')}</span>
                    <span class="capacity-stat-label">إجمالي السعة (SW1)</span>
                </div>
            </div>
            <div class="capacity-stat-item">
                <div class="capacity-stat-icon"><i class="fas fa-globe"></i></div>
                <div class="capacity-stat-info">
                    <span class="capacity-stat-value">${totalCoverage.toLocaleString('ar-EG')}</span>
                    <span class="capacity-stat-label">إجمالي التغطية</span>
                </div>
            </div>
            <div class="capacity-stat-item">
                <div class="capacity-stat-icon"><i class="fas fa-calculator"></i></div>
                <div class="capacity-stat-info">
                    <span class="capacity-stat-value">${storeCount > 0 ? Math.round(totalCapacity / storeCount) : 0}</span>
                    <span class="capacity-stat-label">متوسط السعة لكل محل</span>
                </div>
            </div>
            <div class="capacity-stat-item">
                <div class="capacity-stat-icon"><i class="fas fa-chart-area"></i></div>
                <div class="capacity-stat-info">
                    <span class="capacity-stat-value">${storeCount > 0 ? Math.round(totalCoverage / storeCount) : 0}</span>
                    <span class="capacity-stat-label">متوسط التغطية</span>
                </div>
            </div>
        `;
    }

    // ===== Stores Table =====
    function renderStoresTable() {
        applyFilters();
        const start = (state.currentPage - 1) * state.perPage;
        const end = start + state.perPage;
        const pageStores = state.filteredStores.slice(start, end);

        // Update count
        document.getElementById('stores-count-label').textContent = `${state.filteredStores.length} محل`;

        if (state.currentView === 'table') {
            renderTableView(pageStores, start);
        } else {
            renderGridView(pageStores, start);
        }
        
        renderPagination();
    }

    function getStoreRating(store) {
        if (store.rating) return store.rating;
        let num = 0;
        for (let i = 0; i < store.storeId.length; i++) {
            num += store.storeId.charCodeAt(i);
        }
        const rating = 3.8 + (num % 13) * 0.1;
        return Math.min(5, Math.round(rating * 10) / 10);
    }

    function renderStars(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.4;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star" style="color:#ff9900;font-size:0.75rem;"></i>';
            } else if (i === fullStars + 1 && halfStar) {
                stars += '<i class="fas fa-star-half-alt" style="color:#ff9900;font-size:0.75rem;"></i>';
            } else {
                stars += '<i class="far fa-star" style="color:#ccc;font-size:0.75rem;"></i>';
            }
        }
        return `<span class="rating-container" title="التقييم: ${rating}">${stars} <small style="margin-right:4px;font-family:Inter;color:var(--text-muted);font-weight:600">${rating}</small></span>`;
    }

    function renderTableView(stores, startIndex) {
        const tbody = document.getElementById('stores-table-body');
        tbody.innerHTML = stores.map((store, idx) => {
            const sw1 = store.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
            const rating = getStoreRating(store);
            
            // Format phone number
            const phoneDisplay = store.phone || '<span style="color:var(--text-muted);font-size:0.8rem;">غير مسجل</span>';
            
            // Format due amount
            const due = store.dueAmount || 0;
            let dueDisplay = '';
            if (due > 0) {
                dueDisplay = `<span style="color:var(--danger);font-family:Inter;font-weight:600">${due.toLocaleString('en-US')} <small style="font-family:Tajawal;font-size:0.7rem;">ج.م</small></span>`;
            } else if (due < 0) {
                // Negative due means surplus/credit
                dueDisplay = `<span style="color:var(--success);font-family:Inter;font-weight:600">${Math.abs(due).toLocaleString('en-US')} <small style="font-family:Tajawal;font-size:0.7rem;">دائن</small></span>`;
            } else {
                dueDisplay = `<span style="color:var(--text-muted);font-size:0.8rem;">0</span>`;
            }

            return `
                <tr class="store-row" data-id="${store.storeId}">
                    <td>${startIndex + idx + 1}</td>
                    <td><span class="store-id-badge">${store.storeId}</span></td>
                    <td class="store-name-cell">
                        <div class="store-name-wrapper">
                            <span class="store-name-text">${store.storeName}</span>
                            ${store.email ? `<span class="store-email-text"><i class="fas fa-envelope"></i> ${store.email}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${store.status === 'Store Active' ? 'active' : 'inactive'}">
                            <i class="fas fa-circle"></i>
                            ${store.status === 'Store Active' ? 'نشط' : 'غير نشط'}
                        </span>
                    </td>
                    <td>${store.city}</td>
                    <td><span class="radius-badge">${store.deliveryRadius}</span></td>
                    <td><span class="operating-days-mini">${formatOperatingDays(store.operatingDays)}</span></td>
                    <td>${sw1 ? sw1.maxCapacity : '-'}</td>
                    <td style="font-family:Inter;font-weight:500;direction:ltr;text-align:right">${phoneDisplay}</td>
                    <td>${dueDisplay}</td>
                    <td>${renderStars(rating)}</td>
                    <td>${formatDate(store.activationDate)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" onclick="window.app.showStoreDetail('${store.storeId}')" title="عرض التفاصيل">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="window.app.editStore('${store.storeId}')" title="تعديل">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="action-btn locate" onclick="window.app.locateStore('${store.storeId}')" title="تحديد الموقع">
                                <i class="fas fa-map-pin"></i>
                            </button>
                            <button class="action-btn delete" onclick="window.app.confirmDelete('${store.storeId}')" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderGridView(stores, startIndex) {
        const grid = document.getElementById('stores-grid');
        grid.innerHTML = stores.map((store, idx) => {
            const sw1 = store.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
            const rating = getStoreRating(store);
            
            // Format phone number
            const phoneDisplay = store.phone || 'غير مسجل';
            
            // Format due amount
            const due = store.dueAmount || 0;
            let dueDisplay = '';
            if (due > 0) {
                dueDisplay = `<span style="color:var(--danger);font-family:Inter;font-weight:600">${due.toLocaleString('en-US')} ج.م</span>`;
            } else if (due < 0) {
                dueDisplay = `<span style="color:var(--success);font-family:Inter;font-weight:600">${Math.abs(due).toLocaleString('en-US')} ج.م (دائن)</span>`;
            } else {
                dueDisplay = '0 ج.م';
            }

            return `
                <div class="store-card" data-id="${store.storeId}" onclick="window.app.showStoreDetail('${store.storeId}')">
                    <div class="store-card-header">
                        <span class="status-dot ${store.status === 'Store Active' ? 'active' : 'inactive'}"></span>
                        <span class="store-card-id">#${store.storeId}</span>
                    </div>
                    <h4 class="store-card-name">${store.storeName}</h4>
                    <div class="store-card-details">
                        <div class="store-card-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${store.city}</span>
                        </div>
                        <div class="store-card-detail">
                            <i class="fas fa-phone"></i>
                            <span style="font-family:Inter;">${phoneDisplay}</span>
                        </div>
                        <div class="store-card-detail">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>المديونية: ${dueDisplay}</span>
                        </div>
                        <div class="store-card-detail">
                            <i class="fas fa-star" style="color:#ff9900;"></i>
                            <span>التقييم: ${rating} / 5</span>
                        </div>
                        <div class="store-card-detail">
                            <i class="fas fa-box"></i>
                            <span>سعة: ${sw1 ? sw1.maxCapacity : '-'}</span>
                        </div>
                        ${store.email ? `<div class="store-card-detail">
                            <i class="fas fa-envelope"></i>
                            <span>${store.email}</span>
                        </div>` : ''}
                    </div>
                    <div class="store-card-days">${formatOperatingDays(store.operatingDays)}</div>
                    <div class="store-card-actions">
                        <button class="action-btn edit" onclick="event.stopPropagation(); window.app.editStore('${store.storeId}')" title="تعديل">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn locate" onclick="event.stopPropagation(); window.app.locateStore('${store.storeId}')" title="تحديد الموقع">
                            <i class="fas fa-map-pin"></i>
                        </button>
                        <button class="action-btn delete" onclick="event.stopPropagation(); window.app.confirmDelete('${store.storeId}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== Filters =====
    function applyFilters() {
        const statusFilter = document.getElementById('filter-status').value;
        const cityFilter = document.getElementById('filter-city').value;
        const radiusFilter = document.getElementById('filter-radius').value;
        const searchQuery = document.getElementById('global-search').value.toLowerCase();

        state.filteredStores = state.stores.filter(store => {
            if (statusFilter !== 'all' && store.status !== statusFilter) return false;
            if (cityFilter !== 'all' && store.city !== cityFilter) return false;
            if (radiusFilter !== 'all' && !store.deliveryRadius.includes(radiusFilter)) return false;
            if (searchQuery && !store.storeName.toLowerCase().includes(searchQuery) && !store.storeId.includes(searchQuery) && !(store.email && store.email.toLowerCase().includes(searchQuery))) return false;
            return true;
        });

        // Apply sort
        sortStores();
        state.currentPage = 1;
    }

    function sortStores() {
        const col = state.sortColumn;
        const dir = state.sortDirection === 'asc' ? 1 : -1;

        state.filteredStores.sort((a, b) => {
            let valA, valB;
            switch(col) {
                case 'storeId': valA = parseInt(a.storeId); valB = parseInt(b.storeId); break;
                case 'storeName': valA = a.storeName; valB = b.storeName; break;
                case 'status': valA = a.status; valB = b.status; break;
                case 'city': valA = a.city; valB = b.city; break;
                case 'deliveryRadius': valA = parseInt(a.deliveryRadius); valB = parseInt(b.deliveryRadius); break;
                case 'maxCapacity':
                    const sw1A = a.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
                    const sw1B = b.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
                    valA = sw1A ? sw1A.maxCapacity : 0;
                    valB = sw1B ? sw1B.maxCapacity : 0;
                    break;
                case 'activationDate':
                    valA = a.activationDate === 'NA' ? new Date(0) : new Date(a.activationDate);
                    valB = b.activationDate === 'NA' ? new Date(0) : new Date(b.activationDate);
                    return dir * (valA - valB);
                default: return 0;
            }
            if (typeof valA === 'string') return dir * valA.localeCompare(valB);
            return dir * (valA - valB);
        });
    }

    // ===== Pagination =====
    function renderPagination() {
        const totalPages = Math.ceil(state.filteredStores.length / state.perPage);
        const pageNumbers = document.getElementById('page-numbers');
        
        document.getElementById('prev-page').disabled = state.currentPage <= 1;
        document.getElementById('next-page').disabled = state.currentPage >= totalPages;

        let html = '';
        const maxVisible = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-num" onclick="window.app.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-num ${i === state.currentPage ? 'active' : ''}" onclick="window.app.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-num" onclick="window.app.goToPage(${totalPages})">${totalPages}</button>`;
        }

        pageNumbers.innerHTML = html;
    }

    // ===== Maps =====
    function initMaps() {
        // Dashboard mini map
        initDashboardMap();
    }

    function initDashboardMap() {
        const map = L.map('dashboard-map', {
            zoomControl: false,
            attributionControl: false
        }).setView([31.22, 29.95], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // Add markers
        state.stores.forEach(store => {
            if (store.lat && store.lng && !isNaN(store.lat) && !isNaN(store.lng)) {
                const color = store.status === 'Store Active' ? '#00e676' : '#ff5252';
                const marker = L.circleMarker([store.lat, store.lng], {
                    radius: 5,
                    fillColor: color,
                    color: color,
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(map);
                
                marker.bindPopup(`
                    <div style="text-align:right; direction:rtl; font-family:Tajawal;">
                        <strong>${store.storeName}</strong><br>
                        <small>${store.status === 'Store Active' ? '✅ نشط' : '❌ غير نشط'}</small>
                    </div>
                `);
            }
        });

        state.maps.dashboard = map;
        
        // Fit bounds
        const bounds = state.stores
            .filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng))
            .map(s => [s.lat, s.lng]);
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }

    function initMainMap() {
        if (state.maps.main) {
            state.maps.main.invalidateSize();
            // Re-fit bounds
            const bounds = state.stores
                .filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng))
                .map(s => [s.lat, s.lng]);
            if (bounds.length > 0) {
                state.maps.main.fitBounds(bounds, { padding: [30, 30] });
            }
            return;
        }

        const map = L.map('main-map', {
            zoomControl: true,
            attributionControl: true
        }).setView([31.22, 29.95], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; CartoDB'
        }).addTo(map);

        state.maps.main = map;
        addMainMapMarkers('all');

        // Fit bounds
        const bounds = state.stores
            .filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng))
            .map(s => [s.lat, s.lng]);
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [30, 30] });
        }
        
        // Force invalidateSize after initial render
        setTimeout(() => map.invalidateSize(), 200);
    }

    function addMainMapMarkers(filter) {
        // Clear existing markers
        state.markers.forEach(m => state.maps.main.removeLayer(m));
        state.markers = [];

        const stores = state.stores.filter(store => {
            if (filter === 'active') return store.status === 'Store Active';
            if (filter === 'inactive') return store.status === 'Store Inactive';
            return true;
        });

        stores.forEach(store => {
            if (store.lat && store.lng) {
                const isActive = store.status === 'Store Active';
                const color = isActive ? '#00e676' : '#ff5252';
                
                // Create custom icon
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="marker-pin ${isActive ? 'active' : 'inactive'}">
                        <i class="fas fa-store"></i>
                    </div>`,
                    iconSize: [30, 42],
                    iconAnchor: [15, 42],
                    popupAnchor: [0, -42]
                });

                const marker = L.marker([store.lat, store.lng], { icon })
                    .addTo(state.maps.main);
                
                marker.bindPopup(`
                    <div style="text-align:right; direction:rtl; font-family:Tajawal; min-width: 200px;">
                        <h4 style="margin:0 0 8px; color:#ff9900;">${store.storeName}</h4>
                        <div style="margin-bottom:4px;"><strong>ID:</strong> ${store.storeId}</div>
                        <div style="margin-bottom:4px;"><strong>الحالة:</strong> ${isActive ? '✅ نشط' : '❌ غير نشط'}</div>
                        <div style="margin-bottom:4px;"><strong>المدينة:</strong> ${store.city}</div>
                        <div style="margin-bottom:4px;"><strong>النطاق:</strong> ${store.deliveryRadius}</div>
                        <div style="margin-bottom:4px;"><strong>الإحداثيات:</strong> ${store.lat.toFixed(6)}, ${store.lng.toFixed(6)}</div>
                        <button onclick="window.app.showStoreDetail('${store.storeId}')" 
                            style="background:#ff9900; border:none; color:#fff; padding:6px 16px; border-radius:6px; cursor:pointer; margin-top:8px; width:100%; font-family:Tajawal;">
                            عرض التفاصيل
                        </button>
                    </div>
                `);

                // Click to show sidebar
                marker.on('click', () => {
                    showMapSidebar(store);
                });

                // Add delivery radius circle
                if (isActive) {
                    const radiusValue = parseInt(store.deliveryRadius) || 375;
                    L.circle([store.lat, store.lng], {
                        radius: radiusValue,
                        color: '#ff990044',
                        fillColor: '#ff990011',
                        fillOpacity: 0.1,
                        weight: 1
                    }).addTo(state.maps.main);
                }

                state.markers.push(marker);
            }
        });
    }

    function showMapSidebar(store) {
        const sidebar = document.getElementById('map-sidebar');
        const content = document.getElementById('map-sidebar-content');
        
        const sw1 = store.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
        
        content.innerHTML = `
            <div class="map-store-detail">
                <div class="map-store-header">
                    <span class="status-badge ${store.status === 'Store Active' ? 'active' : 'inactive'}">
                        ${store.status === 'Store Active' ? 'نشط' : 'غير نشط'}
                    </span>
                </div>
                <h3 class="map-store-name">${store.storeName}</h3>
                <div class="map-store-id">ID: ${store.storeId}</div>
                
                <div class="map-detail-section">
                    <div class="map-detail-row">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${store.city}, ${store.state}</span>
                    </div>
                    <div class="map-detail-row">
                        <i class="fas fa-bullseye"></i>
                        <span>نطاق التوصيل: ${store.deliveryRadius}</span>
                    </div>
                    <div class="map-detail-row">
                        <i class="fas fa-location-dot"></i>
                        <span>Lat: ${store.lat.toFixed(6)}</span>
                    </div>
                    <div class="map-detail-row">
                        <i class="fas fa-location-dot"></i>
                        <span>Lng: ${store.lng.toFixed(6)}</span>
                    </div>
                    <div class="map-detail-row">
                        <i class="fas fa-box"></i>
                        <span>السعة: ${sw1 ? sw1.maxCapacity : '-'}</span>
                    </div>
                    <div class="map-detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(store.activationDate)}</span>
                    </div>
                    ${store.email ? `<div class="map-detail-row">
                        <i class="fas fa-envelope"></i>
                        <span style="font-size:0.75rem">${store.email}</span>
                    </div>` : ''}
                    <div class="map-detail-row">
                        <i class="fas fa-clock"></i>
                        <span>${formatOperatingDays(store.operatingDays)}</span>
                    </div>
                </div>
                
                <div class="map-detail-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.app.showStoreDetail('${store.storeId}')">
                        <i class="fas fa-eye"></i> عرض التفاصيل الكاملة
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="window.app.editStore('${store.storeId}')">
                        <i class="fas fa-pen"></i> تعديل
                    </button>
                </div>
            </div>
        `;
        
        sidebar.classList.add('open');
    }

    // ===== Store Detail Modal =====
    function showStoreDetail(storeId) {
        const store = state.stores.find(s => s.storeId === storeId);
        if (!store) return;

        document.getElementById('modal-store-name').textContent = store.storeName;
        
        const rating = getStoreRating(store);
        const phoneDisplay = store.phone || 'غير مسجل';
        const due = store.dueAmount || 0;
        let dueDisplay = '';
        if (due > 0) {
            dueDisplay = `<span style="color:var(--danger);font-family:Inter;font-weight:600">${due.toLocaleString('en-US')} ج.م</span>`;
        } else if (due < 0) {
            dueDisplay = `<span style="color:var(--success);font-family:Inter;font-weight:600">${Math.abs(due).toLocaleString('en-US')} ج.م (دائن)</span>`;
        } else {
            dueDisplay = '0 ج.م';
        }
        
        const cod = store.totalCod || 0;
        const codDisplay = `<span style="font-family:Inter;font-weight:600">${cod.toLocaleString('en-US')} ج.م</span>`;

        document.getElementById('detail-info-grid').innerHTML = `
            <div class="detail-item">
                <span class="detail-label">Store ID</span>
                <span class="detail-value">${store.storeId}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">اسم المحل</span>
                <span class="detail-value">${store.storeName}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الحالة</span>
                <span class="detail-value">
                    <span class="status-badge ${store.status === 'Store Active' ? 'active' : 'inactive'}">
                        ${store.status === 'Store Active' ? 'نشط' : 'غير نشط'}
                    </span>
                </span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المدينة</span>
                <span class="detail-value">${store.city}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">رقم الهاتف</span>
                <span class="detail-value" style="font-family:Inter;font-weight:600;direction:ltr;text-align:right">${phoneDisplay}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المبالغ المستحقة (المديونية)</span>
                <span class="detail-value">${dueDisplay}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">إجمالي الكاش COD</span>
                <span class="detail-value">${codDisplay}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">التقييم</span>
                <span class="detail-value">${renderStars(rating)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المنطقة</span>
                <span class="detail-value">${store.state}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الرمز البريدي</span>
                <span class="detail-value">${store.zipCode}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">نطاق التوصيل</span>
                <span class="detail-value">${store.deliveryRadius}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">كود المحطة</span>
                <span class="detail-value">${store.stationCode}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">أيام العمل</span>
                <span class="detail-value">${formatOperatingDays(store.operatingDays)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">تاريخ التفعيل</span>
                <span class="detail-value">${formatDate(store.activationDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الإحداثيات</span>
                <span class="detail-value coordinates">${store.lat.toFixed(6)}, ${store.lng.toFixed(6)}</span>
            </div>
            <div class="detail-item full-width">
                <span class="detail-label">Address ID</span>
                <span class="detail-value small-text">${store.addressId}</span>
            </div>
            ${store.email ? `
            <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني</span>
                <span class="detail-value">${store.email}</span>
            </div>` : ''}
        `;

        // Schedule tab
        renderDetailSchedule(store);

        // Location tab - will init map when tab is clicked
        state.editingStoreId = storeId;
        
        // Set up edit button
        document.getElementById('edit-from-detail-btn').onclick = () => {
            closeModal('store-detail-modal');
            editStore(storeId);
        };

        openModal('store-detail-modal');
    }

    function renderDetailSchedule(store) {
        const container = document.getElementById('detail-schedule');
        
        let html = `<table class="schedule-detail-table">
            <thead>
                <tr>
                    <th>اليوم</th>
                    <th>النافذة</th>
                    <th>أقصى سعة</th>
                    <th>التغطية</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>`;

        dayOrder.forEach(day => {
            const daySchedules = store.schedule.filter(s => s.dayOfWeek === day);
            daySchedules.forEach((sch, idx) => {
                html += `
                    <tr>
                        ${idx === 0 ? `<td rowspan="${daySchedules.length}" class="day-cell">${dayTranslations[day]}</td>` : ''}
                        <td><span class="sw-badge ${sch.supplyWindow}">${sch.supplyWindow}</span></td>
                        <td>${sch.maxCapacity}</td>
                        <td>${sch.coverage}</td>
                        <td>
                            <span class="sw-status ${sch.swStatus === 'ENABLED' ? 'enabled' : 'disabled'}">
                                ${sch.swStatus === 'ENABLED' ? 'مفعل' : 'معطل'}
                            </span>
                        </td>
                    </tr>`;
            });
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // ===== Edit Store =====
    function editStore(storeId) {
        const store = state.stores.find(s => s.storeId === storeId);
        if (!store) return;

        state.editingStoreId = storeId;
        document.getElementById('edit-modal-title').textContent = `تعديل: ${store.storeName}`;
        
        document.getElementById('edit-store-id').value = store.storeId;
        document.getElementById('edit-store-name').value = store.storeName;
        document.getElementById('edit-status').value = store.status;
        document.getElementById('edit-city').value = store.city;
        document.getElementById('edit-state').value = store.state;
        document.getElementById('edit-zipcode').value = store.zipCode;
        document.getElementById('edit-lat').value = store.lat;
        document.getElementById('edit-lng').value = store.lng;
        document.getElementById('edit-radius').value = store.deliveryRadius;
        document.getElementById('edit-station').value = store.stationCode;
        
        // Set email if exists
        const emailField = document.getElementById('edit-email');
        if (emailField) emailField.value = store.email || '';

        // Set phone if exists
        const phoneField = document.getElementById('edit-phone');
        if (phoneField) phoneField.value = store.phone || '';

        // Set due if exists
        const dueField = document.getElementById('edit-due');
        if (dueField) dueField.value = store.dueAmount || 0;

        // Set rating if exists
        const ratingField = document.getElementById('edit-rating');
        if (ratingField) ratingField.value = getStoreRating(store);
        
        const sw1 = store.schedule.find(s => s.dayOfWeek === 'MONDAY' && s.supplyWindow === 'SW1');
        document.getElementById('edit-max-capacity').value = sw1 ? sw1.maxCapacity : '';
        document.getElementById('edit-coverage').value = sw1 ? sw1.coverage : '';

        // Set operating days checkboxes
        const days = store.operatingDays.split(' ');
        const checkboxes = document.querySelectorAll('#edit-days-checkboxes input[type="checkbox"]');
        const dayMap = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        checkboxes.forEach((cb, i) => {
            cb.checked = days[i] !== '_';
        });

        openModal('edit-store-modal');
        
        // Init edit map
        setTimeout(() => initEditMap(store.lat, store.lng), 300);
    }

    function addNewStore() {
        state.editingStoreId = null;
        document.getElementById('edit-modal-title').textContent = 'إضافة محل جديد';
        document.getElementById('store-form').reset();
        document.getElementById('edit-station').value = 'DEX5';
        document.getElementById('edit-state').value = 'Al Iskandarīyah';
        document.getElementById('edit-zipcode').value = '00000';
        
        openModal('edit-store-modal');
        setTimeout(() => initEditMap(31.22, 29.95), 300);
    }

    function saveStore() {
        const storeData = {
            storeId: document.getElementById('edit-store-id').value,
            storeName: document.getElementById('edit-store-name').value,
            status: document.getElementById('edit-status').value,
            city: document.getElementById('edit-city').value,
            state: document.getElementById('edit-state').value,
            zipCode: document.getElementById('edit-zipcode').value,
            lat: parseFloat(document.getElementById('edit-lat').value),
            lng: parseFloat(document.getElementById('edit-lng').value),
            deliveryRadius: document.getElementById('edit-radius').value,
            stationCode: document.getElementById('edit-station').value,
            addressId: '',
            operatingDays: '',
            activationDate: new Date().toUTCString(),
            terminalReason: '',
            schedule: [],
            email: (document.getElementById('edit-email') ? document.getElementById('edit-email').value : '') || '',
            phone: (document.getElementById('edit-phone') ? document.getElementById('edit-phone').value : '') || '',
            dueAmount: parseFloat(document.getElementById('edit-due') ? document.getElementById('edit-due').value : 0) || 0,
            rating: parseFloat(document.getElementById('edit-rating') ? document.getElementById('edit-rating').value : 4.5) || 4.5
        };

        // Build operating days
        const checkboxes = document.querySelectorAll('#edit-days-checkboxes input[type="checkbox"]');
        const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        storeData.operatingDays = dayLetters.map((letter, i) => checkboxes[i].checked ? letter : '_').join(' ');

        // Build schedule
        const maxCap = parseInt(document.getElementById('edit-max-capacity').value) || 0;
        const coverage = parseInt(document.getElementById('edit-coverage').value) || 450;
        
        dayOrder.forEach(day => {
            ['SW1', 'SW2'].forEach(sw => {
                storeData.schedule.push({
                    dayOfWeek: day,
                    supplyWindow: sw,
                    maxCapacity: sw === 'SW1' ? maxCap : 0,
                    coverage: coverage,
                    swStatus: sw === 'SW1' ? 'ENABLED' : 'DISABLED',
                    preferredCapacity: 0,
                    relaxedCoverage: 0,
                    preferredStatus: 'DISABLED'
                });
            });
        });

        // Validate
        if (!storeData.storeId || !storeData.storeName) {
            showToast('خطأ', 'error', 'يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (state.editingStoreId) {
            // Update existing
            const idx = state.stores.findIndex(s => s.storeId === state.editingStoreId);
            if (idx !== -1) {
                state.stores[idx] = { ...state.stores[idx], ...storeData };
                showToast('تم التعديل', 'success', `تم تعديل محل ${storeData.storeName} بنجاح`);
            }
        } else {
            // Check duplicate
            if (state.stores.find(s => s.storeId === storeData.storeId)) {
                showToast('خطأ', 'error', 'رقم المحل موجود بالفعل');
                return;
            }
            state.stores.push(storeData);
            showToast('تم الإضافة', 'success', `تم إضافة محل ${storeData.storeName} بنجاح`);
        }

        closeModal('edit-store-modal');
        state.filteredStores = [...state.stores];
        syncStoresWithCloud();
        renderStoresTable();
        initDashboard();
        
        // Refresh maps
        if (state.maps.main) {
            addMainMapMarkers(state.mapFilter);
        }
    }

    function initEditMap(lat, lng) {
        // Coordinate fallback if invalid or NaN
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            lat = 31.22;
            lng = 29.95;
        }

        if (state.maps.edit) {
            state.maps.edit.remove();
        }

        const map = L.map('edit-map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        let marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        marker.on('dragend', function() {
            const pos = marker.getLatLng();
            document.getElementById('edit-lat').value = pos.lat.toFixed(8);
            document.getElementById('edit-lng').value = pos.lng.toFixed(8);
        });

        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            document.getElementById('edit-lat').value = e.latlng.lat.toFixed(8);
            document.getElementById('edit-lng').value = e.latlng.lng.toFixed(8);
        });

        state.maps.edit = map;
    }

    // ===== Delete Store =====
    function confirmDelete(storeId) {
        const store = state.stores.find(s => s.storeId === storeId);
        if (!store) return;

        state.editingStoreId = storeId;
        document.getElementById('delete-store-name').textContent = store.storeName;
        openModal('delete-modal');
    }

    function deleteStore() {
        if (!state.editingStoreId) return;
        
        const store = state.stores.find(s => s.storeId === state.editingStoreId);
        state.stores = state.stores.filter(s => s.storeId !== state.editingStoreId);
        state.filteredStores = [...state.stores];
        
        closeModal('delete-modal');
        syncStoresWithCloud();
        renderStoresTable();
        initDashboard();
        
        if (state.maps.main) {
            addMainMapMarkers(state.mapFilter);
        }
        
        showToast('تم الحذف', 'warning', `تم حذف محل ${store.storeName}`);
    }

    // ===== Locate Store on Map =====
    function locateStore(storeId) {
        const store = state.stores.find(s => s.storeId === storeId);
        if (!store || !store.lat || !store.lng) return;

        navigateTo('map');
        
        setTimeout(() => {
            if (state.maps.main) {
                state.maps.main.setView([store.lat, store.lng], 17);
                showMapSidebar(store);
            }
        }, 500);
    }

    // ===== Analytics =====
    function renderAnalytics() {
        renderCityChart();
        renderActivationChart();
        renderCapacityBars();
        renderDayHeatmap();
    }

    function renderCityChart() {
        const canvas = document.getElementById('city-chart');
        const ctx = canvas.getContext('2d');
        
        const cityCounts = {};
        state.stores.forEach(s => {
            const city = s.city.toLowerCase();
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        });

        const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
        const maxVal = sortedCities[0] ? sortedCities[0][1] : 1;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barHeight = 25;
        const gap = 8;
        const startX = 150;
        const maxBarWidth = canvas.width - startX - 50;

        sortedCities.forEach(([city, count], i) => {
            const y = i * (barHeight + gap) + 10;
            const barWidth = (count / maxVal) * maxBarWidth;

            // Bar
            const grad = ctx.createLinearGradient(startX, y, startX + barWidth, y);
            grad.addColorStop(0, '#ff9900');
            grad.addColorStop(1, '#ff6600');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(startX, y, barWidth, barHeight, 4);
            ctx.fill();

            // Label
            ctx.fillStyle = '#2d3748';
            ctx.font = '12px Tajawal, Inter';
            ctx.textAlign = 'right';
            ctx.fillText(city, startX - 10, y + barHeight / 2 + 4);

            // Value
            ctx.fillStyle = '#2d3748';
            ctx.textAlign = 'left';
            ctx.fillText(count, startX + barWidth + 8, y + barHeight / 2 + 4);
        });
    }

    function renderActivationChart() {
        const canvas = document.getElementById('activation-chart');
        const ctx = canvas.getContext('2d');
        
        // Group by month
        const monthCounts = {};
        state.stores.forEach(s => {
            if (s.activationDate && s.activationDate !== 'NA') {
                const date = new Date(s.activationDate);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthCounts[key] = (monthCounts[key] || 0) + 1;
            }
        });

        const months = Object.keys(monthCounts).sort();
        const values = months.map(m => monthCounts[m]);
        
        if (months.length === 0) return;
        
        const maxVal = Math.max(...values);
        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        
        const points = months.map((_, i) => ({
            x: padding.left + (i / (months.length - 1 || 1)) * chartWidth,
            y: padding.top + chartHeight - (values[i] / maxVal) * chartHeight
        }));

        // Area fill
        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        areaGrad.addColorStop(0, 'rgba(255,153,0,0.3)');
        areaGrad.addColorStop(1, 'rgba(255,153,0,0)');
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Points
        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff9900';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            if (i % Math.ceil(months.length / 8) === 0) {
                ctx.fillStyle = '#718096';
                ctx.font = '9px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(months[i], p.x, padding.top + chartHeight + 15);
            }
        });
    }

    function renderCapacityBars() {
        const container = document.getElementById('capacity-bars');
        const activeStores = state.stores
            .filter(s => s.status === 'Store Active')
            .map(s => {
                const sw1 = s.schedule.find(sch => sch.dayOfWeek === 'MONDAY' && sch.supplyWindow === 'SW1');
                return { name: s.storeName, capacity: sw1 ? sw1.maxCapacity : 0, id: s.storeId };
            })
            .sort((a, b) => b.capacity - a.capacity)
            .slice(0, 15);

        const maxCap = activeStores[0] ? activeStores[0].capacity : 1;

        container.innerHTML = activeStores.map(store => `
            <div class="capacity-bar-item">
                <div class="capacity-bar-label">${store.name}</div>
                <div class="capacity-bar-track">
                    <div class="capacity-bar-fill" style="width: ${(store.capacity / maxCap) * 100}%">
                        <span class="capacity-bar-value">${store.capacity}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderDayHeatmap() {
        const container = document.getElementById('day-heatmap');
        
        // Count how many stores operate on each day
        const dayCounts = {};
        dayOrder.forEach(day => dayCounts[day] = 0);
        
        state.stores.filter(s => s.status === 'Store Active').forEach(store => {
            const days = store.operatingDays.split(' ');
            const dayMap = { 0: 'MONDAY', 1: 'TUESDAY', 2: 'WEDNESDAY', 3: 'THURSDAY', 4: 'FRIDAY', 5: 'SATURDAY', 6: 'SUNDAY' };
            days.forEach((d, i) => {
                if (d !== '_') {
                    dayCounts[dayMap[i]]++;
                }
            });
        });

        const maxCount = Math.max(...Object.values(dayCounts));

        container.innerHTML = `
            <div class="heatmap-grid">
                ${dayOrder.map(day => {
                    const intensity = dayCounts[day] / maxCount;
                    const color = `rgba(255, 153, 0, ${0.2 + intensity * 0.8})`;
                    return `
                        <div class="heatmap-cell" style="background-color: ${color}">
                            <span class="heatmap-day">${dayTranslations[day]}</span>
                            <span class="heatmap-count">${dayCounts[day]}</span>
                            <span class="heatmap-label">محل</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
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
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19
                    }).addTo(map);
                    L.marker([store.lat, store.lng]).addTo(map);
                    
                    const radiusValue = parseInt(store.deliveryRadius) || 375;
                    L.circle([store.lat, store.lng], {
                        radius: radiusValue,
                        color: '#ff9900',
                        fillColor: '#ff990033',
                        fillOpacity: 0.2,
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
        const session = localStorage.getItem('ammar_session');
        const lockScreen = document.getElementById('login-lock-screen');
        
        if (session && VALID_PASSWORDS.includes(session)) {
            if (lockScreen) {
                lockScreen.classList.add('fade-out');
                setTimeout(() => lockScreen.style.display = 'none', 500);
            }
            loadData();
            return;
        }

        // Hide loading screen while login screen is active
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        const submitBtn = document.getElementById('login-submit-btn');
        const passwordInput = document.getElementById('login-password');
        const errorMsg = document.getElementById('login-error-msg');

        async function attemptLogin() {
            const val = passwordInput.value.trim();
            if (!val) {
                showLoginError('الرجاء إدخال الرقم السري');
                return;
            }

            if (!VALID_PASSWORDS.includes(val)) {
                showLoginError('الرقم السري غير صحيح! يرجى المحاولة مرة أخرى.');
                return;
            }

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: val })
                });

                if (res.ok) {
                    localStorage.setItem('ammar_session', val);
                    unlockApp();
                } else {
                    const data = await res.json();
                    showLoginError(data.message || 'تم استخدام هذا الرقم السري من قبل مستخدم آخر.');
                }
            } catch (err) {
                console.warn('Vercel API login failed, using localStorage fallback:', err);
                const localUsed = JSON.parse(localStorage.getItem('ammar_used_passwords') || '[]');
                if (localUsed.includes(val)) {
                    showLoginError('عذراً، هذا الرقم السري تم استخدامه من قبل جهاز آخر ولا يمكن استخدامه مجدداً.');
                } else {
                    localUsed.push(val);
                    localStorage.setItem('ammar_used_passwords', JSON.stringify(localUsed));
                    localStorage.setItem('ammar_session', val);
                    unlockApp();
                }
            }
        }

        function showLoginError(msg) {
            if (errorMsg) {
                errorMsg.textContent = msg;
                errorMsg.style.display = 'block';
            }
        }

        function unlockApp() {
            if (lockScreen) {
                lockScreen.classList.add('fade-out');
                setTimeout(() => lockScreen.style.display = 'none', 500);
            }
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
                loadingScreen.classList.remove('fade-out');
            }
            loadData();
        }

        if (submitBtn) {
            submitBtn.onclick = attemptLogin;
        }
        if (passwordInput) {
            passwordInput.onkeydown = (e) => {
                if (e.key === 'Enter') attemptLogin();
            };
        }
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

    // ===== Init =====
    function init() {
        initRTS();
        updateDateTime();
        setInterval(updateDateTime, 1000);
        initEventListeners();
        checkAuth();
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
