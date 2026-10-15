-- OPTIONAL: sample listings so the site isn't empty on day one.
-- They have no owner (owner_id = null), are labelled "Contoh" on the site,
-- and can't be ordered or messaged. Delete them any time:
--   delete from public.services where owner_id is null;
--   delete from public.requests where owner_id is null;

insert into public.services (owner_id, title, category, description, price, unit, hours, days, location, delivery, includes) values
  (null, 'Desain Poster Promosi Simpel & Menarik', 'design', 'Contoh jasa: poster promosi untuk menu baru, diskon, atau event usaha dengan gaya bersih dan mudah dibaca.', 50000, 'per desain', 3, array['Sen','Rab','Sab'], 'Bandung', '1 hari', array['1 desain poster (feed IG / A4)','2x revisi','File PNG + PDF siap cetak']),
  (null, 'Kelola Instagram UMKM (Konten + Caption)', 'social', 'Contoh jasa: perencanaan konten, desain feed, caption, dan jadwal posting.', 350000, 'per minggu', 2, array['Sen','Sel','Rab','Kam','Jum'], 'Jakarta', '7 hari', array['5 konten feed / minggu','Caption + hashtag']),
  (null, 'Foto Produk Katalog Background Putih', 'photo', 'Contoh jasa: foto produk untuk marketplace, termasuk editing dasar.', 15000, 'per foto', 4, array['Sab','Min'], 'Yogyakarta', '2 hari', array['Minimal 10 foto','Edit warna & background']);

insert into public.requests (owner_id, title, category, business, description, budget, deadline, location) values
  (null, 'Butuh Poster Promo Menu Baru', 'design', 'Kedai Kopi Senja (contoh)', 'Contoh permintaan: 1 poster Instagram dan 1 versi A4 untuk kasir. Warna brand coklat & krem.', 75000, current_date + 7, 'Bandung'),
  (null, 'Video Pendek Behind the Scene Dapur', 'video', 'Dapur Bu Ratna (contoh)', 'Contoh permintaan: 2 video reels 30 detik dari footage yang sudah ada.', 150000, current_date + 10, 'Jakarta');
