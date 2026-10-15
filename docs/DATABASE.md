# Panduan Database JasaQ (Supabase)

JasaQ memakai **[Supabase](https://supabase.com)**: database Postgres + login + chat realtime + penyimpanan foto. Paket gratisnya cukup untuk mulai, dan website tetap bisa di-hosting di GitHub Pages.

## 1. Setup (±10 menit, sekali saja)

1. **Buat project.** Daftar di [supabase.com](https://supabase.com) → **New project**. Pilih region **Southeast Asia (Singapore)** supaya cepat dari Indonesia. Simpan *database password* di tempat aman.
2. **Buat tabel & aturan keamanan.** Buka **SQL Editor** → **New query**, salin seluruh isi [`supabase/schema.sql`](../supabase/schema.sql), lalu klik **Run**. Harus muncul "Success".
3. *(Opsional)* **Data contoh.** Jalankan [`supabase/seed.sql`](../supabase/seed.sql) dengan cara yang sama supaya beranda tidak kosong. Data contoh diberi label "Contoh" dan bisa dihapus kapan saja.
4. **Hubungkan website.** Buka **Project Settings → API** (atau **API Keys**), salin:
   - **Project URL** → `SUPABASE_URL`
   - **anon / publishable key** → `SUPABASE_ANON_KEY`

   lalu isi di [`assets/js/config.js`](../assets/js/config.js) dan commit.
   > ⚠️ **Jangan pernah** memasukkan kunci **service_role / secret** ke website. Kunci itu bisa melewati semua aturan keamanan.
5. **Atur alamat website.** Di **Authentication → URL Configuration**:
   - **Site URL**: `https://axelele123.github.io/JasaQ/`
   - **Redirect URLs**: tambahkan `https://axelele123.github.io/JasaQ/**`

   Ini supaya link konfirmasi email & reset kata sandi mengarah ke situsmu.
6. **Konfirmasi email** (Authentication → Providers/Sign In → Email): biarkan **Confirm email = ON** untuk produksi. Saat masih uji coba boleh dimatikan supaya bisa langsung login tanpa cek email.

Selesai. Daftar akun di website, isi profil, lalu coba chat dengan akun kedua (pakai browser lain/mode incognito).

## 2. Cara melihat & mengelola data

| Ingin… | Buka di Supabase |
| --- | --- |
| Melihat isi tabel (profil, jasa, permintaan) | **Table Editor** |
| Melihat daftar akun / menghapus akun | **Authentication → Users** |
| Melihat foto profil | **Storage → avatars** |
| Menjalankan query / ubah struktur | **SQL Editor** |
| Backup | **Database → Backups** (paket gratis: lakukan export manual secara berkala) |

Tabel yang ada:

| Tabel | Isi | Siapa yang bisa membaca |
| --- | --- | --- |
| `profiles` | Nama tampilan, username, bio, keahlian, kota, warna tema, foto | Semua orang (ini profil publik) |
| `profile_private` | Nomor HP | **Hanya pemilik akun** |
| `services` | Jasa yang ditawarkan | Semua orang; hanya pemilik yang bisa ubah/hapus |
| `requests` | Permintaan UMKM | Semua orang; hanya pemilik yang bisa ubah/hapus |
| `conversations` | Daftar percakapan 1-lawan-1 | **Hanya 2 orang yang terlibat** |
| `messages` | Isi chat | **Hanya 2 orang yang terlibat** |

## 3. Bagaimana privasi pengguna dijaga

Aturan privasi dipasang **di dalam database** (fitur *Row Level Security*), bukan cuma di tampilan website. Artinya, walaupun seseorang membuka "Inspect Element" atau memanggil API langsung dengan kunci publik, database tetap menolak permintaan yang tidak diizinkan.

- **Kata sandi**: dikelola Supabase Auth dan disimpan dalam bentuk hash (bcrypt). Kamu sebagai admin pun **tidak bisa** melihat kata sandi asli.
- **Email**: hanya tersimpan di sistem login (`auth.users`), tidak pernah ada di tabel publik dan tidak pernah ditampilkan ke pengguna lain.
- **Nomor HP**: dipisah ke tabel `profile_private` yang hanya bisa dibaca pemiliknya.
- **Chat**: hanya pengirim & penerima yang bisa membaca. Pesan tidak bisa diedit orang lain. Status "dibaca" diubah lewat fungsi khusus (`mark_read`) supaya isi pesan tetap tidak bisa diubah.
- **Postingan**: setiap orang hanya bisa menambah, mengubah, dan menghapus postingannya sendiri.
- **Foto profil**: otomatis diperkecil ke 512×512 dan diproses ulang di browser, sehingga **metadata EXIF (termasuk lokasi GPS) terhapus** sebelum diunggah. Pengguna hanya bisa mengunggah ke folder miliknya, dan database hanya menerima foto dari storage JasaQ sendiri (mencegah "tracking pixel").
- **Hapus akun**: pengguna bisa menghapus akunnya sendiri di *Profil → Edit → Pengaturan akun*. Semua profil, foto, postingan, dan chat ikut terhapus permanen.
- **Koneksi**: semua data dikirim lewat HTTPS (terenkripsi saat dikirim) dan disimpan terenkripsi di server Supabase.
- **Keamanan tampilan**: semua teks dari pengguna di-escape sebelum ditampilkan (mencegah serangan XSS); link hanya `http(s)` dan diberi `rel="nofollow noopener"`; parameter `?next=` hanya boleh ke halaman JasaQ sendiri.

### Hal yang perlu kamu (admin) jaga
- Akses ke **dashboard Supabase** = akses ke semua data. Aktifkan **2FA** di akun Supabase dan jangan bagikan login.
- Jangan pernah mempublikasikan kunci `service_role` atau database password.
- Chat **tidak** end-to-end encrypted: admin dengan akses dashboard secara teknis bisa membaca tabel `messages`. Sampaikan hal ini dengan jujur di kebijakan privasi.
- Buat halaman **Kebijakan Privasi** sebelum diluncurkan ke publik (sesuai UU PDP No. 27/2022): data apa yang dikumpulkan, untuk apa, dan cara meminta penghapusan.
- Rate limit login/daftar sudah ada bawaan Supabase (Authentication → Rate Limits). Pertimbangkan mengaktifkan **CAPTCHA** (Authentication → Attack Protection) bila mulai ada spam.

## 4. Kalau ada masalah

| Gejala | Penyebab umum |
| --- | --- |
| Banner kuning "Database belum terhubung" | `config.js` belum diisi, atau masih berisi `YOUR_...` |
| Daftar berhasil tapi tidak bisa masuk | Email belum dikonfirmasi (cek inbox/spam), atau matikan "Confirm email" saat uji coba |
| Link konfirmasi mengarah ke `localhost` | Site URL / Redirect URLs belum diatur (langkah 5) |
| Chat tidak muncul otomatis | Pastikan bagian *Realtime* di `schema.sql` ikut dijalankan; cek **Database → Publications → supabase_realtime** berisi tabel `messages` |
| Upload foto gagal | Bagian *Storage* di `schema.sql` belum dijalankan, atau foto bukan JPG/PNG/WEBP |
| "Kamu tidak punya izin" | Memang dicegah oleh aturan keamanan (mis. mengedit postingan orang lain) |
