// ---------- Helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
const ui = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};
const AVATAR_COLORS = ['#3C8FFA', '#2477E6', '#0EA5E9', '#6366F1', '#14B8A6', '#F59E0B'];
const avatar = (name, cls = '') => `<div class="avatar ${cls}" style="background:${AVATAR_COLORS[name.length % AVATAR_COLORS.length]}">${esc(initials(name))}</div>`;

function daysLeft(dateStr) {
  const diff = Math.ceil((new Date(dateStr + 'T23:59:59') - new Date()) / 86400000);
  if (diff < 0) return { text: 'Lewat tenggat', cls: 'red', n: diff };
  if (diff === 0) return { text: 'Hari ini', cls: 'red', n: 0 };
  return { text: `${diff} hari lagi`, cls: diff <= 3 ? 'orange' : 'green', n: diff };
}
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.innerHTML = `<span class="check">${ui.check}</span>${esc(msg)}`;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

// ---------- Layout ----------
function renderLayout() {
  const page = document.body.dataset.page;
  const user = Store.user();
  const links = [
    ['index.html', 'Beranda', 'home'],
    ['jasa.html', 'Cari Jasa', 'services'],
    ['permintaan.html', 'Permintaan UMKM', 'requests'],
    ['pasang.html', 'Pasang', 'post'],
  ];
  const header = $('#site-header');
  if (header) {
    header.outerHTML = `
    <header class="navbar">
      <div class="container nav-inner">
        <a href="index.html" class="brand"><img src="assets/img/logo.svg" alt="JasaQ logo"><span>Jasa<b>Q</b></span></a>
        <ul class="nav-links">
          ${links.map(([h, l, id]) => `<li><a href="${h}" class="${page === id ? 'active' : ''}">${l}</a></li>`).join('')}
        </ul>
        <div class="nav-actions">
          ${user
            ? `<span class="mini-row">${avatar(user.name, 'sm')}<strong style="font-size:.9rem">${esc(user.name.split(' ')[0])}</strong></span>
               <button class="btn btn-ghost btn-sm" id="logout">Keluar</button>`
            : `<a href="masuk.html" class="btn btn-ghost">Masuk</a>
               <a href="masuk.html?mode=daftar" class="btn btn-primary">Daftar Gratis</a>`}
        </div>
        <button class="nav-toggle" aria-label="Buka menu"><span></span><span></span><span></span></button>
      </div>
    </header>`;
    $('.nav-toggle').addEventListener('click', () => $('.navbar').classList.toggle('open'));
    $('#logout')?.addEventListener('click', () => { Store.setUser(null); toast('Kamu sudah keluar'); setTimeout(() => location.reload(), 600); });
  }
  const footer = $('#site-footer');
  if (footer) {
    footer.outerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="brand"><img src="assets/img/logo.svg" alt="JasaQ logo"><span>Jasa<b>Q</b></span></a>
            <p style="max-width:320px;font-size:.92rem">Ubah waktu luang dan keahlian jadi peluang nyata. Bantu UMKM mendapatkan talenta tanpa harus merekrut karyawan tetap.</p>
          </div>
          <div><h4>Untuk Penyedia</h4><ul>
            <li><a href="pasang.html?tab=jasa">Tawarkan Jasa</a></li><li><a href="permintaan.html">Cari Permintaan</a></li><li><a href="masuk.html?mode=daftar">Daftar Penyedia</a></li></ul></div>
          <div><h4>Untuk UMKM</h4><ul>
            <li><a href="pasang.html?tab=permintaan">Pasang Permintaan</a></li><li><a href="jasa.html">Cari Jasa</a></li><li><a href="index.html#cara-kerja">Cara Kerja</a></li></ul></div>
          <div><h4>JasaQ</h4><ul>
            <li><a href="index.html#tentang">Tentang Kami</a></li><li><a href="mailto:halo@jasaq.id">halo@jasaq.id</a></li><li><a href="#">Syarat & Ketentuan</a></li></ul></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} JasaQ. Semua hak dilindungi.</span><span>Dibuat untuk UMKM Indonesia 🇮🇩</span></div>
      </div>
    </footer>`;
  }
}

// ---------- Cards ----------
function serviceCard(s) {
  const c = catOf(s.category);
  return `
  <a class="card" href="detail.html?type=jasa&id=${encodeURIComponent(s.id)}">
    <div class="card-cover">${icon(c.icon)}<span class="badge">${esc(c.name)}</span></div>
    <div class="card-body">
      <div class="mini-row">${avatar(s.provider, 'sm')}<div><strong style="font-size:.9rem">${esc(s.provider)}</strong><div class="muted" style="font-size:.78rem">${esc(s.role)}</div></div></div>
      <h3>${esc(s.title)}</h3>
      <div class="card-meta">
        <span>${ui.clock}${s.hours} jam/hari</span>
        <span>${ui.pin}${esc(s.location)}</span>
      </div>
      <div class="card-foot">
        <span class="rating">${ui.star}${s.rating ? s.rating.toFixed(1) : 'Baru'} <span class="muted" style="font-weight:500">(${s.reviews || 0})</span></span>
        <span class="price">${rupiah(s.price)} <small>${esc(s.unit)}</small></span>
      </div>
    </div>
  </a>`;
}

function requestCard(r) {
  const c = catOf(r.category);
  const dl = daysLeft(r.deadline);
  return `
  <a class="card req-card" href="detail.html?type=permintaan&id=${encodeURIComponent(r.id)}">
    <div class="top"><span class="badge">${icon(c.icon)} ${esc(c.name)}</span><span class="badge ${dl.cls}">${dl.text}</span></div>
    <h3>${esc(r.title)}</h3>
    <p>${esc(r.description.length > 110 ? r.description.slice(0, 110) + '…' : r.description)}</p>
    <div class="req-business">${avatar(r.business, 'sm')}<div><strong>${esc(r.business)}</strong><div class="muted" style="font-size:.78rem">${esc(r.location)}</div></div></div>
    <div class="card-foot">
      <span class="card-meta"><span>${ui.users}${r.applicants} pelamar</span></span>
      <span class="price">${rupiah(r.budget)} <small>budget</small></span>
    </div>
  </a>`;
}
// Make inline badge icons small
const style = document.createElement('style');
style.textContent = '.badge svg{width:14px;height:14px}';
document.head.appendChild(style);

// ---------- Pages ----------
const Pages = {
  home() {
    $('#cat-grid').innerHTML = CATEGORIES.map((c) => {
      const n = Store.services().filter((s) => s.category === c.id).length;
      return `<a class="cat" href="jasa.html?kategori=${c.id}"><div class="cat-icon">${icon(c.icon)}</div><div><strong>${c.name}</strong><small>${n} jasa tersedia</small></div></a>`;
    }).join('');
    $('#featured-services').innerHTML = Store.services().slice(0, 6).map(serviceCard).join('');
    $('#featured-requests').innerHTML = Store.requests().slice(0, 3).map(requestCard).join('');
    $('#testimonials').innerHTML = TESTIMONIALS.map((t) => `
      <div class="testi"><div class="stars">★★★★★</div><p>“${esc(t.text)}”</p>
      <div class="mini-row">${avatar(t.name)}<div><strong>${esc(t.name)}</strong><div class="muted" style="font-size:.85rem">${esc(t.role)}</div></div></div></div>`).join('');

    $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
      $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === tab.dataset.target));
    }));

    $('#hero-search').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#hero-q').value.trim();
      location.href = 'jasa.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  },

  services() {
    setupListing({
      data: Store.services(),
      card: serviceCard,
      filters: `
        <h4>Kategori</h4>${CATEGORIES.map((c) => `<label class="filter-opt"><input type="checkbox" name="cat" value="${c.id}">${c.name}</label>`).join('')}
        <h4>Harga</h4>
        <label class="filter-opt"><input type="radio" name="price" value="0-50000">≤ Rp50.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="50001-200000">Rp50.000 – Rp200.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="200001-99999999">> Rp200.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="" checked>Semua harga</label>
        <h4>Tersedia di hari</h4>
        <div class="day-picker">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => `<label><input type="checkbox" name="day" value="${d}"><span>${d}</span></label>`).join('')}</div>`,
      sorts: [['rec', 'Rekomendasi'], ['rating', 'Rating tertinggi'], ['cheap', 'Harga terendah'], ['exp', 'Harga tertinggi']],
      match(s, f) {
        if (f.q && !`${s.title} ${s.provider} ${s.role} ${catOf(s.category).name}`.toLowerCase().includes(f.q)) return false;
        if (f.cat.length && !f.cat.includes(s.category)) return false;
        if (f.price) { const [a, b] = f.price.split('-').map(Number); if (s.price < a || s.price > b) return false; }
        if (f.day.length && !f.day.some((d) => s.days.includes(d))) return false;
        return true;
      },
      sort(list, k) {
        if (k === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (k === 'cheap') list.sort((a, b) => a.price - b.price);
        if (k === 'exp') list.sort((a, b) => b.price - a.price);
        return list;
      },
      noun: 'jasa',
    });
  },

  requests() {
    setupListing({
      data: Store.requests(),
      card: requestCard,
      filters: `
        <h4>Kategori</h4>${CATEGORIES.map((c) => `<label class="filter-opt"><input type="checkbox" name="cat" value="${c.id}">${c.name}</label>`).join('')}
        <h4>Budget</h4>
        <label class="filter-opt"><input type="radio" name="price" value="0-100000">≤ Rp100.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="100001-300000">Rp100.000 – Rp300.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="300001-99999999">> Rp300.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="" checked>Semua budget</label>
        <h4>Tenggat</h4>
        <label class="filter-opt"><input type="radio" name="dl" value="3">≤ 3 hari</label>
        <label class="filter-opt"><input type="radio" name="dl" value="7">≤ 7 hari</label>
        <label class="filter-opt"><input type="radio" name="dl" value="" checked>Kapan saja</label>`,
      sorts: [['new', 'Terbaru'], ['deadline', 'Tenggat terdekat'], ['budget', 'Budget tertinggi']],
      match(r, f) {
        if (f.q && !`${r.title} ${r.business} ${r.description} ${catOf(r.category).name}`.toLowerCase().includes(f.q)) return false;
        if (f.cat.length && !f.cat.includes(r.category)) return false;
        if (f.price) { const [a, b] = f.price.split('-').map(Number); if (r.budget < a || r.budget > b) return false; }
        if (f.dl && daysLeft(r.deadline).n > Number(f.dl)) return false;
        return true;
      },
      sort(list, k) {
        if (k === 'deadline') list.sort((a, b) => a.deadline.localeCompare(b.deadline));
        if (k === 'budget') list.sort((a, b) => b.budget - a.budget);
        return list;
      },
      noun: 'permintaan',
    });
  },

  detail() {
    const p = new URLSearchParams(location.search);
    const isService = p.get('type') !== 'permintaan';
    const item = (isService ? Store.services() : Store.requests()).find((x) => x.id === p.get('id'));
    const root = $('#detail-root');
    if (!item) {
      root.innerHTML = `<div class="empty" style="margin-top:40px"><h3>Data tidak ditemukan</h3><p>Jasa atau permintaan ini mungkin sudah dihapus.</p><a class="btn btn-primary" style="margin-top:16px" href="jasa.html">Kembali cari jasa</a></div>`;
      return;
    }
    const c = catOf(item.category);
    document.title = `${item.title} | JasaQ`;
    $('#crumb-list').innerHTML = isService ? '<a href="jasa.html">Cari Jasa</a>' : '<a href="permintaan.html">Permintaan UMKM</a>';
    $('#crumb-title').textContent = item.title;

    if (isService) {
      root.innerHTML = `
      <div class="detail">
        <div>
          <div class="detail-cover">${icon(c.icon)}</div>
          <span class="badge">${esc(c.name)}</span>
          <h1>${esc(item.title)}</h1>
          <div class="card-meta"><span class="rating">${ui.star}${item.rating ? item.rating.toFixed(1) : 'Baru'}</span><span>(${item.reviews || 0} ulasan)</span><span>${ui.pin}${esc(item.location)}</span></div>
          <div class="detail-section"><h3>Tentang jasa ini</h3><p>${esc(item.description)}</p></div>
          <div class="detail-section"><h3>Yang kamu dapatkan</h3><ul>${(item.includes || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
          <div class="detail-section"><h3>Ketersediaan</h3>
            <p>${item.hours} jam per hari, pada hari:</p>
            <div class="slot-list">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => `<span class="slot ${item.days.includes(d) ? '' : 'off'}">${d}</span>`).join('')}</div>
          </div>
          <div class="detail-section"><h3>Tentang penyedia</h3>
            <div class="mini-row">${avatar(item.provider, 'lg')}<div><strong style="font-size:1.1rem">${esc(item.provider)}</strong><div class="muted">${esc(item.role)} · ${esc(item.location)}</div></div></div>
          </div>
        </div>
        <aside class="side-card">
          <div class="price">${rupiah(item.price)}</div><div class="muted">${esc(item.unit)}</div>
          <div class="kv">
            <div><span>Estimasi selesai</span><span>${esc(item.delivery)}</span></div>
            <div><span>Waktu luang</span><span>${item.hours} jam/hari</span></div>
            <div><span>Hari aktif</span><span>${item.days.join(', ')}</span></div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" data-action="order">Pesan Jasa</button>
          <button class="btn btn-outline btn-block" style="margin-top:10px" data-action="chat">Kirim Pesan</button>
        </aside>
      </div>`;
    } else {
      const dl = daysLeft(item.deadline);
      root.innerHTML = `
      <div class="detail">
        <div>
          <div class="top" style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge">${icon(c.icon)} ${esc(c.name)}</span><span class="badge ${dl.cls}">${dl.text}</span></div>
          <h1>${esc(item.title)}</h1>
          <div class="card-meta"><span>${ui.pin}${esc(item.location)}</span><span>${ui.users}${item.applicants} pelamar</span><span>${ui.cal}Tenggat ${fmtDate(item.deadline)}</span></div>
          <div class="detail-section"><h3>Deskripsi kebutuhan</h3><p>${esc(item.description)}</p></div>
          <div class="detail-section"><h3>Diposting oleh</h3>
            <div class="mini-row">${avatar(item.business, 'lg')}<div><strong style="font-size:1.1rem">${esc(item.business)}</strong><div class="muted">${esc(item.owner)} · ${esc(item.location)}</div></div></div>
          </div>
        </div>
        <aside class="side-card">
          <div class="muted">Budget</div><div class="price">${rupiah(item.budget)}</div>
          <div class="kv">
            <div><span>Tenggat</span><span>${fmtDate(item.deadline)}</span></div>
            <div><span>Kategori</span><span>${esc(c.name)}</span></div>
            <div><span>Pelamar</span><span>${item.applicants} orang</span></div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" data-action="apply">Ajukan Penawaran</button>
          <button class="btn btn-outline btn-block" style="margin-top:10px" data-action="chat">Tanya UMKM</button>
        </aside>
      </div>`;
    }

    const modal = $('#modal');
    const open = (html) => { $('.modal', modal).innerHTML = html; modal.classList.add('open'); };
    const close = () => modal.classList.remove('open');
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.dataset.close !== undefined) close(); });
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-action]')?.dataset.action;
      if (!a) return;
      if (!Store.user()) { location.href = 'masuk.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); return; }
      const titles = { order: 'Pesan jasa', apply: 'Ajukan penawaran', chat: 'Kirim pesan' };
      open(`
        <h3>${titles[a]}</h3><p class="muted" style="margin-bottom:18px">${esc(item.title)}</p>
        <form id="modal-form">
          ${a === 'apply' ? `<div class="field"><label>Harga penawaran (Rp)</label><input class="input" type="number" min="1000" required value="${item.budget}"></div>` : ''}
          ${a === 'order' ? `<div class="field"><label>Tanggal dibutuhkan</label><input class="input" type="date" required min="${daysFromNow(0)}"></div>` : ''}
          <div class="field"><label>Pesan</label><textarea class="input" required placeholder="Ceritakan detail kebutuhan atau pengalamanmu..."></textarea></div>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">Kirim</button></div>
        </form>`);
      $('#modal-form').addEventListener('submit', (ev) => {
        ev.preventDefault(); close();
        toast(a === 'apply' ? 'Penawaran terkirim ke UMKM!' : a === 'order' ? 'Pesanan terkirim ke penyedia!' : 'Pesan terkirim!');
      });
    });
  },

  post() {
    const tabParam = new URLSearchParams(location.search).get('tab');
    const setTab = (id) => {
      $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.target === id));
      $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === id));
    };
    $$('.tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.target)));
    if (tabParam === 'jasa') setTab('form-jasa');

    const opts = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    $$('select[name=category]').forEach((s) => (s.innerHTML = '<option value="">Pilih kategori</option>' + opts));
    $('input[name=deadline]').min = daysFromNow(1);

    const validate = (form) => {
      let ok = true;
      $$('[required]', form).forEach((el) => {
        const bad = !el.value.trim() || (el.type === 'number' && Number(el.value) <= 0);
        el.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      const days = $('.day-picker', form);
      if (days) {
        const bad = !$$('input:checked', days).length;
        days.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      }
      return ok;
    };
    $$('form.post-form').forEach((f) => f.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('invalid')));

    $('#form-permintaan form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      if (!validate(f)) return toast('Lengkapi data yang wajib diisi');
      const d = Object.fromEntries(new FormData(f));
      const user = Store.user();
      const item = { id: 'u' + Date.now(), title: d.title, category: d.category, business: d.business, owner: user?.name || d.business,
        budget: Number(d.budget), deadline: d.deadline, location: d.location || 'Online', applicants: 0, status: 'open', description: d.description };
      Store.add('jasaq_requests', item);
      toast('Permintaan berhasil dipasang!');
      setTimeout(() => (location.href = `detail.html?type=permintaan&id=${item.id}`), 900);
    });

    $('#form-jasa form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      if (!validate(f)) return toast('Lengkapi data yang wajib diisi');
      const d = Object.fromEntries(new FormData(f));
      const user = Store.user();
      const item = { id: 'u' + Date.now(), title: d.title, category: d.category, provider: d.provider || user?.name || 'Penyedia JasaQ',
        role: d.role || 'Penyedia Jasa', price: Number(d.price), unit: d.unit, hours: Number(d.hours), days: new FormData(f).getAll('days'),
        rating: 0, reviews: 0, location: d.location || 'Online', delivery: d.delivery || 'Sesuai kesepakatan', description: d.description,
        includes: (d.includes || '').split('\n').map((s) => s.trim()).filter(Boolean) };
      Store.add('jasaq_services', item);
      toast('Jasa kamu sudah tayang!');
      setTimeout(() => (location.href = `detail.html?type=jasa&id=${item.id}`), 900);
    });

    const user = Store.user();
    if (user) {
      if (user.role === 'umkm') { $('#form-permintaan [name=business]').value = user.business || user.name; }
      else { $('#form-jasa [name=provider]').value = user.name; }
    }
  },

  auth() {
    const p = new URLSearchParams(location.search);
    const setMode = (m) => {
      const reg = m === 'daftar';
      $('#auth-title').textContent = reg ? 'Buat akun JasaQ' : 'Selamat datang kembali';
      $('#auth-sub').textContent = reg ? 'Gratis, cuma butuh 1 menit.' : 'Masuk untuk melanjutkan.';
      $$('.reg-only').forEach((el) => (el.style.display = reg ? '' : 'none'));
      $$('.reg-only [data-req]').forEach((el) => (el.required = reg));
      $('#auth-submit').textContent = reg ? 'Daftar' : 'Masuk';
      $('#auth-switch').innerHTML = reg ? 'Sudah punya akun? <a data-mode="masuk">Masuk</a>' : 'Belum punya akun? <a data-mode="daftar">Daftar gratis</a>';
      $('#auth-form').dataset.mode = m;
      toggleBiz();
    };
    const toggleBiz = () => {
      const isUmkm = $('input[name=role]:checked').value === 'umkm';
      const reg = $('#auth-form').dataset.mode === 'daftar';
      $('#biz-field').style.display = isUmkm && reg ? '' : 'none';
      $('#biz-field input').required = isUmkm && reg;
    };
    $('#auth-switch').addEventListener('click', (e) => { if (e.target.dataset.mode) setMode(e.target.dataset.mode); });
    $$('input[name=role]').forEach((r) => r.addEventListener('change', toggleBiz));
    setMode(p.get('mode') === 'daftar' ? 'daftar' : 'masuk');

    $('#auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      if (d.password.length < 6) return toast('Kata sandi minimal 6 karakter');
      const name = d.name || d.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      Store.setUser({ name, email: d.email, role: d.role, business: d.business });
      toast(e.target.dataset.mode === 'daftar' ? 'Akun berhasil dibuat!' : 'Berhasil masuk!');
      setTimeout(() => (location.href = p.get('next') || (d.role === 'umkm' ? 'jasa.html' : 'permintaan.html')), 800);
    });
  },
};

function setupListing({ data, card, filters, sorts, match, sort, noun }) {
  const params = new URLSearchParams(location.search);
  $('#filters').innerHTML = filters;
  $('#sort').innerHTML = sorts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  $('.search').insertAdjacentHTML('afterbegin', ui.search);
  if (params.get('q')) $('#q').value = params.get('q');
  if (params.get('kategori')) $$(`#filters input[name=cat][value="${params.get('kategori')}"]`).forEach((i) => (i.checked = true));

  const render = () => {
    const fd = new FormData($('#filter-form'));
    const f = { q: $('#q').value.trim().toLowerCase(), cat: fd.getAll('cat'), price: fd.get('price'), day: fd.getAll('day'), dl: fd.get('dl') };
    const list = sort(data.filter((x) => match(x, f)), $('#sort').value);
    $('#result-count').textContent = `Menampilkan ${list.length} ${noun}`;
    $('#results').innerHTML = list.length ? list.map(card).join('') :
      `<div class="empty"><h3>Belum ada ${noun} yang cocok</h3><p>Coba ubah kata kunci atau filter.</p></div>`;
  };
  $('#filter-form').addEventListener('change', render);
  $('#q').addEventListener('input', render);
  $('#sort').addEventListener('change', render);
  $('#reset-filters').addEventListener('click', () => { $('#filter-form').reset(); $('#q').value = ''; render(); });
  $('.filter-toggle').addEventListener('click', () => $('#filter-form').classList.toggle('open'));
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  const page = document.body.dataset.page;
  const map = { home: 'home', services: 'services', requests: 'requests', detail: 'detail', post: 'post', auth: 'auth' };
  Pages[map[page]]?.();
});
