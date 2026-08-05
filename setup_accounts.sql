-- ========================================================
-- TABEL ACCOUNTS & SINGLE DEVICE SESSION (SUPABASE - UUID)
-- ========================================================

-- Enable pgcrypto extension for random UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. HAPUS TABEL LAMA JIKA ADA
DROP TABLE IF EXISTS accounts;

-- 2. BUAT TABEL ACCOUNTS DENGAN UUID PRIMARY KEY
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    current_session_token TEXT DEFAULT NULL,
    last_login TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS PUBLIC SELECT & UPDATE
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select accounts" ON accounts FOR SELECT USING (true);
CREATE POLICY "Allow public update accounts" ON accounts FOR UPDATE USING (true);
CREATE POLICY "Allow service role all access accounts" ON accounts FOR ALL USING (true);

-- 4. INSERT AKUN ADMIN DEFAULT
INSERT INTO accounts (username, password, nama) VALUES
('admin', 'admin123', 'Administrator Sumberdanti');
