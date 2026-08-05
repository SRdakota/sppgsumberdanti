/**
 * BACKEND PROXY SERVER
 * Pantauan Harga Pasar - Kota Jember
 * 
 * Mengambil data harga dari SISKAPERBAPO Jatim via endpoint internal,
 * mem-parse HTML response menjadi JSON, dan menyajikan via REST API.
 * 
 * Endpoint: GET /api/harga?kabkota=jemberkab&tanggal=2026-08-05
 * 
 * Cache: Data di-cache selama 3 menit.
 */

const express = require('express');
const cors = require('cors');
const { parse } = require('node-html-parser');
const http = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors());

// ==========================================
// CACHE
// ==========================================
const cache = {};
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

function getCacheKey(kabkota, tanggal) {
    return `${kabkota}_${tanggal}`;
}

function getCached(key) {
    const entry = cache[key];
    if (entry && (Date.now() - entry.timestamp) < CACHE_DURATION_MS) {
        return entry.data;
    }
    return null;
}

function setCache(key, data) {
    cache[key] = {
        data: data,
        timestamp: Date.now()
    };
}

// ==========================================
// FETCH FROM SISKAPERBAPO
// ==========================================
function fetchFromSiskaperbapo(kabkota, tanggal) {
    return new Promise((resolve, reject) => {
        const postData = `tanggal=${encodeURIComponent(tanggal)}&kabkota=${encodeURIComponent(kabkota)}&pasar=`;

        const options = {
            hostname: 'siskaperbapo.jatimprov.go.id',
            port: 443,
            path: '/harga/tabel.nodesign/',
            method: 'POST',
            headers: {
                'Host': 'siskaperbapo.jatimprov.go.id',
                'Origin': 'https://siskaperbapo.jatimprov.go.id',
                'Referer': 'https://siskaperbapo.jatimprov.go.id/harga/tabel',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`SISKAPERBAPO responded with status ${res.statusCode}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request to SISKAPERBAPO timed out'));
        });

        req.write(postData);
        req.end();
    });
}

// ==========================================
// PARSE HTML TABLE TO JSON
// ==========================================
function parseHargaTable(html) {
    const root = parse(html);
    const rows = root.querySelectorAll('tr');
    const items = [];
    let currentKategori = '';
    let nomor = 0;

    // Extract header info
    const headerEl = root.querySelector('h3.page-header');
    const headerText = headerEl ? headerEl.text.trim() : '';
    const pasarEl = root.querySelector('.pasar');
    const pasarText = pasarEl ? pasarEl.text.replace('Pasar :', '').trim() : '';

    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 7) continue;

        const noText = cells[0].text.trim();
        const namaRaw = cells[1].text.trim();
        const satuan = cells[2].text.trim();
        const hargaKemarinText = cells[3].text.trim();
        const hargaSekarangText = cells[4].text.trim();
        const perubahanRpText = cells[5].text.trim();
        const perubahanPctText = cells[6].text.replace(/%/g, '').trim();

        // Parse name - remove leading "- "
        const nama = namaRaw.replace(/^-\s*/, '').trim();

        // Parse prices - remove dots as thousand separator
        const hargaKemarin = parsePrice(hargaKemarinText);
        const hargaSekarang = parsePrice(hargaSekarangText);
        const perubahanRp = parsePrice(perubahanRpText);

        // Get commodity-id if available
        const span = cells[1].querySelector('[data-commodity-id]');
        const commodityId = span ? span.getAttribute('data-commodity-id') : null;

        // Determine if this is a category header or item
        if (noText && !satuan && hargaKemarin === 0 && hargaSekarang === 0) {
            // This is a category header row
            currentKategori = nama;
            nomor++;
            continue;
        }

        // Skip items with zero prices (they are usually category headers without data)
        if (hargaSekarang === 0 && hargaKemarin === 0 && !commodityId) {
            if (noText) {
                currentKategori = nama;
                nomor++;
            }
            continue;
        }

        items.push({
            commodityId: commodityId,
            kategori: currentKategori,
            nama: nama,
            satuan: satuan,
            hargaKemarin: hargaKemarin,
            hargaSekarang: hargaSekarang,
            perubahanRp: perubahanRp,
            perubahanPct: parseFloat(perubahanPctText.replace(',', '.')) || 0
        });
    }

    return {
        header: headerText,
        pasar: pasarText,
        tanggalUpdate: new Date().toISOString(),
        totalItems: items.length,
        items: items
    };
}

function parsePrice(text) {
    if (!text || text === '-' || text === '') return 0;
    // Remove dots (thousand separator) and replace comma with dot for decimals
    const cleaned = text.replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
}

// ==========================================
// API ROUTES
// ==========================================

/**
 * GET /api/harga
 * Query params:
 *   - kabkota: code area (default: jemberkab)
 *   - tanggal: YYYY-MM-DD (default: today)
 */
app.get('/api/harga', async (req, res) => {
    try {
        const kabkota = req.query.kabkota || 'jemberkab';
        const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

        // Check cache first
        const cacheKey = getCacheKey(kabkota, tanggal);
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json({
                success: true,
                source: 'cache',
                cacheAge: Math.round((Date.now() - cache[cacheKey].timestamp) / 1000),
                ...cached
            });
        }

        // Fetch from SISKAPERBAPO
        console.log(`[${new Date().toLocaleTimeString()}] Fetching data for ${kabkota} on ${tanggal}...`);
        const html = await fetchFromSiskaperbapo(kabkota, tanggal);

        // Parse HTML to JSON
        const data = parseHargaTable(html);

        // Store in cache
        setCache(cacheKey, data);

        console.log(`[${new Date().toLocaleTimeString()}] Parsed ${data.totalItems} items for ${kabkota}`);

        res.json({
            success: true,
            source: 'live',
            ...data
        });

    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/status
 * Health check endpoint
 */
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        cacheEntries: Object.keys(cache).length,
        timestamp: new Date().toISOString()
    });
});

// Serve static files (frontend)
app.use(express.static('.'));

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Pantauan Harga Pasar - Backend Proxy           ║
║   Server running on http://localhost:${PORT}        ║
║                                                  ║
║   API:  http://localhost:${PORT}/api/harga          ║
║   Web:  http://localhost:${PORT}                    ║
║                                                  ║
║   Cache duration: 3 minutes                      ║
║   Source: SISKAPERBAPO Jatim                      ║
╚══════════════════════════════════════════════════╝
    `);
});
