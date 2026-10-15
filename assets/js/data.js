// Static content for JasaQ (icons, categories, marketing copy). Real data comes from the database (db.js).
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

const TESTIMONIALS = [
  { name: 'Bu Ratna', role: 'Pemilik Dapur Bu Ratna', text: 'Dulu saya pikir butuh agensi mahal untuk konten. Di JasaQ saya dapat editor video mahasiswa yang hasilnya bagus dan harganya pas di kantong.' },
  { name: 'Nadia Putri', role: 'Mahasiswa DKV, Penyedia Jasa', text: 'Saya bisa atur jam kosong di sela kuliah dan tetap dapat penghasilan tambahan. Portofolio saya juga jadi makin banyak!' },
  { name: 'Pak Andi', role: 'Pemilik Kedai Kopi Senja', text: 'Posting kebutuhan, pilih penyedia, selesai. Poster promo jadi dalam sehari dan langsung kami pakai.' },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  // Local date (not UTC), so "today" is correct in Indonesia.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const THEME_COLORS = ['#3C8FFA', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#F43F5E', '#8B5CF6', '#0F1B2D'];
