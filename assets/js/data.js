// Sample data for JasaQ. User-created posts are stored in localStorage and merged in.
const ICONS = {
  design: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-1.8a1.8 1.8 0 0 0-1.3 3.1A1.6 1.6 0 0 1 12 22Z"/><circle cx="7.5" cy="10.5" r="1.3"/><circle cx="12" cy="7" r="1.3"/><circle cx="16.5" cy="10.5" r="1.3"/>',
  social: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
  photo: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
  writing: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  web: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M8 14l-2 2 2 2M16 14l2 2-2 2"/>',
  admin: '<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 9v11"/>',
  translate: '<path d="M4 5h9M8.5 3v2M6 5c.5 3 2.5 6 6 8M11 5c-.5 3-2.5 6-6 8"/><path d="m13 21 4-9 4 9M14.5 18h5"/>',
};

const CATEGORIES = [
  { id: 'design', name: 'Desain Grafis', icon: 'design' },
  { id: 'social', name: 'Media Sosial', icon: 'social' },
  { id: 'photo', name: 'Fotografi Produk', icon: 'photo' },
  { id: 'video', name: 'Edit Video', icon: 'video' },
  { id: 'writing', name: 'Copywriting', icon: 'writing' },
  { id: 'web', name: 'Website & IT', icon: 'web' },
  { id: 'admin', name: 'Admin & Data Entry', icon: 'admin' },
  { id: 'translate', name: 'Penerjemahan', icon: 'translate' },
];

const SEED_SERVICES = [
  { id: 's1', title: 'Desain Poster Promosi Simpel & Menarik', category: 'design', provider: 'Nadia Putri', role: 'Mahasiswa DKV', price: 50000, unit: 'per desain', hours: 3, days: ['Sen', 'Rab', 'Sab'], rating: 4.9, reviews: 38, location: 'Bandung', delivery: '1 hari',
    description: 'Saya mahasiswa Desain Komunikasi Visual semester 5. Saya bisa membantu membuat poster promosi untuk menu baru, diskon, atau event usaha kamu dengan gaya yang bersih dan mudah dibaca.',
    includes: ['1 desain poster (feed IG / A4)', '2x revisi', 'File PNG + PDF siap cetak'] },
  { id: 's2', title: 'Kelola Instagram UMKM (Konten + Caption)', category: 'social', provider: 'Rizky Pratama', role: 'Freelancer Social Media', price: 350000, unit: 'per minggu', hours: 2, days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'], rating: 4.8, reviews: 52, location: 'Jakarta', delivery: '7 hari',
    description: 'Bantu kelola akun Instagram bisnis kamu: perencanaan konten, desain feed, caption, dan jadwal posting agar akun tetap aktif dan konsisten.',
    includes: ['5 konten feed / minggu', 'Caption + hashtag', 'Laporan insight mingguan'] },
  { id: 's3', title: 'Foto Produk Katalog dengan Background Putih', category: 'photo', provider: 'Dimas Arya', role: 'Fotografer Lepas', price: 15000, unit: 'per foto', hours: 4, days: ['Sab', 'Min'], rating: 4.9, reviews: 27, location: 'Yogyakarta', delivery: '2 hari',
    description: 'Foto produk dengan pencahayaan studio sederhana, cocok untuk marketplace seperti Shopee dan Tokopedia. Termasuk editing dasar.',
    includes: ['Minimal 10 foto', 'Edit warna & background', 'Resolusi tinggi'] },
  { id: 's4', title: 'Edit Video Reels / TikTok untuk Promosi', category: 'video', provider: 'Salsa Amelia', role: 'Mahasiswa Ilmu Komunikasi', price: 75000, unit: 'per video', hours: 3, days: ['Sel', 'Kam', 'Sab'], rating: 4.7, reviews: 19, location: 'Surabaya', delivery: '2 hari',
    description: 'Ubah footage mentah jadi video pendek yang menarik dengan musik, teks, dan transisi yang sedang tren.',
    includes: ['Video hingga 60 detik', 'Subtitle & musik', '1x revisi'] },
  { id: 's5', title: 'Copywriting Deskripsi Produk Marketplace', category: 'writing', provider: 'Fajar Nugroho', role: 'Content Writer', price: 20000, unit: 'per produk', hours: 2, days: ['Sen', 'Rab', 'Jum'], rating: 4.8, reviews: 44, location: 'Semarang', delivery: '1 hari',
    description: 'Tulis deskripsi produk yang persuasif dan SEO-friendly agar produk kamu lebih mudah ditemukan dan dibeli.',
    includes: ['Judul + deskripsi produk', 'Kata kunci SEO', 'Revisi tanpa batas (3 hari)'] },
  { id: 's6', title: 'Pembuatan Landing Page Usaha Sederhana', category: 'web', provider: 'Kevin Wijaya', role: 'Mahasiswa Informatika', price: 500000, unit: 'per proyek', hours: 3, days: ['Sab', 'Min'], rating: 5.0, reviews: 12, location: 'Malang', delivery: '5 hari',
    description: 'Buat website satu halaman untuk usaha kamu: profil, menu/produk, lokasi, dan tombol WhatsApp. Responsif di HP.',
    includes: ['1 halaman responsif', 'Integrasi WhatsApp & Maps', 'Bantuan online-kan website'] },
  { id: 's7', title: 'Input Data Stok & Rekap Penjualan Excel', category: 'admin', provider: 'Ayu Lestari', role: 'Freelancer Admin', price: 40000, unit: 'per jam', hours: 4, days: ['Sen', 'Sel', 'Rab', 'Kam'], rating: 4.6, reviews: 31, location: 'Medan', delivery: 'Sesuai jam',
    description: 'Rapikan data stok, buat rekap penjualan, dan template laporan sederhana di Excel / Google Sheets.',
    includes: ['Input & rapikan data', 'Template laporan', 'Rumus otomatis dasar'] },
  { id: 's8', title: 'Terjemahan Menu & Katalog Indonesia–Inggris', category: 'translate', provider: 'Clara Anindya', role: 'Mahasiswa Sastra Inggris', price: 30000, unit: 'per halaman', hours: 2, days: ['Rab', 'Jum', 'Min'], rating: 4.9, reviews: 22, location: 'Denpasar', delivery: '1 hari',
    description: 'Terjemahkan menu, katalog, atau deskripsi produk ke bahasa Inggris yang natural untuk pelanggan wisatawan.',
    includes: ['Terjemahan natural', 'Cek istilah kuliner/produk', 'Format rapi'] },
  { id: 's9', title: 'Desain Logo & Identitas Brand UMKM', category: 'design', provider: 'Bima Saputra', role: 'Desainer Freelance', price: 250000, unit: 'per paket', hours: 3, days: ['Sel', 'Kam', 'Sab'], rating: 4.9, reviews: 35, location: 'Bekasi', delivery: '3 hari',
    description: 'Logo sederhana yang mudah diingat beserta palet warna dan contoh penerapan di kemasan dan media sosial.',
    includes: ['3 alternatif konsep', 'Palet warna & font', 'File master (AI/SVG/PNG)'] },
];

const SEED_REQUESTS = [
  { id: 'r1', title: 'Butuh Poster Promo Menu Baru', category: 'design', business: 'Kedai Kopi Senja', owner: 'Pak Andi', budget: 75000, deadline: daysFromNow(3), location: 'Bandung', applicants: 4, status: 'open',
    description: 'Kami akan meluncurkan menu es kopi gula aren baru. Butuh 1 poster untuk Instagram dan 1 versi A4 untuk ditempel di kasir. Warna brand coklat & krem.' },
  { id: 'r2', title: 'Foto 20 Produk Kerajinan Rotan', category: 'photo', business: 'Rotan Asri Craft', owner: 'Bu Sari', budget: 300000, deadline: daysFromNow(7), location: 'Cirebon', applicants: 2, status: 'open',
    description: 'Butuh foto produk tas dan keranjang rotan untuk dijual di marketplace. Lokasi workshop di Cirebon, atau produk bisa dikirim.' },
  { id: 'r3', title: 'Video Pendek Behind the Scene Dapur', category: 'video', business: 'Dapur Bu Ratna', owner: 'Bu Ratna', budget: 150000, deadline: daysFromNow(5), location: 'Jakarta', applicants: 6, status: 'open',
    description: 'Ingin 2 video reels 30 detik yang menampilkan proses masak katering kami. Footage sudah ada, tinggal diedit.' },
  { id: 'r4', title: 'Tulis Deskripsi 15 Produk Skincare Lokal', category: 'writing', business: 'Glow Lokal', owner: 'Mbak Dewi', budget: 250000, deadline: daysFromNow(4), location: 'Online', applicants: 3, status: 'open',
    description: 'Butuh deskripsi produk yang menarik dan informatif untuk Shopee & Tokopedia. Info bahan dan manfaat akan kami berikan.' },
  { id: 'r5', title: 'Admin Instagram 2 Minggu', category: 'social', business: 'Batik Kencana', owner: 'Pak Hendra', budget: 500000, deadline: daysFromNow(10), location: 'Solo', applicants: 5, status: 'open',
    description: 'Mencari admin untuk posting konten dan membalas DM selama 2 minggu masa promo lebaran.' },
  { id: 'r6', title: 'Rekap Data Penjualan 3 Bulan', category: 'admin', business: 'Toko Sembako Makmur', owner: 'Bu Lina', budget: 120000, deadline: daysFromNow(2), location: 'Medan', applicants: 1, status: 'open',
    description: 'Data penjualan dari buku catatan perlu dimasukkan ke Google Sheets dan dibuat ringkasan per bulan.' },
];

const TESTIMONIALS = [
  { name: 'Bu Ratna', role: 'Pemilik Dapur Bu Ratna', text: 'Dulu saya pikir butuh agensi mahal untuk konten. Di JasaQ saya dapat editor video mahasiswa yang hasilnya bagus dan harganya pas di kantong.' },
  { name: 'Nadia Putri', role: 'Mahasiswa DKV, Penyedia Jasa', text: 'Saya bisa atur jam kosong di sela kuliah dan tetap dapat penghasilan tambahan. Portofolio saya juga jadi makin banyak!' },
  { name: 'Pak Andi', role: 'Pemilik Kedai Kopi Senja', text: 'Posting kebutuhan, pilih penyedia, selesai. Poster promo jadi dalam sehari dan langsung kami pakai.' },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  add(key, item) {
    const list = Store.get(key);
    list.unshift(item);
    localStorage.setItem(key, JSON.stringify(list));
  },
  services() { return [...Store.get('jasaq_services'), ...SEED_SERVICES]; },
  requests() { return [...Store.get('jasaq_requests'), ...SEED_REQUESTS]; },
  user() { try { return JSON.parse(localStorage.getItem('jasaq_user')); } catch { return null; } },
  setUser(u) { u ? localStorage.setItem('jasaq_user', JSON.stringify(u)) : localStorage.removeItem('jasaq_user'); },
};
