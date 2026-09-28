import { CATEGORIES, rating, formatMs } from './report.js';

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const CAT_BLURB = {
  speed: 'How fast the page appears and responds',
  mobile: 'How it looks and works on a phone',
  search: 'How easily Google can read and list it',
  access: 'Whether everyone can read and use it',
};

const CAT_ICON = { speed: 'ph-timer', mobile: 'ph-device-mobile', search: 'ph-magnifying-glass', access: 'ph-person-arms-spread', basics: 'ph-shield-check' };
const CAT_NAME = { speed: 'Speed', mobile: 'Mobile', search: 'Search', access: 'Accessibility', basics: 'Security and basics' };

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- Loading state ----------
export const LOADING_STEPS = [
  'Opening your site on a simulated phone',
  'Timing how long each part takes to appear',
  'Checking buttons, text and layout on a small screen',
  'Reading the page the way Google does',
  'Checking it works for visitors with disabilities',
  'Translating the results into plain English',
];

export function renderLoading(host) {
  return `
    <div class="loading" role="status">
      <div class="loading-head">
        <p class="loading-host">Checking <strong>${esc(host)}</strong></p>
        <p class="loading-time"><span id="elapsed">0</span> s</p>
      </div>
      <ol class="loading-steps" id="loading-steps">
        ${LOADING_STEPS.map((s, i) => `<li data-step="${i}"><span class="tick" aria-hidden="true"></span>${s}</li>`).join('')}
      </ol>
      <p class="loading-note">Google loads your site from scratch, so this usually takes 20 to 60 seconds.</p>
      <button class="text-link" type="button" data-action="cancel">Cancel</button>
    </div>`;
}

export function renderError(err, host) {
  const extra =
    err.kind === 'quota'
      ? '<p>While you wait, the sample report shows exactly what you will get.</p>'
      : err.kind === 'unreachable'
        ? '<p>Tip: open the address in a new tab to check it loads, then paste it here exactly as shown.</p>'
        : '';
  return `
    <div class="error-card bezel">
      <div class="bezel-core">
        <i class="ph-light ph-warning-circle" aria-hidden="true"></i>
        <h2>We couldn’t check ${esc(host || 'that site')}</h2>
        <p>${esc(err.message)}</p>
        ${extra}
        <div class="error-actions">
          <button class="btn btn-dark btn-sm" type="button" data-action="retry">Try again</button>
          <button class="btn btn-ghost btn-sm" type="button" data-action="sample">See the sample report</button>
        </div>
      </div>
    </div>`;
}

// ---------- Report ----------
export function renderReport(r, { strategy, canSwitch }) {
  const checkedOn = r.fetchedAt ? dateFmt.format(new Date(r.fetchedAt)) : '';
  const device = r.strategy === 'desktop' ? 'a computer' : 'a phone';

  return `
    <div class="report" data-strategy="${r.strategy}">
      <div class="report-bar">
        <div class="report-id">
          ${r.source === 'sample' ? '<p class="sample-flag">Sample report</p>' : ''}
          <h2 class="report-host ${r.host.length > 26 ? 'is-long' : ''}">${esc(r.host)}</h2>
          <p class="report-meta">Checked ${checkedOn} on ${device}${r.source === 'sample' ? '. Paste your own address above to check your site.' : ''}</p>
        </div>
        <div class="report-tools">
          ${
            canSwitch
              ? `<div class="segmented" role="group" aria-label="Device">
              <button type="button" data-strategy="mobile" class="${strategy === 'mobile' ? 'is-active' : ''}" aria-pressed="${strategy === 'mobile'}"><i class="ph-light ph-device-mobile" aria-hidden="true"></i>Phone</button>
              <button type="button" data-strategy="desktop" class="${strategy === 'desktop' ? 'is-active' : ''}" aria-pressed="${strategy === 'desktop'}"><i class="ph-light ph-desktop" aria-hidden="true"></i>Computer</button>
            </div>`
              : ''
          }
          <button class="icon-btn" type="button" data-action="print" aria-label="Save report as PDF" title="Save as PDF"><i class="ph-light ph-file-pdf" aria-hidden="true"></i></button>
          <button class="icon-btn" type="button" data-action="copy" aria-label="Copy link to this report" title="Copy link"><i class="ph-light ph-link-simple" aria-hidden="true"></i></button>
        </div>
      </div>

      <div class="report-grid">
        <div class="bezel verdict">
          <div class="bezel-core">
            <p class="verdict-head">${esc(r.summary.headline)}</p>
            <p class="verdict-detail">${esc(r.summary.detail)}</p>
          </div>
        </div>

        <div class="scores">
          ${Object.keys(CATEGORIES).map((k, i) => scoreCard(k, r.scores[k], i)).join('')}
        </div>

        <figure class="device ${r.strategy}">
          ${
            r.screenshot
              ? `<div class="device-frame"><img src="${r.screenshot}" alt="How ${esc(r.host)} looked at the end of the check" /></div>`
              : '<div class="device-frame device-empty">No screenshot</div>'
          }
          <figcaption>What visitors saw at the end of the check</figcaption>
        </figure>

        ${timeline(r)}

        <div class="bezel metrics-card">
          <div class="bezel-core">
            <h3>The numbers, in plain words</h3>
            <dl class="metrics">
              ${r.metrics
                .map(
                  (m) => `
                <div class="metric ${m.good ? 'is-good' : 'is-slow'}">
                  <dt>${esc(m.label)}</dt>
                  <dd><strong>${esc(m.value)}</strong><span>${esc(m.targetText)}</span></dd>
                </div>`
                )
                .join('')}
            </dl>
          </div>
        </div>
      </div>

      ${issuesBlock(r)}

      <div class="report-foot">
        ${passedBlock(r)}
        ${leadForm(r)}
      </div>

      <p class="print-credit">Report by Pagebrief, a JVA project. Run your own free check at pagebrief-iota.vercel.app. Need these fixed? jianaguilos@gmail.com</p>
    </div>`;
}

function scoreCard(key, score, i) {
  const rt = rating(score);
  const C = 2 * Math.PI * 44;
  const offset = score == null ? C : C * (1 - score / 100);
  return `
    <div class="score score-${rt.key}" style="--i:${i}">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle class="score-track" cx="50" cy="50" r="44" />
        <circle class="score-arc" cx="50" cy="50" r="44" stroke-dasharray="${C.toFixed(2)}" style="--offset:${offset.toFixed(2)}" />
      </svg>
      <p class="score-num" data-count="${score ?? ''}">${score ?? '-'}</p>
      <div class="score-text">
        <h3>${CATEGORIES[key].label}</h3>
        <p class="score-word">${rt.word}</p>
        <p class="score-blurb">${CAT_BLURB[key]}</p>
      </div>
      <span class="sr-only">${CATEGORIES[key].label}: ${score ?? 'not tested'} out of 100, ${rt.word}.</span>
    </div>`;
}

function timeline(r) {
  const frames = r.filmstrip;
  if (!frames.length) return '';
  const n = frames.length;
  const end = frames[n - 1].t || 1;
  const step = end / n;
  const fcp = r.metrics.find((m) => m.id === 'first-contentful-paint');
  const lcp = r.metrics.find((m) => m.id === 'largest-contentful-paint');
  // Frame i is drawn centred at (i + 0.5) / n and shows time (i + 1) * step
  const pos = (ms) => Math.max(0, Math.min(100, ((ms / step - 0.5) / n) * 100));
  const edge = (p) => (p < 12 ? 'at-start' : p > 88 ? 'at-end' : '');
  const marker = (m, cls, label) =>
    m
      ? `<span class="tl-marker ${cls} ${edge(pos(m.raw))}" style="--x:${pos(m.raw)}%"><span>${label} <strong>${esc(m.value)}</strong>${m.raw > end ? ' →' : ''}</span></span>`
      : '';
  const targetInside = 2500 <= end;

  return `
    <div class="bezel timeline-card">
      <div class="bezel-core">
        <div class="timeline-head">
          <h3>What a visitor sees while it loads</h3>
          <p>Each frame is a real snapshot of your page, second by second.</p>
        </div>
        <div class="timeline-scroll" tabindex="0" aria-label="Loading filmstrip">
          <div class="timeline" style="--n:${frames.length}">
            <ol class="frames">
              ${frames
                .map(
                  (f) => `
                <li>
                  <img src="${f.src}" alt="Page after ${formatMs(f.t)}" loading="lazy" />
                  <span>${formatMs(f.t)}</span>
                </li>`
                )
                .join('')}
            </ol>
            <div class="tl-axis">
              ${targetInside ? `<span class="tl-target ${edge(pos(2500))}" style="--x:${pos(2500)}%"><span>Google’s target 2.5 s</span></span>` : ''}
              ${marker(fcp, 'tl-fcp', 'First paint')}
              ${marker(lcp, 'tl-lcp', 'Main content')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function issueItem(issue, open = false) {
  const who = issue.who === 'you' ? '<span class="who who-you">You can usually fix this</span>' : '<span class="who who-dev">Needs a developer</span>';
  return `
    <details class="issue sev-${issue.severity}" ${open ? 'open' : ''}>
      <summary>
        <span class="issue-cat"><i class="ph-light ${CAT_ICON[issue.category]}" aria-hidden="true"></i><span class="sr-only">${CAT_NAME[issue.category]}:</span></span>
        <span class="issue-title">${esc(issue.title)}</span>
        <span class="issue-sev">${issue.severity === 'critical' ? 'Urgent' : issue.severity === 'high' ? 'Big impact' : issue.severity === 'medium' ? 'Worth fixing' : 'Minor'}</span>
        <i class="ph-light ph-caret-down issue-caret" aria-hidden="true"></i>
      </summary>
      <div class="issue-body">
        <p>${esc(issue.why)}</p>
        ${issue.gain ? `<p class="issue-gain"><i class="ph-light ph-trend-up" aria-hidden="true"></i>${esc(issue.gain)}</p>` : ''}
        ${issue.fix ? `<p><strong>What to do:</strong> ${esc(issue.fix)}</p>` : ''}
        <div class="issue-meta">
          ${who}
          <span class="tech">For your developer: “${esc(issue.technical)}”</span>
        </div>
      </div>
    </details>`;
}

function issuesBlock(r) {
  if (!r.issues.length) {
    return `
      <div class="issues issues-clear">
        <h3>Nothing urgent to fix</h3>
        <p>Every check we run passed. Keep an eye on new images and plugins, which are the usual culprits when a good site gets slower.</p>
      </div>`;
  }
  const top = r.issues.slice(0, 5);
  const rest = r.issues.slice(5);
  return `
    <div class="issues">
      <div class="issues-head">
        <h3>Fix these first</h3>
        <p>Ranked by how much each one is likely to cost you in visitors.</p>
      </div>
      <div class="issue-list">${top.map((x, i) => issueItem(x, i === 0)).join('')}</div>
      ${
        rest.length
          ? `<details class="more-issues">
              <summary>${rest.length} smaller ${rest.length === 1 ? 'thing' : 'things'} we also found</summary>
              <div class="issue-list">${rest.map((x) => issueItem(x)).join('')}</div>
            </details>`
          : ''
      }
    </div>`;
}

function passedBlock(r) {
  const rows = ['speed', 'mobile', 'search', 'access', 'basics']
    .filter((k) => r.passed[k])
    .map(
      (k) => `<li><i class="ph-light ${CAT_ICON[k]}" aria-hidden="true"></i><span>${CAT_NAME[k]}</span><strong>${r.passed[k]}</strong></li>`
    )
    .join('');
  const total = Object.values(r.passed).reduce((a, b) => a + b, 0);
  return `
    <div class="bezel passed">
      <div class="bezel-core">
        <h3>Already working</h3>
        <p><strong>${total}</strong> checks passed. These are the things you do not need to worry about.</p>
        <ul>${rows}</ul>
      </div>
    </div>`;
}

function leadForm(r) {
  const weak = Object.keys(CATEGORIES).filter((k) => r.scores[k] != null && r.scores[k] < 90);
  return `
    <div class="bezel lead">
      <div class="bezel-core">
        <form class="lead-form" id="lead-form" novalidate>
          <h3>Want these fixed?</h3>
          <p>Send this report to JVA and get a free fix plan with a quote for the work. No obligation.</p>
          <fieldset class="lead-topics">
            <legend>What would you like help with?</legend>
            ${Object.keys(CATEGORIES)
              .map(
                (k) => `<label class="chip"><input type="checkbox" name="topics" value="${CATEGORIES[k].label}" ${weak.includes(k) ? 'checked' : ''} /><span>${CATEGORIES[k].label}</span></label>`
              )
              .join('')}
          </fieldset>
          <div class="field">
            <label for="lead-name">Your name</label>
            <input id="lead-name" name="name" type="text" autocomplete="name" required />
            <p class="field-error" id="lead-name-error"></p>
          </div>
          <div class="field">
            <label for="lead-email">Email</label>
            <input id="lead-email" name="email" type="email" autocomplete="email" required />
            <p class="field-error" id="lead-email-error"></p>
          </div>
          <button class="btn btn-dark btn-block" type="submit">
            <span class="btn-label">Send me a fix plan</span>
            <span class="btn-icon"><i class="ph-light ph-paper-plane-tilt" aria-hidden="true"></i></span>
          </button>
          <p class="form-note" id="lead-note"></p>
        </form>
        <div class="lead-success" id="lead-success" hidden tabindex="-1">
          <i class="ph-light ph-check-circle" aria-hidden="true"></i>
          <h3>Got it</h3>
          <p id="lead-success-text"></p>
        </div>
      </div>
    </div>`;
}

// Small preview for the hero, built from the sample report
export function renderHeroChip(r) {
  return `
    <p class="chip-head"><span>${esc(r.host)}, on a phone</span><span>Sample</span></p>
    <ul class="chip-scores">
      ${Object.keys(CATEGORIES)
        .map((k) => {
          const rt = rating(r.scores[k]);
          return `<li class="score-${rt.key}"><strong>${r.scores[k] ?? '-'}</strong><span>${CATEGORIES[k].label}</span></li>`;
        })
        .join('')}
    </ul>
    <p class="chip-line">${esc(r.metrics.find((m) => m.id === 'largest-contentful-paint')?.label || '')}: <strong>${esc(r.metrics.find((m) => m.id === 'largest-contentful-paint')?.value || '')}</strong></p>`;
}

// Filmstrip used in the "What we check" section
export function renderPanelFilm(r) {
  // Six frames spread across the load, always ending on the finished page
  const all = r.filmstrip;
  const frames = all.length <= 6 ? all : [0, 1, 2, 3, 4, 5].map((i) => all[Math.round((i * (all.length - 1)) / 5)]);
  return `
    <ol class="mini-film">
      ${frames.map((f) => `<li><img src="${f.src}" alt="" loading="lazy" /><span>${formatMs(f.t)}</span></li>`).join('')}
    </ol>
    <p class="mini-film-note">A real load of ${esc(r.host)} on a phone. The main content took ${esc(r.metrics.find((m) => m.id === 'largest-contentful-paint')?.value || '')} to appear.</p>`;
}
