const express = require('express');
const cors = require('cors');
const { parse } = require('node-html-parser');
const http = require('https');

const app = express();

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
// FETCH FROM SISKAPERBAPO WITH DETAILED LOGS
// ==========================================
function fetchFromSiskaperbapoWithLog(kabkota, tanggal) {
    return new Promise((resolve) => {
        const logSteps = [];
        const startTime = Date.now();

        logSteps.push(`[${new Date().toISOString()}] Initiating fetch for kabkota=${kabkota}, tanggal=${tanggal}`);

        const postData = `tanggal=${encodeURIComponent(tanggal)}&kabkota=${encodeURIComponent(kabkota)}&pasar=`;
        logSteps.push(`[Payload] ${postData}`);

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

        logSteps.push(`[Headers Sent] Host: siskaperbapo.jatimprov.go.id, User-Agent: Chrome/122.0`);

        const req = http.request(options, (res) => {
            logSteps.push(`[Response Received] Status: ${res.statusCode} ${res.statusMessage}`);
            logSteps.push(`[Response Headers] Server: ${res.headers['server'] || 'N/A'}, Cloudflare-Ray: ${res.headers['cf-ray'] || 'N/A'}`);

            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                logSteps.push(`[Duration] ${duration}ms, Response size: ${data.length} bytes`);

                if (res.statusCode === 200) {
                    resolve({
                        success: true,
                        statusCode: 200,
                        html: data,
                        logs: logSteps
                    });
                } else {
                    logSteps.push(`[Reason] Server SISKAPERBAPO returned HTTP ${res.statusCode}. Cloudflare WAF/Geo-blocking active on hosting datacenter IP.`);
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: `SISKAPERBAPO responded with status ${res.statusCode}`,
                        logs: logSteps
                    });
                }
            });
        });

        req.on('error', (err) => {
            logSteps.push(`[Network Error] ${err.message}`);
            resolve({
                success: false,
                statusCode: 0,
                error: err.message,
                logs: logSteps
            });
        });

        req.setTimeout(15000, () => {
            req.destroy();
            logSteps.push(`[Timeout] Request to SISKAPERBAPO timed out after 15s`);
            resolve({
                success: false,
                statusCode: 408,
                error: 'Request to SISKAPERBAPO timed out',
                logs: logSteps
            });
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

        const nama = namaRaw.replace(/^-\s*/, '').trim();
        const hargaKemarin = parsePrice(hargaKemarinText);
        const hargaSekarang = parsePrice(hargaSekarangText);
        const perubahanRp = parsePrice(perubahanRpText);

        const span = cells[1].querySelector('[data-commodity-id]');
        const commodityId = span ? span.getAttribute('data-commodity-id') : null;

        if (noText && !satuan && hargaKemarin === 0 && hargaSekarang === 0) {
            currentKategori = nama;
            nomor++;
            continue;
        }

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
    const cleaned = text.replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
}

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/harga', async (req, res) => {
    try {
        const kabkota = req.query.kabkota || 'jemberkab';
        const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];

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

        const fetchResult = await fetchFromSiskaperbapoWithLog(kabkota, tanggal);

        if (fetchResult.success) {
            const data = parseHargaTable(fetchResult.html);
            setCache(cacheKey, data);

            res.json({
                success: true,
                source: 'live',
                debugLogs: fetchResult.logs,
                ...data
            });
        } else {
            res.json({
                success: false,
                source: 'fallback',
                error: fetchResult.error,
                statusCode: fetchResult.statusCode,
                debugLogs: fetchResult.logs,
                serverInfo: {
                    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    timestamp: new Date().toISOString(),
                    reason: 'Cloudflare WAF / Geo-blocking pada Datacenter IP'
                }
            });
        }

    } catch (error) {
        res.json({
            success: false,
            source: 'fallback',
            error: error.message,
            debugLogs: [`[Fatal Error] ${error.message}`]
        });
    }
});

// DEBUG ENDPOINT FOR LIVE INSPECTION
app.get('/api/debug', async (req, res) => {
    const kabkota = req.query.kabkota || 'jemberkab';
    const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
    const result = await fetchFromSiskaperbapoWithLog(kabkota, tanggal);
    res.json({
        timestamp: new Date().toISOString(),
        serverNodeVersion: process.version,
        targetUrl: 'https://siskaperbapo.jatimprov.go.id/harga/tabel.nodesign/',
        ...result
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        cacheEntries: Object.keys(cache).length,
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
