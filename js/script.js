/**
 * PANTAUAN HARGA PASAR - Script
 * Kota Jember, Jawa Timur
 * 
 * Membaca data dari data.js (dataKomoditas)
 * Data di-update secara live dari SISKAPERBAPO via backend proxy.
 * Auto-refresh setiap 3 menit.
 */

// CONFIG
const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:3001' : '';
const KABKOTA = 'jemberkab';
const REFRESH_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

let lastFetchTime = null;
let isLive = false;
let refreshTimer = null;

// FORMAT HELPERS
function formatRp(value) {
    if (value === null || value === undefined || value === '') return '-';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
}

function formatTanggal(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function formatWaktu(date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// POPULATE FILTER DROPDOWNS
function populateFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const satuanFilter = document.getElementById('satuanFilter');

    if (!categoryFilter || !satuanFilter) return;

    const kategoriUnik = [...new Set(dataKomoditas.map(item => item.kategori))];
    kategoriUnik.forEach(kat => {
        const opt = document.createElement('option');
        opt.value = kat;
        opt.textContent = kat;
        categoryFilter.appendChild(opt);
    });

    const satuanUnik = [...new Set(dataKomoditas.map(item => item.satuan))];
    satuanUnik.forEach(sat => {
        const opt = document.createElement('option');
        opt.value = sat;
        opt.textContent = sat;
        satuanFilter.appendChild(opt);
    });
}

// UPDATE STATS CARDS
function updateStats(data) {
    const totalEl = document.getElementById('totalKomoditas');
    if (totalEl) totalEl.textContent = data.length;

    const kategoriUnik = [...new Set(data.map(item => item.kategori))];
    const katEl = document.getElementById('totalKategori');
    if (katEl) katEl.textContent = kategoriUnik.length;

    let maxPrice = 0;
    data.forEach(item => {
        const prices = [item.bapokting, item.pasar, item.swalayan, item.online, item.het]
            .filter(p => p !== null && p !== undefined);
        const itemMax = Math.max(...prices, 0);
        if (itemMax > maxPrice) maxPrice = itemMax;
    });
    const hargaEl = document.getElementById('hargaTertinggi');
    if (hargaEl) hargaEl.textContent = maxPrice > 0 ? formatRp(maxPrice).replace('Rp ', '') : '-';

    const totalHET = data.filter(item => item.het !== null && item.het !== undefined).length;
    const hetEl = document.getElementById('totalHET');
    if (hetEl) hetEl.textContent = totalHET;
}

// RENDER TABLE
function renderTable(data) {
    const tbody = document.getElementById('priceTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="9" style="text-align:center; padding:40px; color:var(--slate-400);">Data tidak ditemukan.</td>';
        tbody.appendChild(tr);
        return;
    }

    const sorted = [...data].sort((a, b) => a.kategori.localeCompare(b.kategori) || a.id - b.id);

    const categoryCounts = {};
    sorted.forEach(item => {
        categoryCounts[item.kategori] = (categoryCounts[item.kategori] || 0) + 1;
    });

    let currentCategory = null;

    sorted.forEach((item, index) => {
        const isFirstInCategory = item.kategori !== currentCategory;
        if (isFirstInCategory) currentCategory = item.kategori;

        const tr = document.createElement('tr');

        let rowWarning = '';
        if (item.het !== null && item.pasar !== null && item.pasar > item.het) {
            rowWarning = 'background: var(--rose-50);';
        }
        tr.setAttribute('style', `animation-delay: ${index * 30}ms; ${rowWarning}`);

        let categoryCell = '';
        if (isFirstInCategory) {
            const rowSpan = categoryCounts[item.kategori];
            categoryCell = `<td class="kategori-cell" rowspan="${rowSpan}">
                <span class="kategori-badge">${item.kategori}</span>
            </td>`;
        }

        let bapoktingContent;
        if (item.bapokting !== null && item.bapokting !== undefined) {
            const liveClass = isLive ? 'bapokting-live' : '';
            bapoktingContent = `<span class="${liveClass}">${formatRp(item.bapokting)}</span>`;
        } else {
            bapoktingContent = `<span class="price-na">menunggu...</span>`;
        }

        let hetClass = '';
        let hetValue = formatRp(item.het);
        if (item.het === null || item.het === undefined) {
            hetClass = 'price-na';
            hetValue = '-';
        }

        tr.innerHTML = `
            <td style="color: var(--slate-400); font-size: 0.82rem; text-align:center;">${index + 1}</td>
            ${categoryCell}
            <td class="commodity-name">${item.nama}</td>
            <td style="color: var(--slate-500); text-align:center;">/ ${item.satuan}</td>
            <td class="price-value bapokting-cell">${bapoktingContent}</td>
            <td class="price-value">${formatRp(item.pasar)}</td>
            <td class="price-value">${formatRp(item.swalayan)}</td>
            <td class="price-value">${formatRp(item.online)}</td>
            <td class="price-value het-value ${hetClass}">${hetValue}</td>
        `;
        tbody.appendChild(tr);
    });

    updateStats(data);
}

// FETCH LIVE DATA
async function fetchBapokting() {
    const statusEl = document.getElementById('liveStatus');
    const statusTextEl = document.getElementById('liveStatusText');
    const lastUpdateEl = document.getElementById('lastUpdateTime');

    try {
        if (statusEl) statusEl.className = 'live-status loading';
        if (statusTextEl) statusTextEl.textContent = 'Mengambil data...';

        const tanggal = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE}/api/harga?kabkota=${KABKOTA}&tanggal=${tanggal}`);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Unknown error');

        let matchCount = 0;
        dataKomoditas.forEach(item => {
            if (!item.siskaperbapoNama) return;

            const match = result.items.find(siska => {
                return siska.nama.toLowerCase().includes(item.siskaperbapoNama.toLowerCase()) ||
                       item.siskaperbapoNama.toLowerCase().includes(siska.nama.toLowerCase());
            });

            if (match && match.hargaSekarang > 0) {
                item.bapokting = match.hargaSekarang;
                item.pasar = match.hargaSekarang;
                matchCount++;
            }
        });

        isLive = true;
        lastFetchTime = new Date();
        if (statusEl) statusEl.className = 'live-status online';
        if (statusTextEl) {
            const sourceLabel = result.source === 'cache' ? 'Cache' : 'Live';
            statusTextEl.textContent = `${sourceLabel} — ${matchCount} komoditas terhubung`;
        }
        if (lastUpdateEl) lastUpdateEl.textContent = `Update: ${formatWaktu(lastFetchTime)}`;

        const pasarInfoEl = document.getElementById('pasarInfo');
        if (pasarInfoEl && result.pasar) {
            pasarInfoEl.textContent = `Pasar: ${result.pasar}`;
            pasarInfoEl.style.display = 'block';
        }

        console.log(`[${formatWaktu(new Date())}] Bapokting updated: ${matchCount} items matched (source: ${result.source})`);

    } catch (error) {
        isLive = false;
        if (statusEl) statusEl.className = 'live-status offline';
        if (statusTextEl) statusTextEl.textContent = 'Offline — data terstruktur';
        if (lastUpdateEl) lastUpdateEl.textContent = 'Data Terstruktur';

        console.warn(`[${formatWaktu(new Date())}] Failed to fetch Bapokting:`, error.message);
    }

    filterData();
}

// SEARCH & FILTER
function filterData() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const satuan = document.getElementById('satuanFilter')?.value || 'all';

    const filtered = dataKomoditas.filter(item => {
        const matchSearch = item.nama.toLowerCase().includes(searchTerm);
        const matchCategory = category === 'all' || item.kategori === category;
        const matchSatuan = satuan === 'all' || item.satuan === satuan;
        return matchSearch && matchCategory && matchSatuan;
    });

    renderTable(filtered);
}

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const tableDateEl = document.getElementById('tableDate');
    if (dateEl) dateEl.textContent = formatTanggal(now);
    if (tableDateEl) tableDateEl.textContent = `Data per: ${formatTanggal(now)}`;

    populateFilters();
    renderTable(dataKomoditas);

    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const satuanFilter = document.getElementById('satuanFilter');
    if (searchInput) searchInput.addEventListener('input', filterData);
    if (categoryFilter) categoryFilter.addEventListener('change', filterData);
    if (satuanFilter) satuanFilter.addEventListener('change', filterData);

    fetchBapokting();
    refreshTimer = setInterval(fetchBapokting, REFRESH_INTERVAL_MS);

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchBapokting();
        });
    }
});
