-- ========================================================
-- DATABASE SCHEMA: PANTAUAN HARGA PASAR (SUPABASE)
-- 91 KOMODITAS PANGAN KUSTOM + AUTO MATCH SISKAPERBAPO
-- ========================================================

-- 1. HAPUS TABEL LAMA JIKA ADA
DROP TABLE IF EXISTS commodities;

-- 2. BUAT TABEL COMMODITIES
CREATE TABLE commodities (
    id SERIAL PRIMARY KEY,
    kategori VARCHAR(100) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    bapokting NUMERIC(12, 2) DEFAULT NULL,
    pasar NUMERIC(12, 2) DEFAULT NULL,
    swalayan NUMERIC(12, 2) DEFAULT NULL,
    online NUMERIC(12, 2) DEFAULT NULL,
    het NUMERIC(12, 2) DEFAULT NULL,
    siskaperbapo_nama VARCHAR(150) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AKTIFKAN RLS (PUBLIC READ ACCESS)
ALTER TABLE commodities ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read data (SELECT)
CREATE POLICY "Allow public read access" 
ON commodities FOR SELECT 
USING (true);

-- Allow service role full access (INSERT/UPDATE/DELETE)
CREATE POLICY "Allow service role all access" 
ON commodities FOR ALL 
USING (true);

-- 4. INSERT 91 BAHAN PANGAN KUSTOM
INSERT INTO commodities (kategori, nama, satuan, het, siskaperbapo_nama) VALUES

-- 🌾 MAKANAN POKOK (10 Item)
('MAKANAN POKOK', 'Beras Medium', 'kg', 12500, 'Beras Medium'),
('MAKANAN POKOK', 'Beras Premium', 'kg', 14900, 'Beras Premium'),
('MAKANAN POKOK', 'Beras Pecah', 'kg', NULL, NULL),
('MAKANAN POKOK', 'Jagung Pipil', 'kg', NULL, 'Jagung Pipilan Kering'),
('MAKANAN POKOK', 'Jagung Manis', 'kg', NULL, NULL),
('MAKANAN POKOK', 'Kentang', 'kg', NULL, 'KENTANG'),
('MAKANAN POKOK', 'Makaroni', 'kg', NULL, NULL),
('MAKANAN POKOK', 'Mi Kering', 'Bungkus', NULL, NULL),
('MAKANAN POKOK', 'Bihun', 'Bungkus', NULL, NULL),
('MAKANAN POKOK', 'Soun', 'Bungkus', NULL, NULL),

-- 🍗 LAUK HEWANI (15 Item)
('LAUK HEWANI', 'Daging Ayam Ras', 'kg', NULL, 'Daging Ayam Ras'),
('LAUK HEWANI', 'Ayam Kampung', 'ekor', NULL, 'Daging Ayam Kampung'),
('LAUK HEWANI', 'Dada Ayam Fillet', 'kg', NULL, NULL),
('LAUK HEWANI', 'Paha Ayam', 'kg', NULL, NULL),
('LAUK HEWANI', 'Telur Ayam Ras', 'kg', 27000, 'Telur Ayam Ras'),
('LAUK HEWANI', 'Telur Ayam Kampung', 'kg', NULL, 'Telur Ayam Kampung'),
('LAUK HEWANI', 'Telur Puyuh', 'kg', NULL, NULL),
('LAUK HEWANI', 'Daging Sapi', 'kg', 140000, 'Daging Sapi Paha Belakang'),
('LAUK HEWANI', 'Daging Sapi Giling', 'kg', NULL, NULL),
('LAUK HEWANI', 'Ikan Lele', 'kg', NULL, NULL),
('LAUK HEWANI', 'Ikan Nila', 'kg', NULL, NULL),
('LAUK HEWANI', 'Ikan Mujair', 'kg', NULL, NULL),
('LAUK HEWANI', 'Ikan Kembung', 'kg', NULL, 'Ikan Kembung'),
('LAUK HEWANI', 'Ikan Bandeng', 'kg', NULL, 'Ikan Bandeng'),
('LAUK HEWANI', 'Udang', 'kg', NULL, NULL),

-- 🌿 LAUK NABATI (7 Item)
('LAUK NABATI', 'Tempe', 'Papan', NULL, NULL),
('LAUK NABATI', 'Tahu Putih', 'Biji', NULL, NULL),
('LAUK NABATI', 'Kacang Hijau', 'kg', NULL, 'KACANG HIJAU'),
('LAUK NABATI', 'Kacang Merah', 'kg', NULL, NULL),
('LAUK NABATI', 'Kacang Tanah', 'kg', NULL, 'KACANG TANAH'),
('LAUK NABATI', 'Kacang Kedelai', 'kg', NULL, 'Kedelai Impor'),
('LAUK NABATI', 'Edamame', 'kg', NULL, NULL),

-- 🥦 SAYURAN (18 Item)
('SAYURAN', 'Wortel', 'kg', NULL, 'WORTEL'),
('SAYURAN', 'Buncis', 'kg', NULL, 'BUNCIS'),
('SAYURAN', 'Kol/Kubis', 'kg', NULL, 'KOL/KUBIS'),
('SAYURAN', 'Sawi Hijau', 'kg', NULL, NULL),
('SAYURAN', 'Sawi Putih', 'kg', NULL, NULL),
('SAYURAN', 'Brokoli', 'kg', NULL, NULL),
('SAYURAN', 'Kembang Kol', 'kg', NULL, NULL),
('SAYURAN', 'Labu Siam', 'kg', NULL, NULL),
('SAYURAN', 'Terong', 'kg', NULL, NULL),
('SAYURAN', 'Timun', 'kg', NULL, NULL),
('SAYURAN', 'Tomat', 'kg', NULL, 'Tomat Merah'),
('SAYURAN', 'Jagung Manis', 'kg', NULL, NULL),
('SAYURAN', 'Kacang Panjang', 'kg', NULL, NULL),
('SAYURAN', 'Gambas', 'kg', NULL, NULL),
('SAYURAN', 'Seledri', 'kg', NULL, NULL),
('SAYURAN', 'Daun Bawang', 'kg', NULL, NULL),
('SAYURAN', 'Paprika', 'kg', NULL, NULL),
('SAYURAN', 'Bawang Bombay', 'kg', NULL, NULL),

-- 🍎 BUAH-BUAHAN (9 Item)
('BUAH-BUAHAN', 'Pisang', 'Sisir', NULL, NULL),
('BUAH-BUAHAN', 'Semangka', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Melon', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Jeruk', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Apel', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Pir', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Salak', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Anggur', 'kg', NULL, NULL),
('BUAH-BUAHAN', 'Buah Naga', 'kg', NULL, NULL),

-- 🧄 BUMBU DAPUR (28 Item)
('BUMBU DAPUR', 'Bawang Merah', 'kg', NULL, 'Bawang Merah'),
('BUMBU DAPUR', 'Bawang Putih', 'kg', NULL, 'Bawang Putih Sinco/Honan'),
('BUMBU DAPUR', 'Cabai Merah Besar', 'kg', NULL, 'Cabe Merah Besar'),
('BUMBU DAPUR', 'Cabai Merah Keriting', 'kg', NULL, 'Cabe Merah Keriting'),
('BUMBU DAPUR', 'Cabai Rawit', 'kg', NULL, 'Cabe Rawit Merah'),
('BUMBU DAPUR', 'Kemiri', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Ketumbar', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Merica Bubuk', 'Bungkus', NULL, NULL),
('BUMBU DAPUR', 'Lada Butiran', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Kunyit', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Jahe', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Lengkuas', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Kencur', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Serai', 'Ikat', NULL, NULL),
('BUMBU DAPUR', 'Daun Salam', 'Ikat', NULL, NULL),
('BUMBU DAPUR', 'Daun Jeruk', 'Ikat', NULL, NULL),
('BUMBU DAPUR', 'Kayu Manis', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Cengkeh', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Pala', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Asam Jawa', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Gula Pasir', 'kg', 17500, 'Gula Kristal Putih'),
('BUMBU DAPUR', 'Gula Merah', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Garam', 'kg', NULL, NULL),
('BUMBU DAPUR', 'Kaldu Bubuk', 'Bungkus', NULL, NULL),
('BUMBU DAPUR', 'Kecap Manis', 'Botol', NULL, NULL),
('BUMBU DAPUR', 'Saus Tiram', 'Botol', NULL, NULL),
('BUMBU DAPUR', 'Kecap Asin', 'Botol', NULL, NULL),
('BUMBU DAPUR', 'Cuka', 'Botol', NULL, NULL),

-- 🧈 MINYAK DAN LEMAK (4 Item)
('MINYAK DAN LEMAK', 'Minyak Goreng Kemasan', 'liter', 15700, 'Minyak Goreng Kemasan Premium'),
('MINYAK DAN LEMAK', 'Margarin', 'Bungkus', NULL, NULL),
('MINYAK DAN LEMAK', 'Mentega', 'Bungkus', NULL, NULL),
('MINYAK DAN LEMAK', 'Minyak Wijen', 'Botol', NULL, NULL);
