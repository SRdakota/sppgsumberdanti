/**
 * DATA HARGA KOMODITAS PASAR
 * Kota Jember - Jawa Timur
 * 
 * Struktur: kategori, nama, satuan, bapokting, pasar, swalayan, online, het
 * Sumber referensi: SISKAPERBAPO Jatim
 * 
 * Field `siskaperbapoNama` digunakan untuk mencocokkan data dari SISKAPERBAPO.
 * Kolom `bapokting` akan di-update secara otomatis dari SISKAPERBAPO (hargaSekarang).
 */

const dataKomoditas = [
  { id: 1, kategori: 'MAKANAN POKOK', nama: 'Beras Medium', satuan: 'kg', bapokting: null, pasar: 11000, swalayan: 11500, online: 12000, het: 10900, siskaperbapoNama: 'Beras Medium' },
  { id: 2, kategori: 'MAKANAN POKOK', nama: 'Beras Premium', satuan: 'kg', bapokting: null, pasar: 14000, swalayan: 14500, online: 14500, het: 13900, siskaperbapoNama: 'Beras Premium' },
  { id: 3, kategori: 'MAKANAN POKOK', nama: 'Jagung Pipil', satuan: 'kg', bapokting: null, pasar: 8500, swalayan: null, online: 9000, het: null, siskaperbapoNama: 'Jagung Pipilan Kering' },
  { id: 4, kategori: 'MAKANAN POKOK', nama: 'Mi Kering', satuan: 'bks', bapokting: null, pasar: 3200, swalayan: 3500, online: 3500, het: null, siskaperbapoNama: 'Mi Kering Instant' },
  { id: 5, kategori: 'LAUK HEWANI', nama: 'Daging Ayam Ras', satuan: 'kg', bapokting: null, pasar: 38000, swalayan: 40000, online: 39000, het: 36750, siskaperbapoNama: 'Daging Ayam Ras' },
  { id: 6, kategori: 'LAUK HEWANI', nama: 'Telur Ayam Ras', satuan: 'kg', bapokting: null, pasar: 29000, swalayan: 30000, online: 29500, het: 27000, siskaperbapoNama: 'Telur Ayam Ras' },
  { id: 7, kategori: 'LAUK HEWANI', nama: 'Daging Sapi', satuan: 'kg', bapokting: null, pasar: 135000, swalayan: 145000, online: 140000, het: 140000, siskaperbapoNama: 'Daging Sapi Paha Belakang' },
  { id: 8, kategori: 'LAUK HEWANI', nama: 'Ikan Lele', satuan: 'kg', bapokting: null, pasar: 26000, swalayan: 28000, online: null, het: null, siskaperbapoNama: 'Ikan Lele' },
];

/**
 * Daftar kategori yang tersedia untuk filter
 */
const daftarKategori = [
  'MAKANAN POKOK',
  'LAUK HEWANI',
  'SAYUR MAYUR',
  'BUMBU DAPUR',
  'MINYAK & GULA',
];

/**
 * Daftar satuan yang tersedia
 */
const daftarSatuan = [
  'kg',
  'bks',
  'bh',
  'liter',
  'ikat',
];
