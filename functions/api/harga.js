/**
 * CLOUDFLARE PAGES FUNCTION: /api/harga
 * Runs on Cloudflare's edge network, bypassing SISKAPERBAPO 403 WAF blocks.
 */

export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const kabkota = searchParams.get('kabkota') || 'jemberkab';
    const tanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];

    try {
        const postData = new URLSearchParams();
        postData.append('tanggal', tanggal);
        postData.append('kabkota', kabkota);
        postData.append('pasar', '');

        const response = await fetch('https://siskaperbapo.jatimprov.go.id/harga/tabel.nodesign', {
            method: 'POST',
            headers: {
                'Host': 'siskaperbapo.jatimprov.go.id',
                'Origin': 'https://siskaperbapo.jatimprov.go.id',
                'Referer': 'https://siskaperbapo.jatimprov.go.id/harga/tabel',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            body: postData.toString()
        });

        if (!response.ok) {
            return new Response(JSON.stringify({
                success: false,
                source: 'fallback',
                statusCode: response.status,
                error: `SISKAPERBAPO status ${response.status}`
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const html = await response.text();
        const parsedData = parseHargaTable(html);

        return new Response(JSON.stringify({
            success: true,
            source: 'live',
            provider: 'Cloudflare Pages Edge',
            ...parsedData
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=180'
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            source: 'fallback',
            error: err.message
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

function parseHargaTable(html) {
    const items = [];
    let currentKategori = '';

    // Regex parsing for Cloudflare Edge environment
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = trRegex.exec(html)) !== null) {
        const rowContent = match[1];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
            cells.push(tdMatch[1].replace(/<[^>]*>/g, '').trim());
        }

        if (cells.length < 7) continue;

        const noText = cells[0];
        const nama = cells[1].replace(/^-\s*/, '').trim();
        const satuan = cells[2];
        const hargaKemarin = parsePrice(cells[3]);
        const hargaSekarang = parsePrice(cells[4]);
        const perubahanRp = parsePrice(cells[5]);
        const perubahanPctText = cells[6].replace(/%/g, '').trim();

        const isCategoryHeader = /^\d+/.test(noText);
        if (isCategoryHeader) {
            currentKategori = nama;
            if (!satuan) continue;
        }

        if (satuan) {
            items.push({
                kategori: currentKategori || 'LAINNYA',
                nama: nama,
                satuan: satuan,
                hargaKemarin: hargaKemarin,
                hargaSekarang: hargaSekarang,
                perubahanRp: perubahanRp,
                perubahanPct: parseFloat(perubahanPctText.replace(',', '.')) || 0
            });
        }
    }

    return {
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
