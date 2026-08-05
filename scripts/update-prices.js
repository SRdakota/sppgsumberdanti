/**
 * SCRAPER SCRIPT FOR GITHUB ACTIONS
 * Fetches SISKAPERBAPO Jember price data and updates data.js / public/data.js
 */

const http = require('https');
const fs = require('fs');

function fetchSiskaperbapo() {
    return new Promise((resolve, reject) => {
        const tanggal = new Date().toISOString().split('T')[0];
        const postData = `tanggal=${encodeURIComponent(tanggal)}&kabkota=jemberkab&pasar=`;

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
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(data);
                else reject(new Error(`Status ${res.statusCode}`));
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        req.write(postData);
        req.end();
    });
}

function parsePrice(text) {
    if (!text || text === '-' || text === '') return 0;
    const cleaned = text.replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
}

async function run() {
    try {
        console.log('Fetching SISKAPERBAPO data for Jember...');
        const html = await fetchSiskaperbapo();
        const root = require('node-html-parser').parse(html);
        const rows = root.querySelectorAll('tr');

        let currentKategori = '';
        let list = [];
        let id = 1;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 7) return;

            const no = cells[0].text.trim();
            const namaRaw = cells[1].text.trim();
            const namaClean = namaRaw.replace(/^-\s*/, '').trim();
            const satuan = cells[2].text.trim();
            const hkText = cells[3].text.trim();
            const hsText = cells[4].text.trim();

            const hk = parsePrice(hkText);
            const hs = parsePrice(hsText);

            if (no && !satuan && hk === 0 && hs === 0) {
                currentKategori = namaClean;
                return;
            }

            if (satuan) {
                list.push({
                    id: id++,
                    kategori: currentKategori || 'LAINNYA',
                    nama: namaClean,
                    satuan: satuan,
                    bapokting: hs > 0 ? hs : null,
                    pasar: hs > 0 ? hs : null,
                    swalayan: null,
                    online: null,
                    het: null,
                    siskaperbapoNama: namaClean
                });
            }
        });

        if (list.length === 0) {
            console.log('No commodities extracted, skipping file update.');
            return;
        }

        const fileContent = `/**\n * DATA HARGA AUTOMATED SISKAPERBAPO (${list.length} ITEMS)\n * Updated at: ${new Date().toISOString()}\n */\n\nconst dataKomoditas = ` + JSON.stringify(list, null, 2) + `;\n`;

        fs.writeFileSync('js/data.js', fileContent);
        if (fs.existsSync('public/js')) {
            fs.writeFileSync('public/js/data.js', fileContent);
        }
        console.log(`Successfully updated js/data.js and public/js/data.js with ${list.length} items!`);

    } catch (err) {
        console.error('Error during price update:', err.message);
        process.exit(1);
    }
}

run();
