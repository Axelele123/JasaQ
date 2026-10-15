// =====================================================================
// JasaQ front-end. Data access lives in db.js (Supabase + Row Level Security).
// All user-provided text is escaped with esc() before being put in the page.
// =====================================================================

// ---------- Helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
const roleLabel = (r) => (r === 'umkm' ? 'UMKM' : 'Penyedia Jasa');
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
const svg = (d, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ui = {
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  pin: svg('<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
  cal: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  check: svg('<path d="m5 12 5 5 9-10"/>', 3),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
  send: svg('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  insta: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  briefcase: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  alert: svg('<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>'),
};
const AVATAR_COLORS = ['#3C8FFA', '#2477E6', '#0EA5E9', '#6366F1', '#14B8A6', '#F59E0B'];
const initials = (name) => (String(name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?');

function avatar(p, cls = '') {
  const name = typeof p === 'string' ? p : (p && p.display_name) || 'JasaQ';
  if (p && typeof p === 'object' && p.avatar_url) return `<img class="avatar ${cls}" src="${esc(p.avatar_url)}" alt="" loading="lazy">`;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<div class="avatar ${cls}" style="background:${AVATAR_COLORS[h % AVATAR_COLORS.length]}">${esc(initials(name))}</div>`;
}

// Only http(s) links are ever rendered as clickable.
function safeUrl(u) {
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; }
}
// Only allow redirects to our own pages (prevents "open redirect" tricks via ?next=).
const safeNext = (n) => (n && /^[a-z0-9_-]+\.html(\?[^#]*)?$/i.test(n) ? n : null);

function daysLeft(dateStr) {
  const diff = Math.ceil((new Date(dateStr + 'T23:59:59') - new Date()) / 86400000);
  if (diff < 0) return { text: 'Lewat tenggat', cls: 'red', n: diff };
  if (diff === 0) return { text: 'Hari ini', cls: 'red', n: 0 };
  return { text: `${diff} hari lagi`, cls: diff <= 3 ? 'orange' : 'green', n: diff };
}
const fmtDate = (d) => new Date(d.length <= 10 ? d + 'T00:00:00' : d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const clock = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return `${Math.floor(s / 60)} menit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 604800) return `${Math.floor(s / 86400)} hari lalu`;
  return fmtDate(iso);
}
function shortTime(iso) {
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString()) return clock(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
function dayLabel(iso) {
  const d = new Date(iso), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
  if (d.toDateString() === t.toDateString()) return 'Hari ini';
  if (d.toDateString() === y.toDateString()) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function toast(msg, { error = false, link, linkText = 'Buka' } = {}) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.classList.toggle('error', error);
  t.innerHTML = `<span class="check">${error ? '!' : ui.check}</span><span>${esc(msg)}</span>${link ? `<a href="${esc(link)}" class="toast-link">${esc(linkText)}</a>` : ''}`;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), error ? 5000 : 3800);
}
const fail = (e) => { console.error(e); toast(DB.errMsg(e), { error: true }); };

async function busy(btn, fn) {
  if (!btn || btn.disabled) return;
  const label = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Memproses…';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = label; }
}

function openModal(html) {
  let m = $('#modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'modal';
    m.className = 'modal-backdrop';
    m.innerHTML = '<div class="modal" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(m);
  }
  if (!m._wired) {
    m._wired = true;
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
  $('.modal', m).innerHTML = html;
  m.classList.add('open');
  return $('.modal', m);
}
const closeModal = () => $('#modal')?.classList.remove('open');

function confirmBox(title, text, okText = 'Ya, lanjutkan') {
  return new Promise((resolve) => {
    const box = openModal(`<h3>${esc(title)}</h3><p class="muted" style="margin-bottom:20px">${esc(text)}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="confirm-ok">${esc(okText)}</button></div>`);
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    $('#confirm-ok', box).addEventListener('click', () => { finish(true); closeModal(); });
    const obs = new MutationObserver(() => { if (!$('#modal').classList.contains('open')) { obs.disconnect(); finish(false); } });
    obs.observe($('#modal'), { attributes: true, attributeFilter: ['class'] });
  });
}

const skeleton = (n) => Array.from({ length: n }, () => '<div class="card skeleton"><div class="sk-cover"></div><div class="card-body"><div class="sk-line w60"></div><div class="sk-line"></div><div class="sk-line w40"></div></div></div>').join('');
const notConfigured = () => `<div class="empty">${ui.alert}<h3>Database belum terhubung</h3><p>Pemilik situs perlu mengisi <code>assets/js/config.js</code>. Ikuti panduan di <code>docs/DATABASE.md</code>.</p></div>`;
const errorBox = (e) => `<div class="empty">${ui.alert}<h3>Gagal memuat data</h3><p>${esc(DB.errMsg(e))}</p><button class="btn btn-outline btn-sm" onclick="location.reload()" style="margin-top:12px">Coba lagi</button></div>`;

function requireLogin(me) {
  if (me) return true;
  const here = location.pathname.split('/').pop() + location.search;
  location.href = 'masuk.html?next=' + encodeURIComponent(here);
  return false;
}

// ---------- Layout ----------
let setUnreadBadge = () => {};

function renderLayout(me) {
  const page = document.body.dataset.page;
  const links = [
    ['index.html', 'Beranda', 'home'],
    ['jasa.html', 'Cari Jasa', 'services'],
    ['permintaan.html', 'Permintaan UMKM', 'requests'],
    ['pasang.html', 'Pasang', 'post'],
  ];
  const header = $('#site-header');
  if (header) {
    const first = me ? esc(String(me.profile.display_name || '').split(' ')[0]) : '';
    header.outerHTML = `
    <header class="navbar" id="site-header">
      ${DB.configured ? '' : `<div class="setup-banner">${ui.alert}<span>Database belum terhubung. Isi <code>assets/js/config.js</code> sesuai panduan <code>docs/DATABASE.md</code>.</span></div>`}
      <div class="container nav-inner">
        <a href="index.html" class="brand"><img src="assets/img/logo.svg" alt="JasaQ logo"><span>Jasa<b>Q</b></span></a>
        <ul class="nav-links">
          ${links.map(([h, l, id]) => `<li><a href="${h}" class="${page === id ? 'active' : ''}">${l}</a></li>`).join('')}
        </ul>
        <div class="nav-actions">
          ${me
            ? `<a href="pesan.html" class="icon-btn ${page === 'chat' ? 'active' : ''}" aria-label="Pesan" title="Pesan">${ui.chat}<span class="nav-badge" id="nav-unread" hidden></span></a>
               <a href="profil.html" class="nav-user ${page === 'profile' && !params.get('id') && !params.get('u') ? 'active' : ''}" title="Profil saya">${avatar(me.profile, 'sm')}<strong>${first}</strong></a>
               <button class="btn btn-ghost btn-sm" id="logout">Keluar</button>`
            : `<a href="masuk.html" class="btn btn-ghost">Masuk</a>
               <a href="masuk.html?mode=daftar" class="btn btn-primary">Daftar Gratis</a>`}
        </div>
        <button class="nav-toggle" aria-label="Buka menu"><span></span><span></span><span></span><i class="nav-dot" hidden></i></button>
      </div>
    </header>`;
    $('.nav-toggle').addEventListener('click', () => $('.navbar').classList.toggle('open'));
    $('#logout')?.addEventListener('click', async () => {
      window.__leaving = true;
      try { await DB.auth.signOut(); } catch (e) { console.error(e); }
      location.href = 'index.html';
    });
    setUnreadBadge = (n) => {
      const b = $('#nav-unread');
      if (b) { b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n); }
      const d = $('.nav-dot');
      if (d) d.hidden = !n;
    };
  }
  const footer = $('#site-footer');
  if (footer) {
    footer.outerHTML = `
    <footer class="footer" id="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="brand"><img src="assets/img/logo.svg" alt="JasaQ logo"><span>Jasa<b>Q</b></span></a>
            <p style="max-width:320px;font-size:.92rem">Ubah waktu luang dan keahlian jadi peluang nyata. Bantu UMKM mendapatkan talenta tanpa harus merekrut karyawan tetap.</p>
          </div>
          <div><h4>Untuk Penyedia</h4><ul>
            <li><a href="pasang.html?tab=jasa">Tawarkan Jasa</a></li><li><a href="permintaan.html">Cari Permintaan</a></li><li><a href="profil.html">Profil Saya</a></li></ul></div>
          <div><h4>Untuk UMKM</h4><ul>
            <li><a href="pasang.html?tab=permintaan">Pasang Permintaan</a></li><li><a href="jasa.html">Cari Jasa</a></li><li><a href="index.html#cara-kerja">Cara Kerja</a></li></ul></div>
          <div><h4>JasaQ</h4><ul>
            <li><a href="index.html#tentang">Tentang Kami</a></li><li><a href="pesan.html">Pesan</a></li><li><a href="mailto:halo@jasaq.id">halo@jasaq.id</a></li></ul></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} JasaQ. Semua hak dilindungi.</span><span>Dibuat untuk UMKM Indonesia 🇮🇩</span></div>
      </div>
    </footer>`;
  }
}

// Realtime inbox: keeps the unread badge fresh and notifies about new messages on every page.
function startInbox(me) {
  const refresh = () => DB.chat.unreadCount().then(setUnreadBadge).catch(() => {});
  window.JasaQRefreshUnread = refresh;
  refresh();
  DB.chat.subscribe({
    onInsert: async (m) => {
      window.dispatchEvent(new CustomEvent('jasaq:message', { detail: m }));
      if (m.sender_id === me.id || document.body.dataset.page === 'chat') return;
      refresh();
      const p = await DB.profiles.get(m.sender_id).catch(() => null);
      toast(`Pesan baru dari ${p?.display_name || 'pengguna JasaQ'}`, { link: `pesan.html?c=${encodeURIComponent(m.conversation_id)}`, linkText: 'Balas' });
    },
    onUpdate: (m) => window.dispatchEvent(new CustomEvent('jasaq:message-update', { detail: m })),
  });
}

// ---------- Cards ----------
function serviceCard(s) {
  const c = catOf(s.category), o = s.owner;
  return `
  <a class="card" href="detail.html?type=jasa&id=${encodeURIComponent(s.id)}">
    <div class="card-cover">${icon(c.icon)}<span class="badge">${esc(c.name)}</span>${o ? '' : '<span class="badge gray sample-badge">Contoh</span>'}</div>
    <div class="card-body">
      <div class="mini-row">${avatar(o || 'JasaQ', 'sm')}<div><strong style="font-size:.9rem">${esc(o ? o.display_name : 'Contoh JasaQ')}</strong><div class="muted" style="font-size:.78rem">${esc(o ? o.headline || roleLabel(o.role) : 'Data contoh')}</div></div></div>
      <h3>${esc(s.title)}</h3>
      <div class="card-meta">
        <span>${ui.clock}${s.hours} jam/hari</span>
        <span>${ui.pin}${esc(s.location || 'Online')}</span>
      </div>
      <div class="card-foot">
        <span class="card-meta"><span>${ui.cal}${esc((s.days || []).join(', '))}</span></span>
        <span class="price">${rupiah(s.price)} <small>${esc(s.unit)}</small></span>
      </div>
    </div>
  </a>`;
}

function requestCard(r) {
  const c = catOf(r.category), dl = daysLeft(r.deadline);
  const status = r.status === 'closed' ? '<span class="badge gray">Ditutup</span>' : `<span class="badge ${dl.cls}">${dl.text}</span>`;
  return `
  <a class="card req-card" href="detail.html?type=permintaan&id=${encodeURIComponent(r.id)}">
    <div class="top"><span class="badge">${icon(c.icon)} ${esc(c.name)}</span>${status}</div>
    <h3>${esc(r.title)}</h3>
    <p>${esc(r.description.length > 110 ? r.description.slice(0, 110) + '…' : r.description)}</p>
    <div class="req-business">${avatar(r.owner || r.business, 'sm')}<div><strong>${esc(r.business)}</strong><div class="muted" style="font-size:.78rem">${esc(r.location || 'Online')}</div></div></div>
    <div class="card-foot">
      <span class="card-meta"><span>${ui.clock}${timeAgo(r.created_at)}</span></span>
      <span class="price">${rupiah(r.budget)} <small>budget</small></span>
    </div>
  </a>`;
}

// ---------- Home animations ----------
function makeBubbles(container, count, { white = false } = {}) {
  if (!container) return;
  const h = container.offsetHeight || 600;
  container.style.setProperty('--rise', `-${h + 80}px`);
  container.innerHTML = Array.from({ length: count }, () => {
    const size = 6 + Math.random() * 18, t = 9 + Math.random() * 10;
    return `<span class="bubble${white ? ' white' : ''}" style="width:${size}px;height:${size}px;left:${Math.random() * 100}%;--t:${t}s;--delay:${-Math.random() * t}s;--sway:${(Math.random() * 60 - 30).toFixed(0)}px"></span>`;
  }).join('');
}

function initSea() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const small = innerWidth < 700;
  makeBubbles($('.sea-bubbles'), small ? 9 : 16);
  makeBubbles($('.cta-bubbles'), small ? 6 : 10, { white: true });
  makeBubbles($('.intro-bubbles'), 8);
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => $$('.sea-bubbles, .cta-bubbles').forEach((c) => c.style.setProperty('--rise', `-${c.offsetHeight + 80}px`)), 200); });
}

// Scroll-reveal: elements fade/slide in as they enter the screen.
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    revealObserver.unobserve(e.target);
    setTimeout(() => e.target.classList.remove('sr', 'in'), 1400);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

function revealify(selector, root = document) {
  if (!revealObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$(selector, root).forEach((el, i) => {
    el.classList.add('sr');
    el.style.setProperty('--i', i % 6);
    revealObserver.observe(el);
  });
}

function countUp(el, target) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n) => Math.round(n).toLocaleString('id-ID');
  if (reduce || !target) { el.textContent = fmt(target); return; }
  const start = performance.now(), dur = 1400;
  const step = (now) => {
    const p = Math.min(1, (now - start) / dur);
    el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Pages ----------
const Pages = {
  async home() {
    initSea();
    revealify('.section-head, .step, .benefit-box, .cta, .tabs');
    $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
      $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === tab.dataset.target));
    }));
    $('#hero-search').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#hero-q').value.trim();
      location.href = 'jasa.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
    $('#testimonials').innerHTML = TESTIMONIALS.map((t) => `
      <div class="testi"><div class="stars">★★★★★</div><p>“${esc(t.text)}”</p>
      <div class="mini-row">${avatar(t.name)}<div><strong>${esc(t.name)}</strong><div class="muted" style="font-size:.85rem">${esc(t.role)}</div></div></div></div>`).join('');
    revealify('.testi');

    const catHtml = (counts) => CATEGORIES.map((c) => `<a class="cat" href="jasa.html?kategori=${c.id}"><div class="cat-icon">${icon(c.icon)}</div><div><strong>${c.name}</strong><small>${counts ? `${counts[c.id] || 0} jasa tersedia` : 'Lihat jasa'}</small></div></a>`).join('');

    if (!DB.configured) {
      $('#cat-grid').innerHTML = catHtml(null);
      $('#featured-services').innerHTML = notConfigured();
      $('#featured-requests').innerHTML = notConfigured();
      $$('[data-count]').forEach((el) => (el.textContent = '–'));
      revealify('.cat');
      return;
    }
    $('#featured-services').innerHTML = skeleton(3);
    $('#featured-requests').innerHTML = skeleton(3);
    const [counts, services, requests, stats] = await Promise.allSettled([
      DB.services.categoryCounts(), DB.services.list({ limit: 6 }), DB.requests.list({ limit: 3 }), DB.stats(),
    ]);
    $('#cat-grid').innerHTML = catHtml(counts.value || null);
    $('#featured-services').innerHTML = services.status === 'rejected' ? errorBox(services.reason)
      : services.value.length ? services.value.map(serviceCard).join('')
      : '<div class="empty"><h3>Belum ada jasa</h3><p>Jadilah yang pertama menawarkan jasa!</p><a class="btn btn-primary btn-sm" style="margin-top:12px" href="pasang.html?tab=jasa">Tawarkan Jasa</a></div>';
    $('#featured-requests').innerHTML = requests.status === 'rejected' ? errorBox(requests.reason)
      : requests.value.length ? requests.value.map(requestCard).join('')
      : '<div class="empty"><h3>Belum ada permintaan</h3><p>UMKM bisa memasang kebutuhan pertama di sini.</p><a class="btn btn-primary btn-sm" style="margin-top:12px" href="pasang.html?tab=permintaan">Pasang Permintaan</a></div>';
    revealify('.cat');
    revealify('#featured-services .card, #featured-requests .card');
    $$('[data-count]').forEach((el) => {
      const v = stats.value ? stats.value[el.dataset.count] : null;
      if (v == null) el.textContent = '–';
      else {
        const go = () => countUp(el, v);
        document.documentElement.classList.contains('intro-active') ? setTimeout(go, 3300) : go();
      }
    });
  },

  async services() {
    await setupListing({
      load: () => DB.services.list(),
      card: serviceCard,
      filters: `
        <h4>Kategori</h4>${CATEGORIES.map((c) => `<label class="filter-opt"><input type="checkbox" name="cat" value="${c.id}">${c.name}</label>`).join('')}
        <h4>Harga</h4>
        <label class="filter-opt"><input type="radio" name="price" value="0-50000">≤ Rp50.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="50001-200000">Rp50.000 – Rp200.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="200001-999999999">> Rp200.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="" checked>Semua harga</label>
        <h4>Tersedia di hari</h4>
        <div class="day-picker">${DAYS.map((d) => `<label><input type="checkbox" name="day" value="${d}"><span>${d}</span></label>`).join('')}</div>`,
      sorts: [['new', 'Terbaru'], ['cheap', 'Harga terendah'], ['exp', 'Harga tertinggi']],
      match(s, f) {
        if (f.q && !`${s.title} ${s.owner?.display_name || ''} ${s.description} ${catOf(s.category).name}`.toLowerCase().includes(f.q)) return false;
        if (f.cat.length && !f.cat.includes(s.category)) return false;
        if (f.price) { const [a, b] = f.price.split('-').map(Number); if (s.price < a || s.price > b) return false; }
        if (f.day.length && !f.day.some((d) => s.days.includes(d))) return false;
        return true;
      },
      sort(list, k) {
        if (k === 'cheap') list.sort((a, b) => a.price - b.price);
        if (k === 'exp') list.sort((a, b) => b.price - a.price);
        return list;
      },
      noun: 'jasa',
    });
  },

  async requests() {
    await setupListing({
      load: () => DB.requests.list(),
      card: requestCard,
      filters: `
        <h4>Kategori</h4>${CATEGORIES.map((c) => `<label class="filter-opt"><input type="checkbox" name="cat" value="${c.id}">${c.name}</label>`).join('')}
        <h4>Budget</h4>
        <label class="filter-opt"><input type="radio" name="price" value="0-100000">≤ Rp100.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="100001-300000">Rp100.000 – Rp300.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="300001-999999999">> Rp300.000</label>
        <label class="filter-opt"><input type="radio" name="price" value="" checked>Semua budget</label>
        <h4>Tenggat</h4>
        <label class="filter-opt"><input type="radio" name="dl" value="3">≤ 3 hari</label>
        <label class="filter-opt"><input type="radio" name="dl" value="7">≤ 7 hari</label>
        <label class="filter-opt"><input type="radio" name="dl" value="" checked>Kapan saja</label>
        <h4>Status</h4>
        <label class="filter-opt"><input type="checkbox" name="open" value="1" checked>Hanya yang masih buka</label>`,
      sorts: [['new', 'Terbaru'], ['deadline', 'Tenggat terdekat'], ['budget', 'Budget tertinggi']],
      match(r, f) {
        if (f.q && !`${r.title} ${r.business} ${r.description} ${catOf(r.category).name}`.toLowerCase().includes(f.q)) return false;
        if (f.cat.length && !f.cat.includes(r.category)) return false;
        if (f.price) { const [a, b] = f.price.split('-').map(Number); if (r.budget < a || r.budget > b) return false; }
        if (f.dl && daysLeft(r.deadline).n > Number(f.dl)) return false;
        if (f.open && (r.status === 'closed' || daysLeft(r.deadline).n < 0)) return false;
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

  async detail(me) {
    const isService = params.get('type') !== 'permintaan';
    const root = $('#detail-root');
    $('#crumb-list').innerHTML = isService ? '<a href="jasa.html">Cari Jasa</a>' : '<a href="permintaan.html">Permintaan UMKM</a>';
    if (!DB.configured) { root.innerHTML = notConfigured(); return; }
    root.innerHTML = '<div class="loading-block"><span class="spinner big"></span></div>';
    let item;
    try { item = await (isService ? DB.services : DB.requests).get(params.get('id')); } catch (e) { root.innerHTML = errorBox(e); return; }
    if (!item) {
      root.innerHTML = `<div class="empty" style="margin-top:40px"><h3>Data tidak ditemukan</h3><p>Jasa atau permintaan ini mungkin sudah dihapus.</p><a class="btn btn-primary" style="margin-top:16px" href="${isService ? 'jasa' : 'permintaan'}.html">Kembali</a></div>`;
      return;
    }
    const c = catOf(item.category), o = item.owner;
    const mine = me && item.owner_id === me.id;
    const closed = !isService && item.status === 'closed';
    document.title = `${item.title} | JasaQ`;
    $('#crumb-title').textContent = item.title;

    const ownerBlock = o
      ? `<a class="owner-link mini-row" href="profil.html?id=${encodeURIComponent(o.id)}">${avatar(o, 'lg')}<div><strong style="font-size:1.1rem">${esc(o.display_name)}</strong><div class="muted">${esc(o.headline || roleLabel(o.role))}${o.location ? ' · ' + esc(o.location) : ''}</div><span class="text-primary" style="font-size:.85rem;font-weight:700">Lihat profil →</span></div></a>`
      : `<div class="mini-row">${avatar('JasaQ', 'lg')}<div><strong>Data contoh</strong><div class="muted">Dibuat oleh tim JasaQ sebagai contoh tampilan.</div></div></div>`;

    let actions;
    if (!o) actions = '<p class="muted note-box">Ini data contoh, jadi tidak bisa dipesan atau dihubungi.</p>';
    else if (mine) {
      actions = `<p class="note-box">Ini postingan kamu.</p>
        ${isService ? '' : `<button class="btn btn-outline btn-block" data-action="toggle">${closed ? 'Buka lagi permintaan' : 'Tandai sudah selesai'}</button>`}
        <button class="btn btn-danger-outline btn-block" style="margin-top:10px" data-action="delete">${ui.trash} Hapus</button>`;
    } else if (closed) {
      actions = `<p class="muted note-box">Permintaan ini sudah ditutup.</p><button class="btn btn-outline btn-block" data-action="chat">${ui.chat} Kirim Pesan</button>`;
    } else {
      actions = `<button class="btn btn-primary btn-block btn-lg" data-action="${isService ? 'order' : 'apply'}">${isService ? 'Pesan Jasa' : 'Ajukan Penawaran'}</button>
        <button class="btn btn-outline btn-block" style="margin-top:10px" data-action="chat">${ui.chat} Kirim Pesan</button>`;
    }

    if (isService) {
      root.innerHTML = `
      <div class="detail">
        <div>
          <div class="detail-cover">${icon(c.icon)}</div>
          <span class="badge">${esc(c.name)}</span>${o ? '' : ' <span class="badge gray">Contoh</span>'}
          <h1>${esc(item.title)}</h1>
          <div class="card-meta"><span>${ui.pin}${esc(item.location || 'Online')}</span><span>${ui.clock}Diposting ${timeAgo(item.created_at)}</span></div>
          <div class="detail-section"><h3>Tentang jasa ini</h3><p class="pre">${esc(item.description)}</p></div>
          ${item.includes?.length ? `<div class="detail-section"><h3>Yang kamu dapatkan</h3><ul>${item.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}
          <div class="detail-section"><h3>Ketersediaan</h3>
            <p>${item.hours} jam per hari, pada hari:</p>
            <div class="slot-list">${DAYS.map((d) => `<span class="slot ${item.days.includes(d) ? '' : 'off'}">${d}</span>`).join('')}</div>
          </div>
          <div class="detail-section"><h3>Tentang penyedia</h3>${ownerBlock}</div>
        </div>
        <aside class="side-card">
          <div class="price">${rupiah(item.price)}</div><div class="muted">${esc(item.unit)}</div>
          <div class="kv">
            <div><span>Estimasi selesai</span><span>${esc(item.delivery || 'Sesuai kesepakatan')}</span></div>
            <div><span>Waktu luang</span><span>${item.hours} jam/hari</span></div>
            <div><span>Hari aktif</span><span>${esc(item.days.join(', '))}</span></div>
          </div>
          ${actions}
        </aside>
      </div>`;
    } else {
      const dl = daysLeft(item.deadline);
      root.innerHTML = `
      <div class="detail">
        <div>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge">${icon(c.icon)} ${esc(c.name)}</span>${closed ? '<span class="badge gray">Ditutup</span>' : `<span class="badge ${dl.cls}">${dl.text}</span>`}${o ? '' : '<span class="badge gray">Contoh</span>'}</div>
          <h1>${esc(item.title)}</h1>
          <div class="card-meta"><span>${ui.pin}${esc(item.location || 'Online')}</span><span>${ui.cal}Tenggat ${fmtDate(item.deadline)}</span><span>${ui.clock}Diposting ${timeAgo(item.created_at)}</span></div>
          <div class="detail-section"><h3>Deskripsi kebutuhan</h3><p class="pre">${esc(item.description)}</p></div>
          <div class="detail-section"><h3>Diposting oleh</h3>${ownerBlock}</div>
        </div>
        <aside class="side-card">
          <div class="muted">Budget</div><div class="price">${rupiah(item.budget)}</div>
          <div class="kv">
            <div><span>Usaha</span><span>${esc(item.business)}</span></div>
            <div><span>Tenggat</span><span>${fmtDate(item.deadline)}</span></div>
            <div><span>Kategori</span><span>${esc(c.name)}</span></div>
          </div>
          ${actions}
        </aside>
      </div>`;
    }

    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const a = btn.dataset.action;
      if (!requireLogin(me)) return;

      if (a === 'delete') {
        if (!(await confirmBox('Hapus postingan?', 'Postingan ini akan dihapus permanen dari database.', 'Hapus'))) return;
        try { await (isService ? DB.services : DB.requests).remove(item.id); toast('Postingan dihapus'); setTimeout(() => (location.href = 'profil.html'), 700); }
        catch (err) { fail(err); }
        return;
      }
      if (a === 'toggle') {
        await busy(btn, async () => {
          try { await DB.requests.update(item.id, { status: closed ? 'open' : 'closed' }); location.reload(); } catch (err) { fail(err); }
        });
        return;
      }

      const titles = { order: 'Pesan jasa', apply: 'Ajukan penawaran', chat: `Kirim pesan ke ${o.display_name}` };
      const box = openModal(`
        <h3>${esc(titles[a])}</h3><p class="muted" style="margin-bottom:18px">${esc(item.title)}</p>
        <form id="modal-form">
          ${a === 'apply' ? `<div class="field"><label>Harga penawaran (Rp)</label><input class="input" name="price" type="number" min="1000" step="1000" required value="${item.budget}"></div>` : ''}
          ${a === 'order' ? `<div class="field"><label>Tanggal dibutuhkan</label><input class="input" name="date" type="date" required min="${daysFromNow(0)}"></div>` : ''}
          <div class="field"><label>Pesan</label><textarea class="input" name="msg" required maxlength="1500" placeholder="${a === 'apply' ? 'Ceritakan pengalaman dan rencana pengerjaanmu…' : 'Ceritakan detail kebutuhanmu…'}"></textarea>
            <span class="hint">${ui.lock} Pesan hanya bisa dibaca oleh kamu dan ${esc(o.display_name)}.</span></div>
          <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary">${ui.send} Kirim</button></div>
        </form>`);
      $('#modal-form', box).addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const d = Object.fromEntries(new FormData(ev.target));
        const msg = d.msg.trim();
        if (!msg) return;
        let body = `Tentang "${item.title}":\n${msg}`;
        if (a === 'order') body = `📦 Pesanan jasa: "${item.title}"\nTanggal dibutuhkan: ${fmtDate(d.date)}\n\n${msg}`;
        if (a === 'apply') body = `📝 Penawaran untuk "${item.title}"\nHarga: ${rupiah(d.price)}\n\n${msg}`;
        await busy($('button.btn-primary', box), async () => {
          try {
            const cid = await DB.chat.start(o.id);
            await DB.chat.send(cid, body);
            closeModal();
            toast('Terkirim! Membuka percakapan…');
            setTimeout(() => (location.href = `pesan.html?c=${encodeURIComponent(cid)}`), 700);
          } catch (err) { fail(err); }
        });
      });
    });
  },

  async post(me) {
    const setTab = (id) => {
      $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.target === id));
      $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === id));
    };
    $$('.tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.target)));
    if (params.get('tab') === 'jasa' || (!params.get('tab') && me?.profile.role === 'provider')) setTab('form-jasa');
    if (!DB.configured) { $$('.post-form').forEach((f) => (f.innerHTML = notConfigured())); return; }
    if (!requireLogin(me)) return;

    const opts = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    $$('select[name=category]').forEach((s) => (s.innerHTML = '<option value="">Pilih kategori</option>' + opts));
    $('input[name=deadline]').min = daysFromNow(0);
    $('#form-permintaan [name=business]').value = me.profile.business_name || '';
    $('#form-permintaan [name=location]').value = me.profile.location || '';
    $('#form-jasa [name=location]').value = me.profile.location || '';
    $$('.post-as').forEach((el) => (el.innerHTML = `${avatar(me.profile, 'sm')}<span>Diposting sebagai <strong>${esc(me.profile.display_name)}</strong> · <a href="profil.html?edit=1">ubah profil</a></span>`));

    const validate = (form) => {
      let ok = true;
      $$('[required]', form).forEach((el) => {
        let bad = !el.value.trim() || (el.type === 'number' && (Number(el.value) < Number(el.min || 0) || Number(el.value) > Number(el.max || Infinity)));
        if (el.name === 'deadline' && el.value < daysFromNow(0)) bad = true;
        if (el.name === 'title' && el.value.trim().length < 3) bad = true;
        el.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      const days = $('.day-picker', form);
      if (days) {
        const bad = !$$('input:checked', days).length;
        days.closest('.field').classList.toggle('invalid', bad);
        if (bad) ok = false;
      }
      if (!ok) $('.field.invalid', form)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return ok;
    };
    $$('form.post-form').forEach((f) => f.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('invalid')));

    $('#form-permintaan form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!validate(f)) return toast('Lengkapi data yang wajib diisi', { error: true });
      const d = Object.fromEntries(new FormData(f));
      await busy($('button.btn-primary', f), async () => {
        try {
          const row = await DB.requests.create({
            title: d.title.trim(), category: d.category, business: d.business.trim(), description: d.description.trim(),
            budget: Number(d.budget), deadline: d.deadline, location: d.location.trim() || null,
          });
          toast('Permintaan berhasil dipasang!');
          setTimeout(() => (location.href = `detail.html?type=permintaan&id=${row.id}`), 700);
        } catch (err) { fail(err); }
      });
    });

    $('#form-jasa form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      if (!validate(f)) return toast('Lengkapi data yang wajib diisi', { error: true });
      const fd = new FormData(f), d = Object.fromEntries(fd);
      await busy($('button.btn-primary', f), async () => {
        try {
          const row = await DB.services.create({
            title: d.title.trim(), category: d.category, description: d.description.trim(), price: Number(d.price), unit: d.unit,
            hours: Number(d.hours), days: fd.getAll('days'), location: d.location.trim() || null, delivery: d.delivery.trim() || null,
            includes: (d.includes || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 10),
          });
          toast('Jasa kamu sudah tayang!');
          setTimeout(() => (location.href = `detail.html?type=jasa&id=${row.id}`), 700);
        } catch (err) { fail(err); }
      });
    });
  },

  async auth(me) {
    const form = $('#auth-form');
    const mode0 = ['daftar', 'lupa', 'reset'].includes(params.get('mode')) ? params.get('mode') : 'masuk';
    const next = safeNext(params.get('next'));
    if (me && mode0 !== 'reset') { location.href = next || 'profil.html'; return; }

    const copy = {
      masuk: ['Selamat datang kembali', 'Masuk untuk melanjutkan.', 'Masuk', 'Belum punya akun? <a data-mode="daftar">Daftar gratis</a>'],
      daftar: ['Buat akun JasaQ', 'Gratis, cuma butuh 1 menit.', 'Daftar', 'Sudah punya akun? <a data-mode="masuk">Masuk</a>'],
      lupa: ['Lupa kata sandi?', 'Masukkan emailmu, kami kirim link untuk membuat kata sandi baru.', 'Kirim link reset', '<a data-mode="masuk">← Kembali ke halaman masuk</a>'],
      reset: ['Buat kata sandi baru', 'Masukkan kata sandi baru untuk akunmu.', 'Simpan kata sandi', ''],
    };
    const setMode = (m) => {
      form.dataset.current = m;
      const [t, s, b, sw] = copy[m];
      $('#auth-title').textContent = t;
      $('#auth-sub').textContent = s;
      $('#auth-submit').textContent = b;
      $('#auth-switch').innerHTML = sw;
      $$('[data-modes]', form).forEach((el) => {
        const on = el.dataset.modes.split(' ').includes(m);
        el.hidden = !on;
        $$('input', el).forEach((i) => { if (i.dataset.req !== undefined) i.required = on; });
      });
      $('[name=password]').autocomplete = m === 'masuk' ? 'current-password' : 'new-password';
      toggleBiz();
      $('#auth-notice').hidden = true;
      form.hidden = false;
    };
    const toggleBiz = () => {
      const show = form.dataset.current === 'daftar' && $('input[name=role]:checked').value === 'umkm';
      $('#biz-field').hidden = !show;
      $('#biz-field input').required = show;
    };
    const notice = (title, html) => {
      form.hidden = true;
      const n = $('#auth-notice');
      n.hidden = false;
      n.innerHTML = `<div class="notice-icon">${ui.check}</div><h1>${esc(title)}</h1><p class="muted">${html}</p><button class="btn btn-outline" data-mode="masuk" style="margin-top:20px">Ke halaman masuk</button>`;
    };
    document.addEventListener('click', (e) => { const m = e.target.closest('[data-mode]')?.dataset.mode; if (m) { e.preventDefault(); setMode(m); } });
    $$('input[name=role]').forEach((r) => r.addEventListener('change', toggleBiz));
    setMode(mode0);
    if (mode0 === 'reset' && !me) notice('Link sudah tidak berlaku', 'Link reset kata sandi kedaluwarsa atau sudah dipakai. Minta link baru dari halaman masuk.');
    if (!DB.configured) { form.insertAdjacentHTML('afterbegin', notConfigured()); $('#auth-submit').disabled = true; return; }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const m = form.dataset.current;
      if ((m === 'daftar' || m === 'reset') && d.password.length < 8) return toast('Kata sandi minimal 8 karakter', { error: true });
      if ((m === 'daftar' || m === 'reset') && d.password !== d.password2) return toast('Konfirmasi kata sandi tidak sama', { error: true });
      await busy($('#auth-submit'), async () => {
        try {
          if (m === 'masuk') {
            await DB.auth.signIn(d.email.trim(), d.password);
            location.href = next || 'profil.html';
          } else if (m === 'daftar') {
            const r = await DB.auth.signUp({ email: d.email.trim(), password: d.password, name: d.name.trim(), role: d.role, business: (d.business || '').trim() });
            if (r.needsConfirm) notice('Cek emailmu', `Kami mengirim link konfirmasi ke <strong>${esc(d.email.trim())}</strong>. Klik link tersebut, lalu masuk ke akunmu.`);
            else location.href = next || 'profil.html?edit=1&welcome=1';
          } else if (m === 'lupa') {
            await DB.auth.resetPassword(d.email.trim());
            notice('Link terkirim', `Jika <strong>${esc(d.email.trim())}</strong> terdaftar, link reset kata sandi sudah dikirim ke email tersebut.`);
          } else if (m === 'reset') {
            await DB.auth.updatePassword(d.password);
            toast('Kata sandi berhasil diganti');
            setTimeout(() => (location.href = 'profil.html'), 800);
          }
        } catch (err) { fail(err); }
      });
    });
  },

  async profile(me) {
    const root = $('#profile-root');
    if (!DB.configured) { root.innerHTML = `<div class="container" style="padding-top:40px">${notConfigured()}</div>`; return; }
    const id = params.get('id'), uname = params.get('u');
    if (!id && !uname && !requireLogin(me)) return;
    root.innerHTML = '<div class="loading-block"><span class="spinner big"></span></div>';
    let p;
    try { p = id ? await DB.profiles.get(id) : uname ? await DB.profiles.byUsername(uname) : me.profile; }
    catch (e) { root.innerHTML = `<div class="container">${errorBox(e)}</div>`; return; }
    if (!p) { root.innerHTML = '<div class="container" style="padding-top:40px"><div class="empty"><h3>Profil tidak ditemukan</h3><p>Akun ini mungkin sudah dihapus.</p></div></div>'; return; }
    const isMe = me && p.id === me.id;
    if (isMe) p = me.profile;
    document.title = `${p.display_name} | JasaQ`;

    const [svc, req] = await Promise.all([
      DB.services.list({ ownerId: p.id }).catch(() => []),
      DB.requests.list({ ownerId: p.id }).catch(() => []),
    ]);
    renderProfileView(root, p, isMe, me, svc, req);
    if (isMe && params.get('edit')) renderProfileEdit(root, me, svc, req);
  },

  async chat(me) {
    if (!DB.configured) { $('#chat-root').innerHTML = notConfigured(); return; }
    if (!requireLogin(me)) return;
    await chatApp(me);
  },
};

// ---------- Listing pages ----------
async function setupListing({ load, card, filters, sorts, match, sort, noun }) {
  $('#filters').innerHTML = filters;
  $('#sort').innerHTML = sorts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  $('.search').insertAdjacentHTML('afterbegin', ui.search);
  if (params.get('q')) $('#q').value = params.get('q');
  if (params.get('kategori')) $$(`#filters input[name=cat][value="${CSS.escape(params.get('kategori'))}"]`).forEach((i) => (i.checked = true));
  $('.filter-toggle').addEventListener('click', () => $('#filter-form').classList.toggle('open'));
  if (!DB.configured) { $('#results').innerHTML = notConfigured(); return; }

  $('#results').innerHTML = skeleton(6);
  let data;
  try { data = await load(); } catch (e) { $('#results').innerHTML = errorBox(e); return; }

  const render = () => {
    const fd = new FormData($('#filter-form'));
    const f = { q: $('#q').value.trim().toLowerCase(), cat: fd.getAll('cat'), price: fd.get('price'), day: fd.getAll('day'), dl: fd.get('dl'), open: fd.get('open') };
    const list = sort(data.filter((x) => match(x, f)), $('#sort').value);
    $('#result-count').textContent = `Menampilkan ${list.length} ${noun}`;
    $('#results').innerHTML = list.length ? list.map(card).join('')
      : `<div class="empty"><h3>Belum ada ${noun} yang cocok</h3><p>Coba ubah kata kunci atau filter.</p></div>`;
  };
  $('#filter-form').addEventListener('change', render);
  $('#q').addEventListener('input', render);
  $('#sort').addEventListener('change', render);
  $('#reset-filters').addEventListener('click', () => { $('#filter-form').reset(); $('#q').value = ''; render(); });
  render();
}

// ---------- Profile ----------
const bannerDecor = () => `
  <svg class="bd-waves" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
    <path class="w1" d="M0 70c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v50H0z"/>
    <path class="w2" d="M0 85c120-25 240-25 360 0s240 25 360 0 240-25 360 0 240 25 360 0v35H0z"/>
  </svg>
  <div class="bd-bubbles" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<span style="left:${(i * 37) % 100}%;width:${8 + (i * 7) % 18}px;height:${8 + (i * 7) % 18}px;animation-delay:-${i * 0.9}s;animation-duration:${7 + (i % 5)}s"></span>`).join('')}</div>`;

function renderProfileView(root, p, isMe, me, svc, req) {
  const web = safeUrl(p.website);
  const links = [
    web && `<a href="${esc(web)}" target="_blank" rel="noopener noreferrer nofollow ugc">${ui.globe}${esc(web.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`,
    p.instagram && `<a href="https://instagram.com/${encodeURIComponent(p.instagram)}" target="_blank" rel="noopener noreferrer nofollow">${ui.insta}@${esc(p.instagram)}</a>`,
  ].filter(Boolean).join('');
  const tab = p.role === 'umkm' && req.length >= svc.length ? 'req' : 'svc';

  root.innerHTML = `
  <div class="profile-page" style="--theme:${esc(p.theme_color || '#3C8FFA')}">
    <section class="profile-banner banner-${esc(p.banner_style || 'waves')}">${bannerDecor()}</section>
    <div class="container profile-layout">
      <aside class="profile-card">
        <div class="profile-avatar">${avatar(p, 'xl')}</div>
        <h1>${esc(p.display_name)}</h1>
        ${p.username ? `<div class="muted">@${esc(p.username)}</div>` : ''}
        <div class="profile-badges"><span class="badge theme">${p.role === 'umkm' ? ui.briefcase : ui.user}${roleLabel(p.role)}</span></div>
        ${p.headline ? `<p class="profile-headline">${esc(p.headline)}</p>` : ''}
        <ul class="profile-facts">
          ${p.business_name ? `<li>${ui.briefcase}${esc(p.business_name)}</li>` : ''}
          ${p.location ? `<li>${ui.pin}${esc(p.location)}</li>` : ''}
          <li>${ui.cal}Bergabung ${p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : ''}</li>
        </ul>
        ${links ? `<div class="profile-links">${links}</div>` : ''}
        <div class="profile-actions">
          ${isMe
            ? `<button class="btn btn-theme btn-block" id="edit-profile">${ui.edit} Edit Profil</button>
               <button class="btn btn-ghost btn-block btn-sm" id="share-profile">Salin link profil</button>`
            : `<a class="btn btn-theme btn-block" href="pesan.html?to=${encodeURIComponent(p.id)}">${ui.chat} Kirim Pesan</a>`}
        </div>
      </aside>
      <div class="profile-main">
        <div class="panel"><h3>Tentang</h3>${p.bio ? `<p class="pre">${esc(p.bio)}</p>` : `<p class="muted">${isMe ? 'Kamu belum menulis bio. Klik "Edit Profil" untuk menambahkannya.' : 'Belum ada bio.'}</p>`}</div>
        ${p.skills?.length || isMe ? `<div class="panel"><h3>Keahlian</h3>${p.skills?.length ? `<div class="chips">${p.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join('')}</div>` : '<p class="muted">Belum ada keahlian yang ditambahkan.</p>'}</div>` : ''}
        <div class="panel">
          <div class="tabs small">
            <button class="tab ${tab === 'svc' ? 'active' : ''}" data-target="p-svc">Jasa (${svc.length})</button>
            <button class="tab ${tab === 'req' ? 'active' : ''}" data-target="p-req">Permintaan (${req.length})</button>
          </div>
          <div class="tab-panel ${tab === 'svc' ? 'active' : ''}" id="p-svc"><div class="grid-2">${svc.length ? svc.map(serviceCard).join('') : `<div class="empty">${isMe ? '<p>Kamu belum menawarkan jasa.</p><a class="btn btn-theme btn-sm" href="pasang.html?tab=jasa" style="margin-top:10px">Tawarkan Jasa</a>' : '<p>Belum ada jasa.</p>'}</div>`}</div></div>
          <div class="tab-panel ${tab === 'req' ? 'active' : ''}" id="p-req"><div class="grid-2">${req.length ? req.map(requestCard).join('') : `<div class="empty">${isMe ? '<p>Kamu belum memasang permintaan.</p><a class="btn btn-theme btn-sm" href="pasang.html?tab=permintaan" style="margin-top:10px">Pasang Permintaan</a>' : '<p>Belum ada permintaan.</p>'}</div>`}</div></div>
        </div>
      </div>
    </div>
  </div>`;

  $$('.profile-page .tab', root).forEach((t) => t.addEventListener('click', () => {
    $$('.profile-page .tab', root).forEach((x) => x.classList.toggle('active', x === t));
    $$('.profile-page .tab-panel', root).forEach((x) => x.classList.toggle('active', x.id === t.dataset.target));
  }));
  $('#edit-profile')?.addEventListener('click', () => renderProfileEdit(root, me, svc, req));
  $('#share-profile')?.addEventListener('click', async () => {
    const url = location.href.split('?')[0] + (p.username ? `?u=${p.username}` : `?id=${p.id}`);
    try { await navigator.clipboard.writeText(url); toast('Link profil disalin'); } catch { prompt('Salin link ini:', url); }
  });
}

// Resize to 512x512 and re-encode. Re-encoding also strips EXIF metadata (e.g. GPS location) from photos.
async function processAvatar(file) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran foto maksimal 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Foto tidak bisa dibaca.')); i.src = url; });
    const s = Math.min(img.naturalWidth, img.naturalHeight), size = Math.min(512, s);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
    let blob = await new Promise((r) => c.toBlob(r, 'image/webp', 0.88));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
    return blob;
  } finally { URL.revokeObjectURL(url); }
}

async function renderProfileEdit(root, me, svc, req) {
  const p = { ...me.profile };
  let priv = {};
  try { priv = (await DB.profiles.getPrivate()) || {}; } catch (e) { console.error(e); }
  let skills = [...(p.skills || [])], avatarBlob = null, removeAvatar = false, previewUrl = null;
  const welcome = params.get('welcome');

  root.innerHTML = `
  <div class="profile-page" style="--theme:${esc(p.theme_color || '#3C8FFA')}">
    <section class="profile-banner banner-${esc(p.banner_style || 'waves')}" id="pv-banner">${bannerDecor()}</section>
    <div class="container" style="max-width:860px">
      <form class="form-card profile-edit" id="profile-form" novalidate>
        ${welcome ? '<div class="note-box" style="margin-bottom:20px">🎉 Akun berhasil dibuat! Lengkapi profilmu agar lebih dipercaya.</div>' : ''}
        <div class="edit-head">
          <div class="avatar-edit">
            <div id="pv-avatar">${avatar(p, 'xl')}</div>
            <label class="avatar-btn" title="Ganti foto">${ui.camera}<input type="file" id="avatar-input" accept="image/png,image/jpeg,image/webp" hidden></label>
          </div>
          <div>
            <h2 style="margin:0">Edit profil</h2>
            <p class="muted">Foto otomatis diperkecil & data lokasi (EXIF) di dalam foto dihapus.</p>
            <button type="button" class="btn btn-ghost btn-sm" id="avatar-remove" ${p.avatar_url ? '' : 'hidden'}>Hapus foto</button>
          </div>
        </div>

        <h4 class="form-section">Tampilan profil</h4>
        <div class="field"><label>Warna tema</label>
          <div class="swatches">${THEME_COLORS.map((c) => `<label class="swatch" style="--c:${c}"><input type="radio" name="theme_color" value="${c}" ${c.toLowerCase() === (p.theme_color || '').toLowerCase() ? 'checked' : ''}><span></span></label>`).join('')}
            <label class="swatch custom" title="Warna lain"><input type="color" id="custom-color" value="${esc(p.theme_color || '#3C8FFA')}"><span>+</span></label></div></div>
        <div class="field"><label>Gaya banner</label>
          <div class="seg">${[['waves', '🌊 Ombak'], ['bubbles', '🫧 Gelembung'], ['plain', 'Polos']].map(([v, l]) => `<label><input type="radio" name="banner_style" value="${v}" ${p.banner_style === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>

        <h4 class="form-section">Info publik <span class="muted" style="font-weight:500">· terlihat oleh semua orang</span></h4>
        <div class="field-row">
          <div class="field"><label>Nama tampilan *</label><input class="input" name="display_name" required maxlength="60" value="${esc(p.display_name)}"><span class="error">Nama wajib diisi</span></div>
          <div class="field"><label>Username</label><input class="input" name="username" maxlength="20" placeholder="mis. nadia_design" value="${esc(p.username || '')}"><span class="hint">3–20 huruf kecil, angka, atau _</span><span class="error">Format username tidak valid</span></div>
        </div>
        <div class="field"><label>Saya adalah</label>
          <div class="seg">${[['provider', 'Penyedia Jasa'], ['umkm', 'UMKM']].map(([v, l]) => `<label><input type="radio" name="role" value="${v}" ${p.role === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
        <div class="field"><label>Headline</label><input class="input" name="headline" maxlength="80" placeholder="mis. Mahasiswa DKV · Desain poster & logo" value="${esc(p.headline || '')}"></div>
        <div class="field-row">
          <div class="field"><label>Nama usaha</label><input class="input" name="business_name" maxlength="80" placeholder="Untuk UMKM" value="${esc(p.business_name || '')}"></div>
          <div class="field"><label>Kota</label><input class="input" name="location" maxlength="60" placeholder="mis. Bandung" value="${esc(p.location || '')}"></div>
        </div>
        <div class="field"><label>Bio</label><textarea class="input" name="bio" maxlength="600" placeholder="Ceritakan tentang dirimu, pengalaman, atau usahamu.">${esc(p.bio || '')}</textarea><span class="hint" id="bio-count"></span></div>
        <div class="field"><label>Keahlian <span class="muted" style="font-weight:500">(maks. 12)</span></label>
          <div class="chip-input"><div class="chips" id="skill-chips"></div><input id="skill-input" maxlength="30" placeholder="Ketik lalu tekan Enter, mis. Canva"></div></div>
        <div class="field-row">
          <div class="field"><label>Website / portofolio</label><input class="input" name="website" maxlength="200" placeholder="https://behance.net/kamu" value="${esc(p.website || '')}"><span class="error">Link harus diawali https://</span></div>
          <div class="field"><label>Instagram</label><input class="input" name="instagram" maxlength="31" placeholder="username tanpa @" value="${esc(p.instagram || '')}"><span class="error">Username Instagram tidak valid</span></div>
        </div>

        <h4 class="form-section">${ui.lock} Info privat <span class="muted" style="font-weight:500">· hanya kamu yang bisa melihat</span></h4>
        <div class="private-box">
          <div class="field"><label>Email akun</label><input class="input" value="${esc(me.email || '')}" disabled></div>
          <div class="field"><label>Nomor HP / WhatsApp</label><input class="input" name="phone" maxlength="20" placeholder="+62 812 3456 7890" value="${esc(priv.phone || '')}">
            <span class="hint">Disimpan terpisah dan dilindungi database: pengguna lain tidak bisa membacanya.</span><span class="error">Nomor HP tidak valid</span></div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" id="cancel-edit">Batal</button>
          <button class="btn btn-theme btn-lg" id="save-profile">Simpan Profil</button>
        </div>

        <details class="danger-zone">
          <summary>Pengaturan akun</summary>
          <div class="field" style="margin-top:16px"><label>Ganti kata sandi</label>
            <div class="inline-form"><input class="input" type="password" id="new-pass" minlength="8" autocomplete="new-password" placeholder="Kata sandi baru (min. 8 karakter)"><button type="button" class="btn btn-outline" id="change-pass">Ganti</button></div></div>
          <div class="field"><label class="text-danger">Hapus akun</label>
            <p class="muted" style="font-size:.9rem">Menghapus akun, profil, foto, semua jasa, permintaan, dan pesanmu secara permanen.</p>
            <div><button type="button" class="btn btn-danger-outline" id="delete-account">Hapus akun saya</button></div></div>
        </details>
      </form>
    </div>
  </div>`;

  const form = $('#profile-form');
  const page = $('.profile-page', root);
  const banner = $('#pv-banner');

  // Live preview of theme + banner style
  const setTheme = (c) => page.style.setProperty('--theme', c);
  $$('input[name=theme_color]', form).forEach((r) => r.addEventListener('change', () => setTheme(r.value)));
  $('#custom-color').addEventListener('input', (e) => { $$('input[name=theme_color]', form).forEach((r) => (r.checked = false)); setTheme(e.target.value); });
  $$('input[name=banner_style]', form).forEach((r) => r.addEventListener('change', () => { banner.className = `profile-banner banner-${r.value}`; }));

  const bio = $('[name=bio]', form);
  const bioCount = () => ($('#bio-count').textContent = `${bio.value.length}/600`);
  bio.addEventListener('input', bioCount);
  bioCount();

  const renderSkills = () => {
    $('#skill-chips').innerHTML = skills.map((s, i) => `<span class="chip">${esc(s)}<button type="button" data-i="${i}" aria-label="Hapus ${esc(s)}">×</button></span>`).join('');
  };
  $('#skill-chips').addEventListener('click', (e) => { const i = e.target.dataset.i; if (i !== undefined) { skills.splice(Number(i), 1); renderSkills(); } });
  $('#skill-input').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const v = e.target.value.trim().replace(/,$/, '');
    if (!v) return;
    if (skills.length >= 12) return toast('Maksimal 12 keahlian', { error: true });
    if (!skills.some((s) => s.toLowerCase() === v.toLowerCase())) skills.push(v);
    e.target.value = '';
    renderSkills();
  });
  renderSkills();

  $('#avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      avatarBlob = await processAvatar(file);
      removeAvatar = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(avatarBlob);
      $('#pv-avatar').innerHTML = `<img class="avatar xl" src="${previewUrl}" alt="">`;
      $('#avatar-remove').hidden = false;
    } catch (err) { toast(err.message, { error: true }); }
    e.target.value = '';
  });
  $('#avatar-remove').addEventListener('click', () => {
    avatarBlob = null;
    removeAvatar = true;
    $('#pv-avatar').innerHTML = avatar({ display_name: $('[name=display_name]', form).value }, 'xl');
    $('#avatar-remove').hidden = true;
  });

  $('#cancel-edit').addEventListener('click', () => {
    history.replaceState(null, '', 'profil.html');
    renderProfileView(root, me.profile, true, me, svc, req);
  });
  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('invalid'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    let website = (d.website || '').trim();
    if (website && !/^https?:\/\//i.test(website)) website = 'https://' + website;
    const fields = {
      display_name: d.display_name.trim(),
      username: d.username.trim().toLowerCase() || null,
      role: d.role,
      headline: d.headline.trim() || null,
      business_name: d.business_name.trim() || null,
      location: d.location.trim() || null,
      bio: d.bio.trim() || null,
      skills,
      website: website || null,
      instagram: d.instagram.trim().replace(/^@/, '') || null,
      theme_color: d.theme_color || $('#custom-color').value,
      banner_style: d.banner_style || 'waves',
    };
    const phone = d.phone.trim() || null;
    const checks = [
      ['display_name', !fields.display_name],
      ['username', fields.username && !/^[a-z0-9_]{3,20}$/.test(fields.username)],
      ['website', fields.website && !safeUrl(fields.website)],
      ['instagram', fields.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(fields.instagram)],
      ['phone', phone && !/^\+?[0-9 \-]{6,20}$/.test(phone)],
    ];
    let ok = true;
    checks.forEach(([n, bad]) => { $(`[name=${n}]`, form).closest('.field').classList.toggle('invalid', !!bad); if (bad) ok = false; });
    if (!/^#[0-9a-f]{6}$/i.test(fields.theme_color)) fields.theme_color = '#3C8FFA';
    if (!ok) { $('.field.invalid', form).scrollIntoView({ behavior: 'smooth', block: 'center' }); return toast('Periksa kembali isian yang ditandai', { error: true }); }

    await busy($('#save-profile'), async () => {
      try {
        const avatarChanged = avatarBlob || removeAvatar;
        if (avatarBlob) fields.avatar_url = await DB.profiles.uploadAvatar(avatarBlob);
        if (removeAvatar) fields.avatar_url = null;
        await DB.profiles.update(fields);
        if (phone !== (priv.phone || null)) await DB.profiles.savePrivate({ phone });
        if (avatarChanged) DB.profiles.removeAvatars(fields.avatar_url || '').catch(() => {});
        toast('Profil tersimpan');
        history.replaceState(null, '', 'profil.html');
        renderLayout(me);
        startInboxBadgeOnly();
        renderProfileView(root, me.profile, true, me, svc, req);
        scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) { fail(err); }
    });
  });

  $('#change-pass').addEventListener('click', async (e) => {
    const v = $('#new-pass').value;
    if (v.length < 8) return toast('Kata sandi minimal 8 karakter', { error: true });
    await busy(e.currentTarget, async () => {
      try { await DB.auth.updatePassword(v); $('#new-pass').value = ''; toast('Kata sandi berhasil diganti'); } catch (err) { fail(err); }
    });
  });

  $('#delete-account').addEventListener('click', async () => {
    const box = openModal(`<h3 class="text-danger">Hapus akun permanen?</h3>
      <p class="muted" style="margin-bottom:16px">Semua data kamu akan dihapus dan tidak bisa dikembalikan. Ketik <strong>HAPUS</strong> untuk konfirmasi.</p>
      <input class="input" id="del-confirm" autocomplete="off" placeholder="HAPUS">
      <div class="modal-actions" style="margin-top:16px"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="del-go">Hapus akun</button></div>`);
    $('#del-go', box).addEventListener('click', async (ev) => {
      if ($('#del-confirm', box).value.trim() !== 'HAPUS') return toast('Ketik HAPUS untuk konfirmasi', { error: true });
      await busy(ev.currentTarget, async () => {
        window.__leaving = true;
        try { await DB.auth.deleteAccount(); closeModal(); toast('Akun kamu sudah dihapus'); setTimeout(() => (location.href = 'index.html'), 900); }
        catch (err) { fail(err); }
      });
    });
  });
}
// After re-rendering the header, restore the unread badge.
const startInboxBadgeOnly = () => window.JasaQRefreshUnread && window.JasaQRefreshUnread();

// ---------- Chat ----------
async function chatApp(me) {
  const root = $('#chat-root');
  const state = { convs: [], active: null, msgs: [] };
  root.innerHTML = `
    <aside class="chat-list">
      <div class="chat-list-head"><h2>Pesan</h2><span class="muted" style="font-size:.8rem">${ui.lock} Hanya bisa dibaca kamu & lawan bicaramu</span></div>
      <div class="search chat-search">${ui.search}<input class="input" id="conv-q" placeholder="Cari nama…" aria-label="Cari percakapan"></div>
      <div id="conv-list" class="conv-list"><div class="loading-block"><span class="spinner"></span></div></div>
    </aside>
    <section class="chat-pane" id="chat-pane">
      <div class="chat-empty">${ui.chat}<h3>Pilih percakapan</h3><p class="muted">Mulai chat dari halaman jasa, permintaan, atau profil pengguna.</p></div>
    </section>`;

  const listEl = $('#conv-list'), pane = $('#chat-pane');

  const renderList = () => {
    const q = $('#conv-q').value.trim().toLowerCase();
    const list = state.convs.filter((c) => !q || (c.other?.display_name || '').toLowerCase().includes(q));
    listEl.innerHTML = list.length ? list.map((c) => `
      <button class="conv ${state.active === c.id ? 'active' : ''} ${c.unread ? 'unread' : ''}" data-id="${esc(c.id)}">
        ${avatar(c.other || 'Pengguna')}
        <span class="conv-body">
          <span class="conv-top"><strong>${esc(c.other?.display_name || 'Pengguna dihapus')}</strong><small>${c.last_message ? shortTime(c.last_message_at) : ''}</small></span>
          <span class="conv-last">${esc(c.last_message || 'Belum ada pesan')}</span>
        </span>
        ${c.unread ? `<span class="nav-badge">${c.unread > 9 ? '9+' : c.unread}</span>` : ''}
      </button>`).join('')
      : `<div class="empty small">${state.convs.length ? 'Tidak ada yang cocok.' : 'Belum ada percakapan.<br>Cari jasa atau permintaan, lalu klik "Kirim Pesan".'}</div>`;
  };
  const loadList = async () => { state.convs = await DB.chat.list(); renderList(); };

  const tick = (m) => (m.sender_id === me.id ? `<span class="tick ${m.read_at ? 'read' : ''}" title="${m.read_at ? 'Dibaca' : 'Terkirim'}">${m.read_at ? '✓✓' : '✓'}</span>` : '');
  const msgHtml = (m, prev) => {
    const sep = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
      ? `<div class="day-sep"><span>${dayLabel(m.created_at)}</span></div>` : '';
    return `${sep}<div class="msg ${m.sender_id === me.id ? 'me' : ''}" data-id="${m.id}"><div class="bubble-msg">${esc(m.body)}</div><div class="msg-meta">${clock(m.created_at)} ${tick(m)}</div></div>`;
  };
  const scrollDown = (smooth) => { const box = $('#msgs'); if (box) box.scrollTo({ top: box.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); };
  const appendMsg = (m) => {
    if (state.msgs.some((x) => x.id === m.id)) return;
    const box = $('#msgs');
    const prev = state.msgs[state.msgs.length - 1];
    state.msgs.push(m);
    $('.chat-start', box)?.remove();
    box.insertAdjacentHTML('beforeend', msgHtml(m, prev));
    scrollDown(true);
  };
  const updateConvPreview = (m) => {
    const c = state.convs.find((x) => x.id === m.conversation_id);
    if (!c) return false;
    c.last_message = m.body.slice(0, 120);
    c.last_message_at = m.created_at;
    state.convs.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    return true;
  };

  async function open(cid, prefill = '') {
    let c = state.convs.find((x) => x.id === cid);
    if (!c) { await loadList(); c = state.convs.find((x) => x.id === cid); }
    if (!c) { toast('Percakapan tidak ditemukan', { error: true }); return; }
    state.active = cid;
    state.msgs = [];
    history.replaceState(null, '', `pesan.html?c=${encodeURIComponent(cid)}`);
    root.classList.add('pane-open');
    const o = c.other;
    pane.innerHTML = `
      <header class="chat-head">
        <button class="icon-btn chat-back" aria-label="Kembali">${ui.back}</button>
        ${o ? `<a class="mini-row" href="profil.html?id=${encodeURIComponent(o.id)}">${avatar(o, 'sm')}<span><strong>${esc(o.display_name)}</strong><small class="muted" style="display:block">${esc(o.headline || roleLabel(o.role))}</small></span></a>` : '<strong>Pengguna dihapus</strong>'}
      </header>
      <div class="msgs" id="msgs"><div class="loading-block"><span class="spinner"></span></div></div>
      <form class="composer" id="composer">
        <textarea class="input" id="msg-input" rows="1" maxlength="2000" placeholder="Tulis pesan…" aria-label="Tulis pesan"></textarea>
        <button class="btn btn-primary send-btn" aria-label="Kirim">${ui.send}</button>
      </form>`;
    renderList();
    $('.chat-back').addEventListener('click', () => { root.classList.remove('pane-open'); state.active = null; renderList(); history.replaceState(null, '', 'pesan.html'); });

    const input = $('#msg-input');
    const grow = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; };
    input.value = prefill;
    input.addEventListener('input', grow);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#composer').requestSubmit(); } });
    $('#composer').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = input.value.trim();
      if (!body || !o) return;
      const btn = $('.send-btn');
      btn.disabled = true;
      try {
        const row = await DB.chat.send(cid, body);
        input.value = '';
        grow();
        appendMsg(row);
        updateConvPreview(row);
        renderList();
      } catch (err) { fail(err); } finally { btn.disabled = false; input.focus(); }
    });
    if (!o) { input.disabled = true; input.placeholder = 'Akun ini sudah dihapus'; }

    try {
      const msgs = await DB.chat.messages(cid);
      if (state.active !== cid) return;
      state.msgs = msgs;
      $('#msgs').innerHTML = msgs.length ? msgs.map((m, i) => msgHtml(m, msgs[i - 1])).join('')
        : `<div class="chat-start">${avatar(o || 'Pengguna', 'lg')}<p>Mulai percakapan dengan <strong>${esc(o?.display_name || '')}</strong>.<br><span class="muted">${ui.lock} Hanya kalian berdua yang bisa membaca pesan ini.</span></p></div>`;
      scrollDown(false);
      grow();
      input.focus();
      if (c.unread) { c.unread = 0; renderList(); await DB.chat.markRead(cid); window.JasaQRefreshUnread?.(); }
    } catch (err) { $('#msgs').innerHTML = errorBox(err); }
  }

  listEl.addEventListener('click', (e) => { const b = e.target.closest('.conv'); if (b) open(b.dataset.id); });
  $('#conv-q').addEventListener('input', renderList);

  window.addEventListener('jasaq:message', async (e) => {
    const m = e.detail;
    if (!updateConvPreview(m)) await loadList().catch(() => {});
    const c = state.convs.find((x) => x.id === m.conversation_id);
    if (state.active === m.conversation_id && !document.hidden) {
      appendMsg(m);
      if (m.sender_id !== me.id) DB.chat.markRead(m.conversation_id).catch(() => {});
    } else if (c && m.sender_id !== me.id) {
      c.unread = (c.unread || 0) + 1;
      if (state.active === m.conversation_id) appendMsg(m);
    }
    renderList();
    window.JasaQRefreshUnread?.();
  });
  window.addEventListener('jasaq:message-update', (e) => {
    const m = e.detail;
    const x = state.msgs.find((y) => y.id === m.id);
    if (!x) return;
    x.read_at = m.read_at;
    const el = $(`.msg[data-id="${m.id}"] .msg-meta`);
    if (el) el.innerHTML = `${clock(x.created_at)} ${tick(x)}`;
  });
  // Mark as read when the user comes back to the tab.
  document.addEventListener('visibilitychange', () => {
    const c = state.convs.find((x) => x.id === state.active);
    if (!document.hidden && c && c.unread) { c.unread = 0; renderList(); DB.chat.markRead(c.id).then(() => window.JasaQRefreshUnread?.()).catch(() => {}); }
  });

  try { await loadList(); } catch (err) { listEl.innerHTML = errorBox(err); return; }

  const to = params.get('to'), cParam = params.get('c');
  if (to && to !== me.id) {
    try { const cid = await DB.chat.start(to); await loadList(); await open(cid, (params.get('text') || '').slice(0, 2000)); } catch (err) { fail(err); }
  } else if (cParam) await open(cParam);
}

// ---------- Intro / splash ----------
function runIntro() {
  const html = document.documentElement;
  const el = $('#intro');
  const reveal = () => html.classList.add('ready');
  if (!el || !html.classList.contains('intro-active')) { el?.remove(); reveal(); return; }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem('jasaq_intro', '1'); } catch {}
    el.classList.add('hide');
    setTimeout(() => { html.classList.remove('intro-active'); reveal(); }, 700);
    setTimeout(() => el.remove(), 1300);
  };
  const timer = setTimeout(finish, 2900);
  const skip = () => { clearTimeout(timer); finish(); };
  el.addEventListener('click', skip);
  document.addEventListener('keydown', (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip(); }, { once: true });
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', async () => {
  runIntro();
  let me = null;
  try { me = await DB.init(); } catch (e) { console.error('Auth init failed', e); }
  renderLayout(me);
  if (me) { try { startInbox(me); } catch (e) { console.error(e); } }
  DB.auth.onChange((event) => { if (event === 'SIGNED_OUT' && me && !window.__leaving) location.reload(); });
  const page = document.body.dataset.page;
  try { await Pages[page]?.(me); } catch (e) { fail(e); }
});
