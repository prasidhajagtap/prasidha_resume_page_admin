/*!
 * Prasidha Jagtap — personal website
 * Designed & developed by Prasidha Jagtap · https://prasidhajagtap.github.io/prasidha_jagtap/
 * © 2026 Prasidha Jagtap. All rights reserved. Not licensed for reuse.
 */
// Admin page: one-time email link sign-in (Supabase Auth), then reads the daily
// totals. Only the admin email in the database may read them (row-level security).
(function () {
  var root = document.documentElement;
  var cfg = window.SITE_COUNTER || {};
  var API = (cfg.url || '').replace(/\/$/, '');
  var KEY = cfg.anonKey || '';
  var $ = function (s) { return document.querySelector(s); };
  var views = document.querySelectorAll('[data-view]');
  function show(name) { for (var i = 0; i < views.length; i++) views[i].hidden = views[i].getAttribute('data-view') !== name; }
  function fail(msg) { var e = $('[data-error]'); e.textContent = msg; e.hidden = !msg; }
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }

  // ---------- Theme toggle (same as the main site) ----------
  var themeBtn = $('[data-theme-toggle]');
  function applyTheme(dark) {
    if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
    if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  applyTheme(root.getAttribute('data-theme') === 'dark');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') !== 'dark';
    applyTheme(dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  if (!API || !KEY) { show('setup'); return; }

  // ---------- Session ----------
  function saveSession(s) {
    store('pj_at', s.access_token); store('pj_rt', s.refresh_token);
    store('pj_exp', String(Date.now() + (Number(s.expires_in) || 3600) * 1000 - 60000));
  }
  function clearSession() { store('pj_at', null); store('pj_rt', null); store('pj_exp', null); }
  // Coming back from the email link: tokens arrive in the address after "#"
  if (location.hash.indexOf('access_token=') !== -1) {
    var h = {};
    location.hash.slice(1).split('&').forEach(function (p) { var kv = p.split('='); h[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
    if (h.access_token) saveSession(h);
    history.replaceState(null, '', location.pathname + location.search);
  } else if (location.hash.indexOf('error') !== -1) {
    history.replaceState(null, '', location.pathname + location.search);
    fail('That sign-in link has expired or was already used. Please ask for a new one.');
  }

  function token() {
    var at = read('pj_at'), exp = Number(read('pj_exp') || 0), rt = read('pj_rt');
    if (at && Date.now() < exp) return Promise.resolve(at);
    if (!rt) return Promise.resolve(null);
    return fetch(API + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s && s.access_token) { saveSession(s); return s.access_token; } clearSession(); return null; })
      .catch(function () { return null; });
  }

  // ---------- Sign in ----------
  var form = $('[data-login]'), msg = $('[data-login-msg]');
  var sendBtn = form.querySelector('button[type="submit"]'), lockUntil = 0, lockTimer = null;
  // After each request the button rests for 60 s (Supabase also limits sign-in emails on its side)
  function lock(seconds) {
    lockUntil = Date.now() + seconds * 1000; sendBtn.disabled = true;
    clearInterval(lockTimer);
    var tick = function () {
      var left = Math.ceil((lockUntil - Date.now()) / 1000);
      if (left <= 0) { clearInterval(lockTimer); sendBtn.disabled = false; sendBtn.textContent = 'Send sign-in link'; return; }
      sendBtn.textContent = 'Wait ' + left + ' s';
    };
    tick(); lockTimer = setInterval(tick, 1000);
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (Date.now() < lockUntil) return;
    var email = $('#adm-email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter a valid email.'; return; }
    msg.textContent = 'Sending…';
    lock(60);
    var back = location.href.split('#')[0];
    fetch(API + '/auth/v1/otp?redirect_to=' + encodeURIComponent(back), {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, create_user: false })
    }).then(function (r) {
      // Same message either way, so the page never reveals which emails exist
      msg.textContent = r.status === 429 ? 'Too many tries. Please wait a minute and try again.'
        : 'If that email is the admin, a sign-in link is on its way. Open it on this device.';
    }).catch(function () { msg.textContent = 'Could not reach the server. Check your connection.'; });
  });

  $('[data-signout]').addEventListener('click', function () {
    var at = read('pj_at');
    if (at) fetch(API + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + at } }).catch(function () {});
    clearSession(); start();
  });
  $('[data-refresh]').addEventListener('click', function () { load(); });

  // ---------- "Don't count me" on this device ----------
  var noCount = $('[data-nocount]');
  try { noCount.checked = localStorage.getItem('pj_nocount') === '1'; } catch (e) {}
  noCount.addEventListener('change', function () {
    try { if (noCount.checked) localStorage.setItem('pj_nocount', '1'); else localStorage.removeItem('pj_nocount'); } catch (e) {}
  });

  // ---------- Data ----------
  var fmt = function (n) { return Number(n || 0).toLocaleString('en-IN'); };
  function istToday() {
    var d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
    return d.toISOString().slice(0, 10);
  }
  function addDays(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function nice(iso) { var d = new Date(iso + 'T00:00:00Z'); return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }

  function load() {
    fail('');
    return token().then(function (at) {
      if (!at) { start(); return; }
      var get = function (path) {
        return fetch(API + '/rest/v1/' + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + at } }).then(function (r) {
          if (r.status === 401) { var e = new Error('auth'); e.auth = true; throw e; }
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
      };
      return Promise.all([
        get('site_daily?select=day,views,visitors,likes,dislikes&order=day.desc&limit=1000'),
        get('site_feedback?select=at,vote,answers,note&order=at.desc&limit=200')
      ]).then(function (res) { render(res[0]); renderFeedback(res[1]); })
        .catch(function (e) { if (e.auth) { clearSession(); start(); } else throw e; });
    }).catch(function () { fail('Could not load the numbers. Please try Refresh.'); });
  }

  function render(rows) {
    show('stats');
    $('[data-refresh]').hidden = false; $('[data-signout]').hidden = false;
    var byDay = {}, tot = { views: 0, visitors: 0, likes: 0, dislikes: 0 };
    rows.forEach(function (r) { byDay[r.day] = r; tot.views += r.views; tot.visitors += r.visitors; tot.likes += r.likes; tot.dislikes += r.dislikes || 0; });
    var today = istToday(), t = byDay[today] || { views: 0, visitors: 0 };
    var set = function (k, v) { var el = document.querySelector('[data-k="' + k + '"]'); if (el) el.textContent = v; };
    set('views', fmt(tot.views)); set('visitors', fmt(tot.visitors)); set('likes', fmt(tot.likes)); set('dislikes', fmt(tot.dislikes));
    var votes = tot.likes + tot.dislikes;
    set('likeSub', votes ? Math.round(tot.likes / votes * 100) + '% of ' + fmt(votes) + ' votes' : 'all time');
    set('today', fmt(t.views)); set('todaySub', fmt(t.views) + ' views · ' + fmt(t.visitors) + ' visitors');
    var week = 0, weekV = 0;
    for (var i = 0; i < 7; i++) { var w = byDay[addDays(today, -i)]; if (w) { week += w.views; weekV += w.visitors; } }
    set('week', fmt(week)); set('weekSub', 'views · ' + fmt(weekV) + ' visitors');
    if (!rows.length) $('[data-updated]').textContent = 'No visits recorded yet — numbers appear after the first visit.';
    else $('[data-updated]').textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · days in India time';

    // 30-day bar chart (single series: no legend; the title names it)
    var days = [];
    for (var j = 29; j >= 0; j--) { var iso = addDays(today, -j); days.push({ day: iso, v: byDay[iso] || { views: 0, visitors: 0, likes: 0, dislikes: 0 } }); }
    var max = Math.max.apply(null, days.map(function (d) { return d.v.views; }).concat([1]));
    var plot = $('[data-plot]'), axis = $('[data-axis]'), tip = $('[data-tip]');
    plot.textContent = ''; axis.textContent = '';
    days.forEach(function (d, k) {
      var col = document.createElement('div'); col.className = 'adm-col'; col.tabIndex = 0;
      col.setAttribute('aria-label', nice(d.day) + ': ' + d.v.views + ' views, ' + d.v.visitors + ' visitors');
      var bar = document.createElement('div'); bar.className = 'adm-bar' + (d.v.views ? '' : ' zero');
      bar.style.height = (d.v.views ? Math.max(3, d.v.views / max * 100) : 0) + '%';
      col.appendChild(bar); plot.appendChild(col);
      var showTip = function () {
        tip.textContent = '';
        var b = document.createElement('b'); b.textContent = nice(d.day); tip.appendChild(b);
        tip.appendChild(document.createTextNode(fmt(d.v.views) + ' views · ' + fmt(d.v.visitors) + ' visitors'));
        tip.hidden = false;
        var pr = plot.getBoundingClientRect(), cr = col.getBoundingClientRect(), fr = plot.parentNode.getBoundingClientRect();
        var x = cr.left + cr.width / 2 - fr.left;
        tip.style.left = Math.max(70, Math.min(fr.width - 70, x)) + 'px';
        tip.style.top = (pr.top - fr.top - 6) + 'px';
        col.classList.add('on');
      };
      var hideTip = function () { tip.hidden = true; col.classList.remove('on'); };
      col.addEventListener('mouseenter', showTip); col.addEventListener('focus', showTip);
      col.addEventListener('mouseleave', hideTip); col.addEventListener('blur', hideTip);
      if (k === 0 || k === 14 || k === 29) { var lab = document.createElement('span'); lab.textContent = k === 29 ? 'Today' : nice(d.day); lab.style.left = ((k + 0.5) / 30 * 100) + '%'; axis.appendChild(lab); }
    });
    var tb = $('[data-rows]'); tb.textContent = '';
    days.slice().reverse().forEach(function (d) {
      var tr = document.createElement('tr');
      [nice(d.day), fmt(d.v.views), fmt(d.v.visitors), fmt(d.v.likes), fmt(d.v.dislikes)].forEach(function (v, i) { var c = document.createElement(i ? 'td' : 'th'); if (!i) c.scope = 'row'; c.textContent = v; tr.appendChild(c); });
      tb.appendChild(tr);
    });
  }

  // ---------- Feedback ----------
  var LABELS = {
    who: ['Who visits', { recruiter: 'Recruiter / HR', manager: 'Hiring manager', peer: 'Colleague / peer', friend: 'Friend or family', exploring: 'Just exploring' }],
    stood_out: ['What stood out (👍)', { experience: 'Experience & impact', problems: 'Problems solved', ai: 'AI & things built', design: 'Design & feel', skills: 'Skills' }],
    intent: ['Want to connect (👍)', { yes: 'Yes, let’s talk', later: 'Maybe later', browsing: 'Just browsing' }],
    reason: ['What didn’t work (👎)', { long: 'Too long to read', hard_to_find: 'Hard to find information', design: 'Design or look', not_relevant: 'Not relevant to my role', broken: 'Something didn’t work', other: 'Something else' }],
    improve: ['Improve first (👎)', { content: 'Content', design: 'Design', speed: 'Speed', phone: 'Phone view', clarity: 'Clarity' }]
  };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function renderFeedback(list) {
    var sum = $('[data-fb-sum]'), box = $('[data-fb-list]');
    sum.textContent = ''; box.textContent = '';
    $('[data-fb-empty]').hidden = list.length > 0;
    if (!list.length) return;
    Object.keys(LABELS).forEach(function (k) {
      var counts = {}, n = 0;
      list.forEach(function (f) { var v = f.answers && f.answers[k]; if (v && LABELS[k][1][v]) { counts[v] = (counts[v] || 0) + 1; n++; } });
      if (!n) return;
      var card = el('div', 'adm-sum-card'); card.appendChild(el('h3', null, LABELS[k][0]));
      Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).forEach(function (v) {
        var row = el('div', 'adm-sum-row');
        row.appendChild(el('span', null, LABELS[k][1][v]));
        var meter = el('i'); meter.style.width = Math.round(counts[v] / n * 100) + '%'; var track = el('b'); track.appendChild(meter); row.appendChild(track);
        row.appendChild(el('em', null, String(counts[v])));
        card.appendChild(row);
      });
      sum.appendChild(card);
    });
    list.slice(0, 50).forEach(function (f) {
      var item = el('article', 'adm-fb-item ' + (f.vote === 'up' ? 'up' : 'down'));
      var head = el('div', 'adm-fb-head');
      head.appendChild(el('span', 'adm-fb-vote', f.vote === 'up' ? '👍' : '👎'));
      head.appendChild(el('time', null, new Date(f.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })));
      item.appendChild(head);
      var tags = el('div', 'adm-fb-tags');
      Object.keys(LABELS).forEach(function (k) { var v = f.answers && f.answers[k]; if (v && LABELS[k][1][v]) tags.appendChild(el('span', null, LABELS[k][1][v])); });
      item.appendChild(tags);
      if (f.note) item.appendChild(el('p', 'adm-fb-note', '“' + f.note + '”'));
      box.appendChild(item);
    });
  }

  function start() {
    $('[data-refresh]').hidden = true; $('[data-signout]').hidden = true;
    token().then(function (at) { if (at) load(); else show('login'); });
  }
  start();
})();
