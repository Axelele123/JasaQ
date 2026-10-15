// JasaQ data layer (Supabase).
// Access control is enforced in the database by Row Level Security (supabase/schema.sql),
// so even someone calling the API directly can't read or change other people's private data.
const DB = (() => {
  const cfg = window.JASAQ_CONFIG || {};
  const configured = Boolean(
    window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !/YOUR_/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY)
  );
  const sb = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const PUBLIC_PROFILE = 'id,username,display_name,role,headline,location,avatar_url,business_name,theme_color';
  const cache = new Map();
  let me = null; // { id, email, profile }

  const need = () => { if (!sb) throw new Error('NOT_CONFIGURED'); };
  const needMe = () => { need(); if (!me) throw new Error('NOT_LOGGED_IN'); };
  const run = async (q) => { const { data, error } = await q; if (error) throw error; return data; };
  const countOf = async (q) => { const { count, error } = await q; if (error) throw error; return count || 0; };
  const remember = (p) => { if (p) cache.set(p.id, { ...cache.get(p.id), ...p }); return p; };
  const isBadId = (e) => e && e.code === '22P02'; // invalid uuid in URL

  async function attach(rows, key = 'owner_id', as = 'owner') {
    const ids = [...new Set(rows.map((r) => r[key]).filter(Boolean))].filter((id) => !cache.has(id));
    if (ids.length) (await run(sb.from('profiles').select(PUBLIC_PROFILE).in('id', ids))).forEach(remember);
    rows.forEach((r) => { r[as] = r[key] ? cache.get(r[key]) || null : null; });
    return rows;
  }

  // ---------- Auth ----------
  async function loadMe(session) {
    if (!session) return (me = null);
    const profile = await run(sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle());
    me = { id: session.user.id, email: session.user.email, profile: remember(profile) || { id: session.user.id, display_name: 'Pengguna JasaQ' } };
    return me;
  }
  async function init() {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return loadMe(data.session);
  }
  const siteUrl = (page) => location.origin + location.pathname.replace(/[^/]*$/, '') + page;

  const auth = {
    async signUp({ email, password, name, role, business }) {
      need();
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { display_name: name, role, business_name: business || null }, emailRedirectTo: siteUrl('masuk.html') },
      });
      if (error) throw error;
      if (data.session) await loadMe(data.session);
      return { needsConfirm: !data.session };
    },
    async signIn(email, password) {
      need();
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return loadMe(data.session);
    },
    async signOut() { need(); await sb.auth.signOut(); me = null; },
    async resetPassword(email) {
      need();
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl('masuk.html?mode=reset') });
      if (error) throw error;
    },
    async updatePassword(password) {
      needMe();
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
    },
    async deleteAccount() {
      needMe();
      await profiles.removeAvatars().catch(() => {});
      await run(sb.rpc('delete_my_account'));
      await sb.auth.signOut();
      me = null;
    },
    onChange(cb) { if (sb) sb.auth.onAuthStateChange((event) => cb(event)); },
  };

  // ---------- Profiles ----------
  const profiles = {
    async get(id) {
      need();
      try { return remember(await run(sb.from('profiles').select('*').eq('id', id).maybeSingle())); }
      catch (e) { if (isBadId(e)) return null; throw e; }
    },
    async byUsername(username) {
      need();
      return remember(await run(sb.from('profiles').select('*').eq('username', String(username).toLowerCase()).maybeSingle()));
    },
    async update(fields) {
      needMe();
      const row = await run(sb.from('profiles').update(fields).eq('id', me.id).select().single());
      me.profile = remember(row);
      return row;
    },
    async getPrivate() { needMe(); return run(sb.from('profile_private').select('*').eq('id', me.id).maybeSingle()); },
    async savePrivate(fields) { needMe(); return run(sb.from('profile_private').update(fields).eq('id', me.id)); },
    async uploadAvatar(blob) {
      needMe();
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${me.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from('avatars').upload(path, blob, { contentType: blob.type, cacheControl: '3600', upsert: false });
      if (error) throw error;
      return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    },
    // Remove old avatar files (keepUrl = the one still in use).
    async removeAvatars(keepUrl = '') {
      needMe();
      const files = await run(sb.storage.from('avatars').list(me.id));
      const paths = (files || []).map((f) => `${me.id}/${f.name}`).filter((p) => !keepUrl.endsWith(p));
      if (paths.length) await run(sb.storage.from('avatars').remove(paths));
    },
  };

  // ---------- Listings ----------
  const listing = (table) => ({
    async list({ limit, ownerId } = {}) {
      need();
      let q = sb.from(table).select('*').order('created_at', { ascending: false });
      if (ownerId) q = q.eq('owner_id', ownerId);
      if (limit) q = q.limit(limit);
      return attach(await run(q));
    },
    async get(id) {
      need();
      try {
        const row = await run(sb.from(table).select('*').eq('id', id).maybeSingle());
        return row ? (await attach([row]))[0] : null;
      } catch (e) { if (isBadId(e)) return null; throw e; }
    },
    async create(fields) { needMe(); return run(sb.from(table).insert(fields).select().single()); },
    async update(id, fields) { needMe(); return run(sb.from(table).update(fields).eq('id', id).select().single()); },
    async remove(id) {
      needMe();
      const rows = await run(sb.from(table).delete().eq('id', id).select('id'));
      if (!rows.length) throw new Error('NOT_ALLOWED');
    },
    count() { need(); return countOf(sb.from(table).select('id', { count: 'exact', head: true })); },
  });
  const services = listing('services');
  const requests = listing('requests');
  services.categoryCounts = async () => {
    need();
    return (await run(sb.from('services').select('category'))).reduce((m, r) => ((m[r.category] = (m[r.category] || 0) + 1), m), {});
  };

  async function stats() {
    need();
    const [s, r, u] = await Promise.all([
      services.count(), requests.count(),
      countOf(sb.from('profiles').select('id', { count: 'exact', head: true })),
    ]);
    return { services: s, requests: r, users: u };
  }

  // ---------- Chat ----------
  const chat = {
    start(otherId) { needMe(); return run(sb.rpc('start_conversation', { other: otherId })); },
    async list() {
      needMe();
      const convs = await run(sb.from('conversations').select('*').order('last_message_at', { ascending: false }));
      convs.forEach((c) => { c.other_id = c.user_a === me.id ? c.user_b : c.user_a; });
      await attach(convs, 'other_id', 'other');
      const unread = await run(sb.from('messages').select('conversation_id').is('read_at', null).neq('sender_id', me.id));
      const n = unread.reduce((m, r) => ((m[r.conversation_id] = (m[r.conversation_id] || 0) + 1), m), {});
      convs.forEach((c) => { c.unread = n[c.id] || 0; });
      return convs;
    },
    async messages(convId) {
      needMe();
      const rows = await run(sb.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: false }).limit(200));
      return rows.reverse();
    },
    send(convId, body) { needMe(); return run(sb.from('messages').insert({ conversation_id: convId, body }).select().single()); },
    markRead(convId) { needMe(); return run(sb.rpc('mark_read', { conv: convId })); },
    unreadCount() {
      needMe();
      return countOf(sb.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', me.id));
    },
    // Realtime: the server only delivers rows this user is allowed to read (RLS).
    subscribe({ onInsert, onUpdate }) {
      needMe();
      return sb.channel('inbox-' + me.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => onInsert && onInsert(p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (p) => onUpdate && onUpdate(p.new))
        .subscribe();
    },
  };

  function errMsg(e) {
    const m = String((e && (e.message || e.error_description)) || e || '');
    const code = e && e.code;
    if (m === 'NOT_CONFIGURED') return 'Database belum terhubung. Isi assets/js/config.js (lihat docs/DATABASE.md).';
    if (m === 'NOT_LOGGED_IN') return 'Silakan masuk terlebih dahulu.';
    if (m === 'NOT_ALLOWED' || code === '42501' || /row-level security/i.test(m)) return 'Kamu tidak punya izin untuk aksi ini.';
    if (/Invalid login credentials/i.test(m)) return 'Email atau kata sandi salah.';
    if (/Email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk emailmu.';
    if (/already registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.';
    if (/Password should|password.*(short|weak)/i.test(m)) return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
    if (/rate limit|too many/i.test(m)) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
    if (code === '23505' && /username/i.test(m)) return 'Username sudah dipakai orang lain.';
    if (code === '23514') return 'Ada isian yang formatnya tidak sesuai. Periksa kembali.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Tidak bisa terhubung ke server. Cek koneksi internetmu.';
    return m || 'Terjadi kesalahan. Coba lagi.';
  }

  return {
    configured, init, auth, profiles, services, requests, stats, chat, errMsg,
    get me() { return me; },
  };
})();
