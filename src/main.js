import './style.css';
import { CONFIG } from './config.js';
import { buildReport } from './report.js';
import { runCheck, normaliseUrl, CheckError } from './psi.js';
import { renderLoading, renderError, renderReport, renderHeroChip, renderPanelFilm, LOADING_STEPS } from './render.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const BASE = import.meta.env.BASE_URL;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const urlForm = $('#url-form');
const urlInput = $('#url-input');
const urlError = $('#url-error');
const checkBtn = $('#check-btn');
const reportSection = $('#report');
const reportBody = $('#report-body');

const state = {
  mode: null, // 'live' | 'sample'
  url: '',
  host: '',
  strategy: 'mobile',
  reports: {}, // strategy -> report
  controller: null,
};

// ---------- Sample data ----------
const sampleCache = {};
async function loadSample(strategy) {
  if (!sampleCache[strategy]) {
    sampleCache[strategy] = fetch(`${BASE}sample/sample-${strategy}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('Sample missing');
        return r.json();
      })
      .then((lhr) => buildReport(lhr, { source: 'sample' }));
  }
  return sampleCache[strategy];
}

// Fill the hero preview and the filmstrip panel with the real sample
loadSample('mobile')
  .then((r) => {
    $('#hero-chip').innerHTML = renderHeroChip(r);
    $('#panel-film').innerHTML = renderPanelFilm(r);
  })
  .catch(() => {
    $('.hero-chip')?.remove();
  });

// ---------- Running a check ----------
urlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let url;
  try {
    url = normaliseUrl(urlInput.value);
  } catch (err) {
    showUrlError(err.message);
    return;
  }
  showUrlError('');
  startLive(url);
});

urlInput.addEventListener('input', () => {
  if (urlError.textContent) showUrlError('');
});

function showUrlError(msg) {
  urlError.textContent = msg;
  urlForm.classList.toggle('has-error', !!msg);
  urlInput.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (msg) urlInput.focus();
}

function startLive(url) {
  state.mode = 'live';
  state.url = url;
  state.host = hostOf(url);
  state.reports = {};
  state.strategy = 'mobile';
  setQuery({ url });
  runStrategy('mobile');
}

async function runStrategy(strategy) {
  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;
  state.strategy = strategy;

  openReportSection();
  reportBody.innerHTML = renderLoading(state.host);
  checkBtn.disabled = true;
  checkBtn.classList.add('is-loading');
  const stopTicker = startTicker();
  focusReport();

  try {
    const lhr = await runCheck(state.url, strategy, { signal: controller.signal });
    if (controller.signal.aborted) return;
    state.reports[strategy] = buildReport(lhr, { source: 'live' });
    showReport();
    // The report is much taller than the loading card, so re-anchor to its top
    reportSection.scrollIntoView({ block: 'start' });
  } catch (err) {
    if (controller.signal.aborted) return;
    const e = err instanceof CheckError ? err : new CheckError('failed', 'Something went wrong while checking your site. Please try again in a minute.');
    reportBody.innerHTML = renderError(e, state.host);
  } finally {
    stopTicker();
    if (state.controller === controller) {
      checkBtn.disabled = false;
      checkBtn.classList.remove('is-loading');
      state.controller = null;
    }
  }
}

async function showSample(strategy = 'mobile') {
  state.controller?.abort();
  state.mode = 'sample';
  state.strategy = strategy;
  openReportSection();
  try {
    state.reports[strategy] = await loadSample(strategy);
    state.host = state.reports[strategy].host;
    setQuery({ sample: '1' });
    showReport();
    focusReport();
  } catch {
    reportBody.innerHTML = renderError(new CheckError('failed', 'The sample report could not be loaded. Please refresh the page.'), 'the sample');
  }
}

function showReport() {
  const r = state.reports[state.strategy];
  reportBody.innerHTML = renderReport(r, { strategy: state.strategy, canSwitch: true });
  animateReport();
  wireLeadForm(r);
}

// Loading steps move on with time, since Google gives no progress events
function startTicker() {
  const start = performance.now();
  const id = setInterval(() => {
    const s = (performance.now() - start) / 1000;
    const el = $('#elapsed');
    if (el) el.textContent = Math.floor(s);
    const active = Math.min(LOADING_STEPS.length - 1, Math.floor(s / 7));
    $$('#loading-steps li').forEach((li, i) => {
      li.classList.toggle('is-done', i < active);
      li.classList.toggle('is-active', i === active);
    });
  }, 250);
  return () => clearInterval(id);
}

function openReportSection() {
  reportSection.hidden = false;
}

function focusReport() {
  reportSection.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
}

// ---------- Report interactions ----------
reportBody.addEventListener('click', async (e) => {
  const strategyBtn = e.target.closest('[data-strategy]');
  const action = e.target.closest('[data-action]')?.dataset.action;

  if (strategyBtn && strategyBtn.tagName === 'BUTTON') {
    const next = strategyBtn.dataset.strategy;
    if (next === state.strategy) return;
    if (state.reports[next]) {
      state.strategy = next;
      showReport();
    } else if (state.mode === 'sample') {
      showSample(next);
    } else {
      runStrategy(next);
    }
    return;
  }

  if (action === 'cancel') {
    state.controller?.abort();
    state.controller = null;
    checkBtn.disabled = false;
    checkBtn.classList.remove('is-loading');
    reportSection.hidden = true;
    setQuery({});
    urlInput.focus();
  } else if (action === 'retry') {
    if (state.mode === 'sample' || !state.url) showSample();
    else runStrategy(state.strategy);
  } else if (action === 'sample') {
    showSample();
  } else if (action === 'print') {
    $$('.report details').forEach((d) => (d.open = true));
    window.print();
  } else if (action === 'copy') {
    try {
      await navigator.clipboard.writeText(location.href);
      toast('Link copied. Anyone with it can run the same check.');
    } catch {
      toast('Could not copy. Copy the address from your browser bar instead.');
    }
  }
});

function animateReport() {
  const scores = $$('.report .score');
  if (reduceMotion.matches) {
    scores.forEach((s) => s.classList.add('is-in'));
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => scores.forEach((s) => s.classList.add('is-in'))));
  $$('.report .score-num').forEach((el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target) || el.dataset.count === '') return;
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ---------- Lead form ----------
function wireLeadForm(report) {
  const form = $('#lead-form');
  if (!form) return;
  const note = $('#lead-note');
  const fields = {
    name: { el: $('#lead-name'), check: (v) => (v.trim().length >= 2 ? '' : 'Tell us your name.') },
    email: { el: $('#lead-email'), check: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter an email address we can reply to.') },
  };

  if (!CONFIG.formEndpoint && !CONFIG.contactEmail) note.textContent = 'Demo mode: requests are not sent anywhere yet.';
  else if (!CONFIG.formEndpoint) note.textContent = 'This opens your email app with the report attached as text.';

  const validate = (key) => {
    const f = fields[key];
    const msg = f.check(f.el.value);
    const err = $(`#${f.el.id}-error`);
    f.el.closest('.field').classList.toggle('has-error', !!msg);
    f.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) f.el.setAttribute('aria-describedby', err.id);
    else f.el.removeAttribute('aria-describedby');
    err.textContent = msg;
    return !msg;
  };
  Object.keys(fields).forEach((k) => {
    fields[k].el.addEventListener('blur', () => fields[k].el.value && validate(k));
    fields[k].el.addEventListener('input', () => fields[k].el.closest('.field').classList.contains('has-error') && validate(k));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = Object.keys(fields).map(validate);
    const firstBad = Object.keys(fields).find((k, i) => !ok[i]);
    if (firstBad) return fields[firstBad].el.focus();

    const topics = $$('input[name="topics"]:checked', form).map((i) => i.value);
    const payload = {
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      website: report.url,
      device: report.strategy,
      topics: topics.join(', ') || 'Not specified',
      scores: `Speed ${report.scores.speed}, Mobile ${report.scores.mobile}, Search ${report.scores.search}, Accessibility ${report.scores.access}`,
      top_issues: report.issues.slice(0, 5).map((i) => `- ${i.title}`).join('\n'),
    };

    const btn = $('button[type="submit"]', form);
    btn.classList.add('is-loading');
    btn.disabled = true;
    try {
      if (CONFIG.formEndpoint) {
        const res = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            ...payload,
            // FormSubmit options: email subject, reply-to, and a table layout
            _subject: `Fix plan request: ${report.host}`,
            _replyto: payload.email,
            _template: 'table',
            _captcha: 'false',
          }),
        });
        const data = await res.json().catch(() => ({}));
        // FormSubmit answers 200 with success "false" until the inbox is activated
        if (!res.ok || String(data.success) === 'false') throw new Error(data.message || 'send failed');
      } else if (CONFIG.contactEmail) {
        const body = Object.entries(payload).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join('\n');
        location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(`Fix plan request: ${report.host}`)}&body=${encodeURIComponent(body)}`;
      } else {
        await new Promise((r) => setTimeout(r, 900));
      }
      form.hidden = true;
      const done = $('#lead-success');
      $('#lead-success-text').textContent = CONFIG.formEndpoint || CONFIG.contactEmail
        ? `Thanks, ${payload.name.split(' ')[0]}. Your report is on its way to JVA, and we will reply to ${payload.email}.`
        : `Thanks, ${payload.name.split(' ')[0]}. This is a demo, so nothing was sent, but this is where your request would go.`;
      done.hidden = false;
      done.focus();
    } catch (err) {
      console.warn('Fix plan request failed:', err.message);
      note.textContent = 'That did not send. Please try again in a moment.';
      note.classList.add('is-error');
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  });
}

// ---------- Small helpers ----------
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function setQuery(params) {
  const q = new URLSearchParams(params).toString();
  history.replaceState(null, '', q ? `?${q}` : location.pathname);
}

let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
}

$('#sample-btn').addEventListener('click', () => showSample());

// Links labelled "Check my site" bring the visitor back to the input
$$('[data-focus-url]').forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(false);
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    setTimeout(() => urlInput.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 500);
  })
);

// ---------- Theme ----------
const themeBtn = $('#theme-toggle');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : darkQuery.matches;
};
function syncThemeIcon() {
  const dark = isDark();
  themeBtn.innerHTML = `<i class="ph-light ${dark ? 'ph-sun' : 'ph-moon'}" aria-hidden="true"></i>`;
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
themeBtn.addEventListener('click', () => {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('pagebrief-theme', next);
  } catch {}
  syncThemeIcon();
});
darkQuery.addEventListener('change', syncThemeIcon);
syncThemeIcon();

// ---------- Mobile menu ----------
const menuBtn = $('#menu-toggle');
const menu = $('#mobile-menu');
function setMenu(open) {
  menu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) {
    setMenu(false);
    menuBtn.focus();
  }
});
window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => e.matches && setMenu(false));

// ---------- Scroll reveals ----------
const revealIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('is-in');
        revealIO.unobserve(en.target);
      }
    }),
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
$$('.reveal').forEach((el) => revealIO.observe(el));

// Highlight the index item for the panel in view
const indexLinks = $$('#index-list a');
const panelIO = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const key = en.target.dataset.panel;
      indexLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.index === key));
    }),
  { rootMargin: '-45% 0px -50% 0px' }
);
$$('[data-panel]').forEach((p) => panelIO.observe(p));

// ---------- Deep links ----------
// A shared link (?url=...) runs the check when first opened. Reloading the
// page starts over instead: empty input, no report, back at the top.
const navType = performance.getEntriesByType('navigation')[0]?.type;
if (navType === 'reload') {
  history.scrollRestoration = 'manual';
  if (location.search) history.replaceState(null, '', location.pathname);
  urlForm.reset();
  urlInput.value = '';
  window.scrollTo(0, 0);
}

const params = new URLSearchParams(location.search);
if (params.get('url')) {
  urlInput.value = params.get('url');
  try {
    startLive(normaliseUrl(params.get('url')));
  } catch (err) {
    showUrlError(err.message);
  }
} else if (params.get('sample')) {
  showSample();
}
